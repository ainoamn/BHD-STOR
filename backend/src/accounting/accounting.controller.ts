import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseDatePipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AccountingService } from './services/accounting.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  /* ─────────── Chart of Accounts ─────────── */

  @Post('accounts')
  @HttpCode(HttpStatus.CREATED)
  async createAccount(@Body() dto: CreateAccountDto) {
    return this.accountingService.createAccount(dto);
  }

  @Get('accounts')
  async getChartOfAccounts() {
    return this.accountingService.getChartOfAccounts();
  }

  @Get('accounts/:id')
  async getAccount(@Param('id', ParseUUIDPipe) id: string) {
    return this.accountingService.findAccountById(id);
  }

  /* ─────────── Journal Entries ─────────── */

  @Post('journal-entries')
  @HttpCode(HttpStatus.CREATED)
  async postJournalEntry(@Body() dto: CreateJournalEntryDto) {
    return this.accountingService.postJournalEntry(dto);
  }

  @Get('journal-entries')
  async getJournalEntries(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('referenceType') referenceType?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.accountingService.findJournalEntries({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      status,
      referenceType,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });
  }

  @Get('journal-entries/:id')
  async getJournalEntry(@Param('id', ParseUUIDPipe) id: string) {
    return this.accountingService.findJournalEntryById(id);
  }

  @Post('journal-entries/:id/reverse')
  @HttpCode(HttpStatus.CREATED)
  async reverseEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reversedBy') reversedBy: string,
  ) {
    return this.accountingService.reverseEntry(id, reversedBy);
  }

  /* ─────────── Financial Reports ─────────── */

  @Get('reports/trial-balance')
  async getTrialBalance(
    @Query('asOfDate', new ParseDatePipe({ optional: true })) asOfDate?: Date,
  ) {
    return this.accountingService.getTrialBalance(asOfDate ?? new Date());
  }

  @Get('reports/balance-sheet')
  async getBalanceSheet(
    @Query('asOfDate', new ParseDatePipe({ optional: true })) asOfDate?: Date,
  ) {
    return this.accountingService.getBalanceSheet(asOfDate ?? new Date());
  }

  @Get('reports/income-statement')
  async getIncomeStatement(
    @Query('periodStart', ParseDatePipe) periodStart: Date,
    @Query('periodEnd', ParseDatePipe) periodEnd: Date,
  ) {
    return this.accountingService.getIncomeStatement(periodStart, periodEnd);
  }

  @Get('reports/cash-flow')
  async getCashFlow(
    @Query('periodStart', ParseDatePipe) periodStart: Date,
    @Query('periodEnd', ParseDatePipe) periodEnd: Date,
  ) {
    return this.accountingService.getCashFlow(periodStart, periodEnd);
  }

  @Get('general-ledger/:accountId')
  async getGeneralLedger(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Query('periodStart', ParseDatePipe) periodStart: Date,
    @Query('periodEnd', ParseDatePipe) periodEnd: Date,
  ) {
    return this.accountingService.getGeneralLedger(
      accountId,
      periodStart,
      periodEnd,
    );
  }

  /* ─────────── Auto-Posting ─────────── */

  @Post('auto-post/order/:orderId')
  @HttpCode(HttpStatus.CREATED)
  async autoPostOrder(
    @Param('orderId') orderId: string,
    @Body('createdBy') createdBy: string,
  ) {
    return this.accountingService.autoPostOrder(orderId, createdBy);
  }

  @Post('auto-post/payment/:paymentId')
  @HttpCode(HttpStatus.CREATED)
  async autoPostPayment(
    @Param('paymentId') paymentId: string,
    @Body('createdBy') createdBy: string,
  ) {
    return this.accountingService.autoPostPayment(paymentId, createdBy);
  }

  @Post('auto-post/payroll/:payrollId')
  @HttpCode(HttpStatus.CREATED)
  async autoPostPayroll(
    @Param('payrollId') payrollId: string,
    @Body('totalSalary') totalSalary: number,
    @Body('createdBy') createdBy: string,
  ) {
    return this.accountingService.autoPostPayroll(
      payrollId,
      totalSalary,
      createdBy,
    );
  }

  @Post('auto-post/expense/:expenseId')
  @HttpCode(HttpStatus.CREATED)
  async autoPostExpense(
    @Param('expenseId') expenseId: string,
    @Body('amount') amount: number,
    @Body('category') category: string,
    @Body('createdBy') createdBy: string,
  ) {
    return this.accountingService.autoPostExpense(
      expenseId,
      amount,
      category,
      createdBy,
    );
  }

  @Post('auto-generate-reports')
  @HttpCode(HttpStatus.CREATED)
  async autoGenerateMonthlyReports(
    @Body('year') year: number,
    @Body('month') month: number,
    @Body('generatedBy') generatedBy: string,
  ) {
    return this.accountingService.autoGenerateMonthlyReports(
      year,
      month,
      generatedBy,
    );
  }

  @Get('reports')
  async getFinancialReports(@Query('type') type?: string) {
    return this.accountingService.getFinancialReports(type);
  }
}
