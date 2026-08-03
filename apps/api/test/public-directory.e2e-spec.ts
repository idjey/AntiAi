import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';

// Mock redis & bull
jest.mock('ioredis', () => {
  const RedisMock = require('ioredis-mock');
  RedisMock.Redis = RedisMock;
  RedisMock.default = RedisMock;
  return RedisMock;
});
jest.mock('bullmq', () => ({
  Queue: class { add = jest.fn(); on = jest.fn(); close = jest.fn(); },
  Worker: class { on = jest.fn(); close = jest.fn(); },
  QueueEvents: class { on = jest.fn(); close = jest.fn(); },
}));
jest.mock('bull', () => {
  return class {
    constructor() {}
    add = jest.fn();
    on = jest.fn();
    process = jest.fn();
    close = jest.fn();
  };
});

describe('Public Directory Featuring Logic (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    prisma = new PrismaClient();
    
    await prisma.user.deleteMany({
      where: { email: { contains: '@example.com' } }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('should explicitly separate Elite (featured) from high-view (trending)', async () => {
    // 1. Create Elite User
    const eliteUser = await prisma.user.create({
        include: { profile: true },
        data: {
            email: 'elite-dir-test@example.com',
            
            subscription: {
                create: {
                    plan: 'elite',
                    status: 'active'
                }
            },
            profile: {
                create: {
                    displayName: 'Elite Creator',
                    handle: 'elitecreator_test',
                    isPublic: true
                }
            }
        }
    });

    // 2. Create Enterprise User (Should NOT be auto-featured)
    const enterpriseUser = await prisma.user.create({
        include: { profile: true },
        data: {
            email: 'enterprise-dir@example.com',
            
            subscription: {
                create: {
                    plan: 'enterprise',
                    status: 'active'
                }
            },
            profile: {
                create: {
                    displayName: 'Enterprise Firm',
                    handle: 'entfirm_test',
                    isPublic: true
                }
            }
        }
    });

    // 3. Create Free User with Views (Trending)
    const trendingUser = await prisma.user.create({
        include: { profile: true },
        data: {
            email: 'trending-dir@example.com',
            
            subscription: {
                create: {
                    plan: 'free',
                    status: 'active'
                }
            },
            profile: {
                create: {
                    displayName: 'Trending Organic',
                    handle: 'trendorg_test',
                    isPublic: true
                }
            }
        }
    });

    // Add views to trending organic user
    await prisma.analyticsEvent.createMany({
        data: Array(10).fill(0).map(() => ({
            type: 'view',
            creatorId: trendingUser.profile!.id,
            ipHash: 'test'
        }))
    });

    // Add views to elite user (to prove they don't leak into trending)
    await prisma.analyticsEvent.createMany({
        data: Array(15).fill(0).map(() => ({
            type: 'view',
            creatorId: eliteUser.profile!.id,
            ipHash: 'test'
        }))
    });

    const response = await request(app.getHttpServer())
      .get('/public/creators')
      .expect(200);

    const { featured, trending } = response.body;

    // Elite user should be in featured and NOT in trending
    const isEliteInFeatured = featured.some((f: any) => f.handle === 'elitecreator_test');
    const isEliteInTrending = trending.some((t: any) => t.handle === 'elitecreator_test');

    expect(isEliteInFeatured).toBe(true);
    expect(isEliteInTrending).toBe(false);

    // Featured users should have premiumBadge = true
    const eliteResult = featured.find((f: any) => f.handle === 'elitecreator_test');
    expect(eliteResult.premiumBadge).toBe(true);

    // Enterprise user should NOT be featured (b2b privacy)
    const isEnterpriseInFeatured = featured.some((f: any) => f.handle === 'entfirm_test');
    expect(isEnterpriseInFeatured).toBe(false);

    // Trending organic user should be in trending and NOT in featured
    const isOrganicInFeatured = featured.some((f: any) => f.handle === 'trendorg_test');
    const isOrganicInTrending = trending.some((t: any) => t.handle === 'trendorg_test');

    expect(isOrganicInFeatured).toBe(false);
    expect(isOrganicInTrending).toBe(true);

    // Trending users should have premiumBadge = false
    const organicResult = trending.find((t: any) => t.handle === 'trendorg_test');
    expect(organicResult.premiumBadge).toBe(false);

    // Cleanup
    await prisma.analyticsEvent.deleteMany({
        where: { creatorId: { in: [eliteUser.id, enterpriseUser.id, trendingUser.id] } }
    });
    await prisma.creatorProfile.deleteMany({
        where: { userId: { in: [eliteUser.id, enterpriseUser.id, trendingUser.id] } }
    });
    await prisma.subscription.deleteMany({
        where: { userId: { in: [eliteUser.id, enterpriseUser.id, trendingUser.id] } }
    });
    await prisma.user.deleteMany({
        where: { id: { in: [eliteUser.id, enterpriseUser.id, trendingUser.id] } }
    });
  });
});
