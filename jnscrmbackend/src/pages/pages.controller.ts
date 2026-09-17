import { Controller, Get, Post, Body } from '@nestjs/common';
import { PagesService } from './pages.service.js';

@Controller('admin/pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  // 1. Scan GitHub pages route
  @Get('scan')
  async scanPages() {
    return await this.pagesService.scanGitHubPages();
  }

  // 2. Save page to database route
  @Post('save')
  async savePage(@Body() body: { title: string; slug: string; parent_slug?: string; status?: string }) {
    return await this.pagesService.savePage(body);
  }
}