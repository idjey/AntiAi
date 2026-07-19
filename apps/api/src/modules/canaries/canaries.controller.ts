import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { CanariesService } from './canaries.service';

@Controller('v1/canaries')
export class CanariesController {
  constructor(private readonly canariesService: CanariesService) {}

  @Post()
  async createCanaryTask(@Body() dto: any) {
    // Admin only
    return { status: 'created' };
  }

  @Post(':id/force-fail')
  async forceFail(@Param('id') id: string) {
    return this.canariesService.forceFailCanary(id);
  }
}
