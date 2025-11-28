import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SprintsService } from './sprints.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('Sprints')
@Controller('sprints')
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới một sprint' })
  async create(@Body() createSprintDto: CreateSprintDto) {
    return this.sprintsService.create(createSprintDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả sprint với paging' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.sprintsService.findAll(Number(page) || 1, Number(limit) || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một sprint theo ID' })
  @ApiParam({ name: 'id', type: 'string' })
  async findOne(@Param('id') id: string) {
    return this.sprintsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin một sprint' })
  @ApiParam({ name: 'id', type: 'string' })
  async update(@Param('id') id: string, @Body() updateSprintDto: UpdateSprintDto) {
    return this.sprintsService.update(id, updateSprintDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một sprint theo ID' })
  @ApiParam({ name: 'id', type: 'string' })
  async remove(@Param('id') id: string) {
    return this.sprintsService.remove(id);
  }
}
