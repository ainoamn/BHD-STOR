import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Employee } from '../entities/employee.entity';
import { Attendance } from '../entities/attendance.entity';
import { Leave, LeaveType, LeaveStatus } from '../entities/leave.entity';
import { Payroll, AllowanceItem, DeductionItem } from '../entities/payroll.entity';
import { CreateEmployeeDto } from '../dto/create-employee.dto';

@Injectable()
export class HrService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(Leave)
    private readonly leaveRepo: Repository<Leave>,
    @InjectRepository(Payroll)
    private readonly payrollRepo: Repository<Payroll>,
  ) {}

  /* ─────────── Employees ─────────── */

  async createEmployee(dto: CreateEmployeeDto): Promise<Employee> {
    const existing = await this.employeeRepo.findOne({
      where: [
        { employeeNumber: dto.employeeNumber },
        { userId: dto.userId },
      ],
    });
    if (existing) {
      throw new BadRequestException(
        'Employee number or user ID already exists',
      );
    }

    const employee = this.employeeRepo.create({
      userId: dto.userId,
      employeeNumber: dto.employeeNumber,
      department: dto.department,
      position: dto.position,
      employmentType: dto.employmentType,
      joinDate: dto.joinDate,
      probationEndDate: dto.probationEndDate ?? null,
      salary: dto.salary,
      currency: dto.currency ?? 'OMR',
      bankAccount: dto.bankAccount ?? null,
      workSchedule: dto.workSchedule ?? null,
      annualLeaveBalance: dto.annualLeaveBalance ?? 30,
      sickLeaveBalance: dto.sickLeaveBalance ?? 15,
      status: 'active',
      managerId: dto.managerId ?? null,
    });

    return this.employeeRepo.save(employee);
  }

  async findAllEmployees(query?: {
    department?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Employee[]; total: number }> {
    const { department, status, search, page = 1, limit = 50 } = query ?? {};

    const qb = this.employeeRepo.createQueryBuilder('e')
      .orderBy('e.joinDate', 'DESC');

    if (department) qb.andWhere('e.department = :department', { department });
    if (status) qb.andWhere('e.status = :status', { status });
    if (search) {
      qb.andWhere(
        '(e.employeeNumber ILIKE :search OR e.position ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async findEmployee(id: string): Promise<Employee> {
    const employee = await this.employeeRepo.findOne({ where: { id } });
    if (!employee) throw new NotFoundException(`Employee ${id} not found`);
    return employee;
  }

  async updateEmployee(
    id: string,
    dto: Partial<CreateEmployeeDto>,
  ): Promise<Employee> {
    const employee = await this.findEmployee(id);
    Object.assign(employee, dto);
    return this.employeeRepo.save(employee);
  }

  async terminateEmployee(
    id: string,
    data: { terminationDate: Date; reason?: string },
  ): Promise<Employee> {
    const employee = await this.findEmployee(id);
    employee.status = 'terminated';
    employee.terminationDate = data.terminationDate;
    return this.employeeRepo.save(employee);
  }

  /* ─────────── Attendance ─────────── */

  async clockIn(
    employeeId: string,
    location?: { lat?: number; lng?: number },
  ): Promise<Attendance> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await this.attendanceRepo.findOne({
      where: { employeeId, date: today },
    });

    if (attendance?.checkIn) {
      throw new BadRequestException('Already clocked in today');
    }

    if (!attendance) {
      attendance = this.attendanceRepo.create({
        employeeId,
        date: today,
        status: 'present',
      });
    }

    attendance.checkIn = new Date();
    if (location?.lat && location?.lng) {
      attendance.checkInLocation = {
        lat: location.lat,
        lng: location.lng,
      };
    }

    // Check if late (after 9:00 AM)
    const now = new Date();
    const nineAM = new Date(now);
    nineAM.setHours(9, 0, 0, 0);
    if (now > nineAM) {
      attendance.status = 'late';
    } else {
      attendance.status = 'present';
    }

    return this.attendanceRepo.save(attendance);
  }

  async clockOut(
    employeeId: string,
    location?: { lat?: number; lng?: number },
  ): Promise<Attendance> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.attendanceRepo.findOne({
      where: { employeeId, date: today },
    });

    if (!attendance) {
      throw new BadRequestException('Must clock in before clocking out');
    }

    if (attendance.checkOut) {
      throw new BadRequestException('Already clocked out today');
    }

    attendance.checkOut = new Date();
    if (location?.lat && location?.lng) {
      attendance.checkOutLocation = {
        lat: location.lat,
        lng: location.lng,
      };
    }

    // Calculate working hours
    if (attendance.checkIn) {
      const ms = attendance.checkOut.getTime() - attendance.checkIn.getTime();
      attendance.workingHours = parseFloat((ms / (1000 * 60 * 60)).toFixed(2));

      // Calculate overtime (above 8 hours)
      if (attendance.workingHours > 8) {
        attendance.overtimeHours = parseFloat(
          (attendance.workingHours - 8).toFixed(2),
        );
        attendance.workingHours = 8;
      }
    }

    return this.attendanceRepo.save(attendance);
  }

  async getAttendance(
    employeeId: string,
    year: number,
    month: number,
  ): Promise<Attendance[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.attendanceRepo.find({
      where: {
        employeeId,
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC' },
    });
  }

  async getTodayAttendance(employeeId: string): Promise<Attendance | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.attendanceRepo.findOne({
      where: { employeeId, date: today },
    });
  }

  /* ─────────── Leave ─────────── */

  async requestLeave(
    employeeId: string,
    dto: {
      type: LeaveType;
      startDate: Date;
      endDate: Date;
      reason: string;
    },
  ): Promise<Leave> {
    const employee = await this.findEmployee(employeeId);

    // Calculate days
    const msPerDay = 1000 * 60 * 60 * 24;
    const days = Math.ceil(
      (dto.endDate.getTime() - dto.startDate.getTime()) / msPerDay,
    ) + 1;

    // Check leave balance
    if (dto.type === 'annual' && days > employee.annualLeaveBalance) {
      throw new BadRequestException(
        `Insufficient annual leave balance. Available: ${employee.annualLeaveBalance}, Requested: ${days}`,
      );
    }
    if (dto.type === 'sick' && days > employee.sickLeaveBalance) {
      throw new BadRequestException(
        `Insufficient sick leave balance. Available: ${employee.sickLeaveBalance}, Requested: ${days}`,
      );
    }

    const leave = this.leaveRepo.create({
      employeeId,
      type: dto.type,
      startDate: dto.startDate,
      endDate: dto.endDate,
      days,
      reason: dto.reason,
      status: 'pending',
    });

    return this.leaveRepo.save(leave);
  }

  async approveLeave(leaveId: string, approverId: string): Promise<Leave> {
    const leave = await this.leaveRepo.findOne({ where: { id: leaveId } });
    if (!leave) throw new NotFoundException(`Leave ${leaveId} not found`);
    if (leave.status !== 'pending') {
      throw new BadRequestException('Leave is not pending');
    }

    leave.status = 'approved' as LeaveStatus;
    leave.approvedBy = approverId;
    leave.approvedAt = new Date();

    // Deduct from leave balance
    const employee = await this.findEmployee(leave.employeeId);
    if (leave.type === 'annual') {
      employee.annualLeaveBalance -= leave.days;
    } else if (leave.type === 'sick') {
      employee.sickLeaveBalance -= leave.days;
    }
    await this.employeeRepo.save(employee);

    return this.leaveRepo.save(leave);
  }

  async rejectLeave(
    leaveId: string,
    _approverId: string,
    reason: string,
  ): Promise<Leave> {
    const leave = await this.leaveRepo.findOne({ where: { id: leaveId } });
    if (!leave) throw new NotFoundException(`Leave ${leaveId} not found`);
    if (leave.status !== 'pending') {
      throw new BadRequestException('Leave is not pending');
    }

    leave.status = 'rejected' as LeaveStatus;
    leave.reason = `${leave.reason} | Rejected: ${reason}`;
    return this.leaveRepo.save(leave);
  }

  async getLeaveBalance(employeeId: string): Promise<{
    annual: number;
    sick: number;
    pending: number;
  }> {
    const employee = await this.findEmployee(employeeId);

    const pendingLeaves = await this.leaveRepo
      .createQueryBuilder('l')
      .where('l.employeeId = :employeeId', { employeeId })
      .andWhere('l.status = :status', { status: 'pending' })
      .getMany();

    const pendingDays = pendingLeaves.reduce((sum, l) => sum + l.days, 0);

    return {
      annual: employee.annualLeaveBalance,
      sick: employee.sickLeaveBalance,
      pending: pendingDays,
    };
  }

  async getEmployeeLeaves(employeeId: string): Promise<Leave[]> {
    return this.leaveRepo.find({
      where: { employeeId },
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingLeaves(): Promise<Leave[]> {
    return this.leaveRepo.find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
    });
  }

  /* ─────────── Payroll ─────────── */

  async processPayroll(period: string): Promise<Payroll[]> {
    const employees = await this.employeeRepo.find({
      where: { status: 'active' },
    });

    const payrolls: Payroll[] = [];

    for (const employee of employees) {
      // Check if payroll already processed
      const existing = await this.payrollRepo.findOne({
        where: { employeeId: employee.id, period },
      });
      if (existing) continue;

      // Get attendance for the period
      const [year, month] = period.split('-').map(Number);
      const attendanceRecords = await this.getAttendance(
        employee.id,
        year,
        month,
      );

      // Calculate overtime
      const overtimeHours = attendanceRecords.reduce(
        (sum, a) => sum + Number(a.overtimeHours),
        0,
      );
      const hourlyRate = Number(employee.salary) / (30 * 8);
      const overtimePay = parseFloat(
        (overtimeHours * hourlyRate * 1.5).toFixed(3),
      );

      // Default allowances
      const allowances: AllowanceItem[] = [
        { type: 'housing', amount: parseFloat((Number(employee.salary) * 0.25).toFixed(3)) },
        { type: 'transport', amount: parseFloat((Number(employee.salary) * 0.1).toFixed(3)) },
      ];

      // Default deductions (Social Insurance in Oman: 7.5% employee + 1% work injury)
      const socialInsurance = parseFloat(
        (Number(employee.salary) * 0.075).toFixed(3),
      );
      const deductions: DeductionItem[] = [
        { type: 'social_insurance', amount: socialInsurance },
      ];

      const totalAllowances = allowances.reduce(
        (sum, a) => sum + a.amount,
        0,
      );
      const totalDeductions = deductions.reduce(
        (sum, d) => sum + d.amount,
        0,
      );

      const grossSalary =
        Number(employee.salary) + totalAllowances + overtimePay;
      const netSalary = grossSalary - totalDeductions;

      const payroll = this.payrollRepo.create({
        employeeId: employee.id,
        period,
        basicSalary: Number(employee.salary),
        allowances,
        deductions,
        overtime: overtimePay,
        bonus: 0,
        grossSalary: parseFloat(grossSalary.toFixed(3)),
        netSalary: parseFloat(netSalary.toFixed(3)),
        status: 'processed',
      });

      payrolls.push(await this.payrollRepo.save(payroll));
    }

    return payrolls;
  }

  async getPayroll(
    employeeId: string,
    period: string,
  ): Promise<Payroll | null> {
    return this.payrollRepo.findOne({
      where: { employeeId, period },
    });
  }

  async getPayrollsByPeriod(period: string): Promise<Payroll[]> {
    return this.payrollRepo.find({
      where: { period },
      order: { createdAt: 'DESC' },
    });
  }

  async markPayrollAsPaid(payrollId: string): Promise<Payroll> {
    const payroll = await this.payrollRepo.findOne({
      where: { id: payrollId },
    });
    if (!payroll) throw new NotFoundException(`Payroll ${payrollId} not found`);

    payroll.status = 'paid';
    payroll.paidAt = new Date();
    return this.payrollRepo.save(payroll);
  }

  /* ─────────── Reports ─────────── */

  async getDepartmentStats(): Promise<
    Array<{
      department: string;
      count: number;
      avgSalary: number;
      totalSalary: number;
    }>
  > {
    const result = await this.employeeRepo
      .createQueryBuilder('e')
      .select('e.department', 'department')
      .addSelect('COUNT(e.id)', 'count')
      .addSelect('AVG(e.salary)', 'avgSalary')
      .addSelect('SUM(e.salary)', 'totalSalary')
      .where('e.status = :status', { status: 'active' })
      .groupBy('e.department')
      .orderBy('count', 'DESC')
      .getRawMany();

    return result.map((r) => ({
      department: r.department,
      count: parseInt(r.count, 10),
      avgSalary: parseFloat(parseFloat(r.avgSalary).toFixed(3)),
      totalSalary: parseFloat(parseFloat(r.totalSalary).toFixed(3)),
    }));
  }

  async getAttendanceReport(
    year: number,
    month: number,
  ): Promise<
    Array<{
      employeeId: string;
      employeeNumber: string;
      present: number;
      absent: number;
      late: number;
      onLeave: number;
      remote: number;
      totalWorkingHours: number;
      totalOvertime: number;
    }>
  > {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const records = await this.attendanceRepo
      .createQueryBuilder('a')
      .innerJoin('employees', 'e', 'a.employeeId = e.id')
      .select('a.employeeId', 'employeeId')
      .addSelect('e.employeeNumber', 'employeeNumber')
      .addSelect(
        `SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)`,
        'present',
      )
      .addSelect(
        `SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END)`,
        'absent',
      )
      .addSelect(`SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END)`, 'late')
      .addSelect(
        `SUM(CASE WHEN a.status = 'on_leave' THEN 1 ELSE 0 END)`,
        'onLeave',
      )
      .addSelect(
        `SUM(CASE WHEN a.status = 'remote' THEN 1 ELSE 0 END)`,
        'remote',
      )
      .addSelect('COALESCE(SUM(a.workingHours), 0)', 'totalWorkingHours')
      .addSelect('COALESCE(SUM(a.overtimeHours), 0)', 'totalOvertime')
      .where('a.date BETWEEN :start AND :end', { start: startDate, end: endDate })
      .groupBy('a.employeeId')
      .addGroupBy('e.employeeNumber')
      .getRawMany();

    return records.map((r) => ({
      employeeId: r.employeeId,
      employeeNumber: r.employeeNumber,
      present: parseInt(r.present, 10) || 0,
      absent: parseInt(r.absent, 10) || 0,
      late: parseInt(r.late, 10) || 0,
      onLeave: parseInt(r.onLeave, 10) || 0,
      remote: parseInt(r.remote, 10) || 0,
      totalWorkingHours: parseFloat(r.totalWorkingHours) || 0,
      totalOvertime: parseFloat(r.totalOvertime) || 0,
    }));
  }
}
