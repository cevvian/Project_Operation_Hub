import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { Roles } from '../auth/guard/role.guard';
import { Role } from '../../database/entities/enum/role.enum';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Get admin dashboard statistics' })
    async getStats() {
        return this.dashboardService.getStats();
    }
}
