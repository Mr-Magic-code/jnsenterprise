import { Controller, Get, Post, Put, Delete, Body, Query } from '@nestjs/common';
import { EventsService } from './events.service.js';

@Controller('admin/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async getEvents() {
    return this.eventsService.getEvents();
  }

  // Public endpoint public website ke liye
  @Get('../events/public')
  async getPublicEvents() {
    return this.eventsService.getEvents();
  }

  @Post()
  async createEvent(@Body() body: any) {
    return this.eventsService.createEvent(body);
  }

  @Put()
  async updateEvent(@Body() body: any) {
    return this.eventsService.updateEvent(body);
  }

  @Delete()
  async deleteEvent(@Query('id') id: number) {
    return this.eventsService.deleteEvent(Number(id));
  }
}