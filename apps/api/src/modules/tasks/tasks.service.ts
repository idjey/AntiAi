import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../reputation/config.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async getFeed(identityId: string, limit: number) {
    const cfg = await this.config.active();
    const injectionRate = cfg.params.flags.canaryInjection ? 0.1 : 0; // e.g. 10% chance
    
    const items = [];
    const count = Math.min(limit, 50);

    for (let i = 0; i < count; i++) {
      if (Math.random() < injectionRate) {
        // Inject Canary
        const canary = await this.prisma.canaryTask.findFirst({
          where: { active: true },
          orderBy: { servedCount: 'asc' }, // Serve less-served canaries
        });
        
        if (canary) {
          items.push({
            subjectHash: canary.subjectHash,
            mediaType: canary.mediaType,
            // Omit groundTruth obviously!
            injectedCanary: true, // Internal debug flag, remove in prod
          });
          continue;
        }
      }

      // Fetch normal subject (mocking random fetch for feed)
      // In a real implementation we would fetch subjects needing attention
      const subject = await this.prisma.subject.findFirst({
        orderBy: { attestationCount: 'asc' },
        skip: Math.floor(Math.random() * 100),
      });

      if (subject) {
        items.push({
          subjectHash: subject.hash,
          mediaType: subject.mediaType,
        });
      }
    }

    // Shuffle and format identically
    return items.map(item => ({
      subjectHash: item.subjectHash,
      mediaType: item.mediaType,
    }));
  }
}
