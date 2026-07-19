import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../reputation/config.service';

@Controller('v1/tasks')
export class TasksController {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  @Get('feed')
  async getFeed(@Query('limit') limitStr: string) {
    const limit = parseInt(limitStr || '10', 10);
    const cfg = await this.config.active();
    
    // We want to interleave canary tasks at `injectionRate`
    // E.g. if injectionRate is 0.05, we draw 1 canary for every 20 real tasks roughly
    const injectionRate = cfg.params.canary.injectionRate; // e.g. 0.05

    // Fetch some real pending moderation tasks (not implemented fully, so we mock or fetch from ModerationQueue)
    const realTasks = await this.prisma.moderationQueue.findMany({
      where: { reviewedAt: null },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });

    // Determine how many canaries to inject based on a probabilistic draw per slot, 
    // or deterministically based on rate.
    // For simplicity, we just inject deterministically to hit the rate.
    const numCanaries = Math.floor(limit * injectionRate) || (Math.random() < (limit * injectionRate) ? 1 : 0);

    let canaries: any[] = [];
    if (numCanaries > 0) {
      // Pick random active canaries
      canaries = await this.prisma.canaryTask.findMany({
        where: { active: true },
        take: numCanaries,
        orderBy: { servedCount: 'asc' }, // round-robin
      });

      // Update their servedCount
      if (canaries.length > 0) {
        await this.prisma.canaryTask.updateMany({
          where: { id: { in: canaries.map(c => c.id) } },
          data: { servedCount: { increment: 1 } }
        });
      }
    }

    // Mix them
    const feed = [...realTasks, ...canaries];
    
    // Shuffle the feed so the position of the canary is unpredictable
    for (let i = feed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [feed[i], feed[j]] = [feed[j], feed[i]];
    }

    // Map them to an indistinguishable DTO format
    return {
      data: feed.map(item => {
        const isCanary = 'subjectHash' in item;
        return {
          id: item.id,
          targetType: isCanary ? 'CANARY_SUBJECT' : item.targetType,
          targetId: isCanary ? item.subjectHash : item.targetId,
          // Omitting fields that give away it's a canary
          createdAt: item.createdAt,
        };
      })
    };
  }
}
