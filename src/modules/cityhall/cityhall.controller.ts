import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CityHallService } from './cityhall.service';
import { CreateCityHallDto, UpdateCityHallDto } from './cityhall.dto';
// import { AuthGuard } from '../../auth/guards/auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('cityhall')
// @UseGuards(AuthGuard)
// @UseGuards(RolesGuard)
// @Roles('ADMIN', 'MASTER')
export class CityHallController {
  constructor(private readonly service: CityHallService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateCityHallDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCityHallDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
} 