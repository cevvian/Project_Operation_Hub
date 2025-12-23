import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guard/auth.guard';
import { TasksService } from './tasks.service';

@ApiTags('Tasks Global')
@UseGuards(AuthGuard)
@Controller('tasks')
export class TasksGlobalController {
    constructor(private readonly tasksService: TasksService) { }

    @Get('me')
    @ApiOperation({ summary: 'Get all tasks assigned to the current user across all projects' })
    async getMyTasks(@Req() req) {
        const userId = req.user.sub;
        return this.tasksService.findByUser(userId);
    }

    @Get('me/stats')
    @ApiOperation({ summary: 'Get task statistics for the current user' })
    async getMyStats(@Req() req) {
        const userId = req.user.sub;
        return this.tasksService.getStatsByUser(userId);
    }
}
