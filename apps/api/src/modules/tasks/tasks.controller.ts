import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('v1/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('feed')
  async getFeed(@Query('limit') limit: number = 10, @Req() req: any) {
    // Identity ID from request (assuming auth guard is used, we mock it for now if not)
    const identityId = req.user?.identityId || 'anonymous';
    return this.tasksService.getFeed(identityId, Number(limit));
  }
}
