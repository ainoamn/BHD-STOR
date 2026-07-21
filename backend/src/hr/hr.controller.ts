import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { HrService } from './services/hr.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ClockInDto, ClockOutDto } from './dto/clock-in.dto';
import {
  LeaveRequestDto,
  ApproveLeaveDto,
  RejectLeaveDto,
} from './dto/leave-request.dto';

@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  /* ─────────── Employees ─────────── */

  @Post('employees')
  @HttpCode(HttpStatus.CREATED)
  async createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.hrService.createEmployee(dto);
  }

  @Get('employees')
  async findAllEmployees(
    @Query('department') department?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.hrService.findAllEmployees({
      department,
      status,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get('employees/:id')
  async findEmployee(@Param('id', ParseUUIDPipe) id: string) {
    return this.hrService.findEmployee(id);
  }

  @Post('employees/:id')
  async updateEmployee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateEmployeeDto>,
  ) {
    return this.hrService.updateEmployee(id, dto);
  }

  @Post('employees/:id/terminate')
  @HttpCode(HttpStatus.OK)
  async terminateEmployee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { terminationDate: Date; reason?: string },
  ) {
    return this.hrService.terminateEmployee(id, data);
  }

  /* ─────────── Attendance ─────────── */

  @Post('attendance/clock-in/:employeeId')
  @HttpCode(HttpStatus.CREATED)
  async clockIn(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: ClockInDto,
  ) {
    return this.hrService.clockIn(employeeId, {
      lat: dto.lat,
      lng: dto.lng,
    });
  }

  @Post('attendance/clock-out/:employeeId')
  @HttpCode(HttpStatus.OK)
  async clockOut(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: ClockOutDto,
  ) {
    return this.hrService.clockOut(employeeId, {
      lat: dto.lat,
      lng: dto.lng,
    });
  }

  @Get('attendance/:employeeId')
  async getAttendance(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.hrService.getAttendance(employeeId, year, month);
  }

  @Get('attendance/today/:employeeId')
  async getTodayAttendance(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.hrService.getTodayAttendance(employeeId);
  }

  /* ─────────── Leave ─────────── */

  @Post('leaves/:employeeId')
  @HttpCode(HttpStatus.CREATED)
  async requestLeave(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: LeaveRequestDto,
  ) {
    return this.hrService.requestLeave(employeeId, dto);
  }

  @Post('leaves/:leaveId/approve')
  @HttpCode(HttpStatus.OK)
  async approveLeave(
    @Param('leaveId', ParseUUIDPipe) leaveId: string,
    @Body() dto: ApproveLeaveDto,
  ) {
    return this.hrService.approveLeave(leaveId, dto.approverId);
  }

  @Post('leaves/:leaveId/reject')
  @HttpCode(HttpStatus.OK)
  async rejectLeave(
    @Param('leaveId', ParseUUIDPipe) leaveId: string,
    @Body() dto: RejectLeaveDto,
  ) {
    return this.hrService.rejectLeave(leaveId, dto.approverId, dto.reason);
  }

  @Get('leaves/balance/:employeeId')
  async getLeaveBalance(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.hrService.getLeaveBalance(employeeId);
  }

  @Get('leaves/:employeeId')
  async getEmployeeLeaves(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.hrService.getEmployeeLeaves(employeeId);
  }

  @Get('leaves')
  async getPendingLeaves(@Query('status') status?: string) {
    if (status === 'pending') {
      return this.hrService.getPendingLeaves();
    }
    return this.hrService.getPendingLeaves();
  }

  /* ─────────── Payroll ─────────── */

  @Post('payroll/process/:period')
  @HttpCode(HttpStatus.CREATED)
  async processPayroll(@Param('period') period: string) {
    return this.hrService.processPayroll(period);
  }

  @Get('payroll/:employeeId/:period')
  async getPayroll(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('period') period: string,
  ) {
    return this.hrService.getPayroll(employeeId, period);
  }

  @Get('payroll/period/:period')
  async getPayrollsByPeriod(@Param('period') period: string) {
    return this.hrService.getPayrollsByPeriod(period);
  }

  @Post('payroll/:payrollId/pay')
  @HttpCode(HttpStatus.OK)
  async markPayrollAsPaid(
    @Param('payrollId', ParseUUIDPipe) payrollId: string,
  ) {
    return this.hrService.markPayrollAsPaid(payrollId);
  }

  /* ─────────── Reports ─────────── */

  @Get('reports/department-stats')
  async getDepartmentStats() {
    return this.hrService.getDepartmentStats();
  }

  @Get('reports/attendance')
  async getAttendanceReport(
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.hrService.getAttendanceReport(year, month);
  }
}
