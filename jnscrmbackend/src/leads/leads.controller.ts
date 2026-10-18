import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { LeadsService } from './leads.service.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(createLeadDto);
  }

  @Get('form-types')
  getFormTypes() {
    return this.leadsService.getFormTypes();
  }

  @Get()
  findAll(
    @Query('formType') formType?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('dateFilter') dateFilter?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.leadsService.findAll(
      formType, 
      status, 
      search, 
      dateFilter,
      startDate,
      endDate,
      page ? Number(page) : 1, 
      limit ? Number(limit) : 100
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string, // Updated to generic string to avoid validation crashes
  ) {
    return this.leadsService.updateStatus(+id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leadsService.remove(+id);
  }
}