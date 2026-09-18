import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PagesService } from './pages.service.js';

@Controller('admin/pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  // 1. Blazing fast MySQL pagination endpoint for table rendering
  @Get()
  async getPages(@Query() query: { page?: string; limit?: string; search?: string }) {
    return this.pagesService.getPagesFromDb(query);
  }

  // 2. Manual GitHub sync endpoint (triggered only by the Scan/Refresh button)
  @Get('scan')
  async scanGitHub() {
    return this.pagesService.scanGitHubPages();
  }

  // 3. Save or update single/multiple pages
  @Post('save')
  async savePages(@Body() body: any) {
    return this.pagesService.savePage(body);
  }
}