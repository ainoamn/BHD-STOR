import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Account } from '../entities/account.entity';
import { JournalEntry } from '../entities/journal-entry.entity';
import { JournalLine } from '../entities/journal-line.entity';
import { FinancialReport } from '../entities/financial-report.entity';
import { CreateAccountDto } from '../dto/create-account.dto';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';
import { GenerateReportDto } from '../dto/generate-report.dto';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(JournalEntry)
    private readonly journalEntryRepo: Repository<JournalEntry>,
    @InjectRepository(JournalLine)
    private readonly journalLineRepo: Repository<JournalLine>,
    @InjectRepository(FinancialReport)
    private readonly financialReportRepo: Repository<FinancialReport>,
    private readonly dataSource: DataSource,
  ) {}

  /* ─────────── Chart of Accounts ─────────── */

  async createAccount(dto: CreateAccountDto): Promise<Account> {
    const existing = await this.accountRepo.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BadRequestException(
        `Account with code ${dto.code} already exists`,
      );
    }

    const account = this.accountRepo.create({
      code: dto.code,
      name: dto.name,
      nameAr: dto.nameAr,
      type: dto.type,
      category: dto.category,
      parentId: dto.parentId ?? null,
      balance: dto.balance ?? 0,
      currency: dto.currency ?? 'OMR',
      isActive: dto.isActive ?? true,
    });

    return this.accountRepo.save(account);
  }

  async getChartOfAccounts(): Promise<Account[]> {
    const allAccounts = await this.accountRepo.find({
      order: { code: 'ASC' },
    });

    const accountMap = new Map<string, Account & { children?: Account[] }>();
    const rootAccounts: (Account & { children?: Account[] })[] = [];

    for (const account of allAccounts) {
      const acc = { ...account, children: [] };
      accountMap.set(account.id, acc);
    }

    for (const account of allAccounts) {
      const acc = accountMap.get(account.id)!;
      if (account.parentId && accountMap.has(account.parentId)) {
        const parent = accountMap.get(account.parentId)!;
        if (!parent.children) parent.children = [];
        parent.children.push(acc);
      } else {
        rootAccounts.push(acc);
      }
    }

    return rootAccounts;
  }

  async findAccountById(id: string): Promise<Account> {
    const account = await this.accountRepo.findOne({ where: { id } });
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    return account;
  }

  /* ─────────── Journal Entries ─────────── */

  async postJournalEntry(dto: CreateJournalEntryDto): Promise<JournalEntry> {
    // Validate debits = credits
    const totalDebit = dto.lines.reduce(
      (sum, line) => sum + (Number(line.debit) || 0),
      0,
    );
    const totalCredit = dto.lines.reduce(
      (sum, line) => sum + (Number(line.credit) || 0),
      0,
    );

    if (totalDebit !== totalCredit) {
      throw new BadRequestException(
        `Debits (${totalDebit}) must equal Credits (${totalCredit})`,
      );
    }

    if (totalDebit === 0) {
      throw new BadRequestException('Journal entry must have non-zero amounts');
    }

    // Validate all accounts exist
    for (const line of dto.lines) {
      const account = await this.accountRepo.findOne({
        where: { id: line.accountId, isActive: true },
      });
      if (!account) {
        throw new BadRequestException(
          `Account ${line.accountId} not found or inactive`,
        );
      }
    }

    // Generate entry number
    const dateStr = new Date(dto.date).toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.journalEntryRepo.count({
      where: {
        entryNumber: Like(`JE-${dateStr}-%`),
      },
    });
    const entryNumber = `JE-${dateStr}-${String(count + 1).padStart(3, '0')}`;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create journal entry
      const entry = queryRunner.manager.create(JournalEntry, {
        entryNumber,
        date: dto.date,
        reference: dto.reference ?? null,
        referenceType: dto.referenceType,
        description: dto.description,
        descriptionAr: dto.descriptionAr ?? null,
        totalDebit,
        totalCredit,
        status: 'posted' as const,
        postedAt: new Date(),
        postedBy: dto.createdBy,
        createdBy: dto.createdBy,
      });

      const savedEntry = await queryRunner.manager.save(JournalEntry, entry);

      // Create journal lines and update account balances
      for (const lineDto of dto.lines) {
        const line = queryRunner.manager.create(JournalLine, {
          journalEntryId: savedEntry.id,
          accountId: lineDto.accountId,
          debit: Number(lineDto.debit) || 0,
          credit: Number(lineDto.credit) || 0,
          description: lineDto.description ?? null,
        });
        await queryRunner.manager.save(JournalLine, line);

        // Update account balance
        const account = await queryRunner.manager.findOne(Account, {
          where: { id: lineDto.accountId },
        });
        if (account) {
          const debitAmount = Number(lineDto.debit) || 0;
          const creditAmount = Number(lineDto.credit) || 0;

          // Balance increases with debit for assets/expenses, credit for liabilities/equity/revenue
          if (account.type === 'asset' || account.type === 'expense') {
            account.balance = Number(account.balance) + debitAmount - creditAmount;
          } else {
            account.balance = Number(account.balance) + creditAmount - debitAmount;
          }

          await queryRunner.manager.save(Account, account);
        }
      }

      await queryRunner.commitTransaction();

      return this.journalEntryRepo.findOne({
        where: { id: savedEntry.id },
        relations: ['lines', 'lines.account'],
      }) as Promise<JournalEntry>;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async reverseEntry(
    entryId: string,
    reversedBy: string,
  ): Promise<JournalEntry> {
    const originalEntry = await this.journalEntryRepo.findOne({
      where: { id: entryId },
      relations: ['lines'],
    });

    if (!originalEntry) {
      throw new NotFoundException(`Journal entry ${entryId} not found`);
    }

    if (originalEntry.status !== 'posted') {
      throw new BadRequestException('Only posted entries can be reversed');
    }

    if (originalEntry.status === 'reversed') {
      throw new BadRequestException('Entry is already reversed');
    }

    // Mark original as reversed
    originalEntry.status = 'reversed' as const;
    await this.journalEntryRepo.save(originalEntry);

    // Create reversing entry (swap debits and credits)
    const reverseDto: CreateJournalEntryDto = {
      date: new Date(),
      referenceType: 'adjustment',
      description: `Reversal of ${originalEntry.entryNumber}`,
      descriptionAr: `عكس قيد ${originalEntry.entryNumber}`,
      createdBy: reversedBy,
      lines: originalEntry.lines.map((line) => ({
        accountId: line.accountId,
        debit: line.credit,
        credit: line.debit,
        description: `Reversal: ${line.description ?? ''}`,
      })),
    };

    return this.postJournalEntry(reverseDto);
  }

  async findJournalEntries(options: {
    page?: number;
    limit?: number;
    status?: string;
    referenceType?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<{ items: JournalEntry[]; total: number }> {
    const { page = 1, limit = 50, status, referenceType, fromDate, toDate } = options;

    const query = this.journalEntryRepo.createQueryBuilder('je')
      .leftJoinAndSelect('je.lines', 'lines')
      .leftJoinAndSelect('lines.account', 'account')
      .orderBy('je.date', 'DESC')
      .addOrderBy('je.entryNumber', 'DESC');

    if (status) query.andWhere('je.status = :status', { status });
    if (referenceType) query.andWhere('je.referenceType = :referenceType', { referenceType });
    if (fromDate) query.andWhere('je.date >= :fromDate', { fromDate });
    if (toDate) query.andWhere('je.date <= :toDate', { toDate });

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async findJournalEntryById(id: string): Promise<JournalEntry> {
    const entry = await this.journalEntryRepo.findOne({
      where: { id },
      relations: ['lines', 'lines.account'],
    });
    if (!entry) throw new NotFoundException(`Journal entry ${id} not found`);
    return entry;
  }

  /* ─────────── Financial Reports ─────────── */

  async getTrialBalance(asOfDate: Date): Promise<{
    accounts: Array<{
      code: string;
      name: string;
      nameAr: string;
      type: string;
      debit: number;
      credit: number;
      balance: number;
    }>;
    totalDebit: number;
    totalCredit: number;
  }> {
    const accounts = await this.accountRepo.find({
      where: { isActive: true },
      order: { code: 'ASC' },
    });

    let totalDebit = 0;
    let totalCredit = 0;

    const accountBalances = accounts.map((account) => {
      const balance = Number(account.balance);
      let debit = 0;
      let credit = 0;

      if (account.type === 'asset' || account.type === 'expense') {
        if (balance >= 0) {
          debit = balance;
        } else {
          credit = Math.abs(balance);
        }
      } else {
        if (balance >= 0) {
          credit = balance;
        } else {
          debit = Math.abs(balance);
        }
      }

      totalDebit += debit;
      totalCredit += credit;

      return {
        code: account.code,
        name: account.name,
        nameAr: account.nameAr,
        type: account.type,
        debit,
        credit,
        balance,
      };
    });

    return {
      accounts: accountBalances,
      totalDebit,
      totalCredit,
    };
  }

  async getBalanceSheet(asOfDate: Date): Promise<{
    assets: Array<{ code: string; name: string; nameAr: string; balance: number }>;
    totalAssets: number;
    liabilities: Array<{ code: string; name: string; nameAr: string; balance: number }>;
    totalLiabilities: number;
    equity: Array<{ code: string; name: string; nameAr: string; balance: number }>;
    totalEquity: number;
    totalLiabilitiesAndEquity: number;
  }> {
    const accounts = await this.accountRepo.find({
      where: { isActive: true },
      order: { code: 'ASC' },
    });

    const assets = accounts
      .filter((a) => a.type === 'asset')
      .map((a) => ({
        code: a.code,
        name: a.name,
        nameAr: a.nameAr,
        balance: Number(a.balance),
      }));

    const liabilities = accounts
      .filter((a) => a.type === 'liability')
      .map((a) => ({
        code: a.code,
        name: a.name,
        nameAr: a.nameAr,
        balance: Number(a.balance),
      }));

    const equity = accounts
      .filter((a) => a.type === 'equity')
      .map((a) => ({
        code: a.code,
        name: a.name,
        nameAr: a.nameAr,
        balance: Number(a.balance),
      }));

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
    const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

    return {
      assets,
      totalAssets,
      liabilities,
      totalLiabilities,
      equity,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    };
  }

  async getIncomeStatement(
    periodStart: Date,
    periodEnd: Date,
  ): Promise<{
    revenue: Array<{ code: string; name: string; nameAr: string; amount: number }>;
    totalRevenue: number;
    expenses: Array<{ code: string; name: string; nameAr: string; amount: number }>;
    totalExpenses: number;
    grossProfit: number;
    netIncome: number;
  }> {
    const entries = await this.journalEntryRepo.find({
      where: {
        status: 'posted',
        date: Between(periodStart, periodEnd),
      },
      relations: ['lines', 'lines.account'],
    });

    const accountMap = new Map<
      string,
      { code: string; name: string; nameAr: string; type: string; amount: number }
    >();

    for (const entry of entries) {
      for (const line of entry.lines) {
        if (!line.account) continue;
        const acc = line.account;
        if (acc.type !== 'revenue' && acc.type !== 'expense') continue;

        const key = acc.id;
        if (!accountMap.has(key)) {
          accountMap.set(key, {
            code: acc.code,
            name: acc.name,
            nameAr: acc.nameAr,
            type: acc.type,
            amount: 0,
          });
        }

        const record = accountMap.get(key)!;
        if (acc.type === 'revenue') {
          record.amount += Number(line.credit) - Number(line.debit);
        } else {
          record.amount += Number(line.debit) - Number(line.credit);
        }
      }
    }

    const allAccounts = Array.from(accountMap.values());

    const revenue = allAccounts
      .filter((a) => a.type === 'revenue')
      .map((a) => ({
        code: a.code,
        name: a.name,
        nameAr: a.nameAr,
        amount: Math.abs(a.amount),
      }));

    const expenses = allAccounts
      .filter((a) => a.type === 'expense')
      .map((a) => ({
        code: a.code,
        name: a.name,
        nameAr: a.nameAr,
        amount: Math.abs(a.amount),
      }));

    const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      revenue,
      totalRevenue,
      expenses,
      totalExpenses,
      grossProfit: totalRevenue,
      netIncome: totalRevenue - totalExpenses,
    };
  }

  async getCashFlow(
    periodStart: Date,
    periodEnd: Date,
  ): Promise<{
    operating: Array<{ description: string; inflow: number; outflow: number }>;
    totalOperating: number;
    investing: Array<{ description: string; inflow: number; outflow: number }>;
    totalInvesting: number;
    financing: Array<{ description: string; inflow: number; outflow: number };
    totalFinancing: number;
    netCashFlow: number;
  }> {
    const entries = await this.journalEntryRepo.find({
      where: {
        status: 'posted',
        date: Between(periodStart, periodEnd),
      },
      relations: ['lines', 'lines.account'],
    });

    // Cash account codes (typically 1000-1999 range)
    const isCashAccount = (code: string) => {
      const codeNum = parseInt(code, 10);
      return codeNum >= 1000 && codeNum < 2000;
    };

    const operating: Array<{ description: string; inflow: number; outflow: number }> = [];
    const investing: Array<{ description: string; inflow: number; outflow: number }> = [];
    const financing: Array<{ description: string; inflow: number; outflow: number }> = [];

    for (const entry of entries) {
      for (const line of entry.lines) {
        if (!line.account || !isCashAccount(line.account.code)) continue;

        const cashChange = Number(line.debit) - Number(line.credit);
        const bucket = entry.referenceType === 'order'
          ? operating
          : entry.referenceType === 'expense'
            ? operating
            : entry.referenceType === 'payroll'
              ? operating
              : entry.referenceType === 'payment'
                ? financing
                : operating;

        bucket.push({
          description: entry.description,
          inflow: cashChange > 0 ? cashChange : 0,
          outflow: cashChange < 0 ? Math.abs(cashChange) : 0,
        });
      }
    }

    const totalOperating = operating.reduce(
      (sum, o) => sum + o.inflow - o.outflow,
      0,
    );
    const totalInvesting = investing.reduce(
      (sum, i) => sum + i.inflow - i.outflow,
      0,
    );
    const totalFinancing = financing.reduce(
      (sum, f) => sum + f.inflow - f.outflow,
      0,
    );

    return {
      operating,
      totalOperating,
      investing,
      totalInvesting,
      financing,
      totalFinancing,
      netCashFlow: totalOperating + totalInvesting + totalFinancing,
    };
  }

  async getGeneralLedger(
    accountId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<{
    account: Account;
    entries: Array<{
      date: Date;
      entryNumber: string;
      description: string;
      reference: string;
      debit: number;
      credit: number;
      balance: number;
    }>;
    openingBalance: number;
    closingBalance: number;
  }> {
    const account = await this.findAccountById(accountId);

    // Get all journal lines for this account in the period
    const lines = await this.journalLineRepo
      .createQueryBuilder('jl')
      .innerJoinAndSelect('jl.journalEntry', 'je')
      .where('jl.accountId = :accountId', { accountId })
      .andWhere('je.status = :status', { status: 'posted' })
      .andWhere('je.date BETWEEN :start AND :end', {
        start: periodStart,
        end: periodEnd,
      })
      .orderBy('je.date', 'ASC')
      .addOrderBy('je.entryNumber', 'ASC')
      .getMany();

    let runningBalance = 0;
    const entries = lines.map((line) => {
      const debit = Number(line.debit);
      const credit = Number(line.credit);

      if (account.type === 'asset' || account.type === 'expense') {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }

      return {
        date: line.journalEntry.date,
        entryNumber: line.journalEntry.entryNumber,
        description: line.description || line.journalEntry.description,
        reference: line.journalEntry.reference || '',
        debit,
        credit,
        balance: runningBalance,
      };
    });

    return {
      account,
      entries,
      openingBalance: 0,
      closingBalance: runningBalance,
    };
  }

  /* ─────────── Auto-Posting ─────────── */

  async autoPostOrder(orderId: string, createdBy: string): Promise<JournalEntry> {
    // Accounts Receivable (Dr) 1200, Revenue (Cr) 4000
    const dto: CreateJournalEntryDto = {
      date: new Date(),
      reference: orderId,
      referenceType: 'order',
      description: `Auto-post for Order ${orderId}`,
      descriptionAr: `قيد تلقائي للطلب ${orderId}`,
      createdBy,
      lines: [
        { accountId: '1200-default', debit: 0, credit: 0, description: 'Accounts Receivable' },
        { accountId: '4000-default', debit: 0, credit: 0, description: 'Sales Revenue' },
      ],
    };
    return this.postJournalEntry(dto);
  }

  async autoPostPayment(
    paymentId: string,
    createdBy: string,
  ): Promise<JournalEntry> {
    const dto: CreateJournalEntryDto = {
      date: new Date(),
      reference: paymentId,
      referenceType: 'payment',
      description: `Auto-post for Payment ${paymentId}`,
      descriptionAr: `قيد تلقائي للدفع ${paymentId}`,
      createdBy,
      lines: [
        { accountId: '1000-default', debit: 0, credit: 0, description: 'Cash/Bank' },
        { accountId: '1200-default', debit: 0, credit: 0, description: 'Accounts Receivable' },
      ],
    };
    return this.postJournalEntry(dto);
  }

  async autoPostPayroll(
    payrollId: string,
    totalSalary: number,
    createdBy: string,
  ): Promise<JournalEntry> {
    const dto: CreateJournalEntryDto = {
      date: new Date(),
      reference: payrollId,
      referenceType: 'payroll',
      description: `Auto-post for Payroll ${payrollId}`,
      descriptionAr: `قيد تلقائي للرواتب ${payrollId}`,
      createdBy,
      lines: [
        {
          accountId: '6000-default',
          debit: totalSalary,
          credit: 0,
          description: 'Salary Expense',
        },
        {
          accountId: '1000-default',
          debit: 0,
          credit: totalSalary,
          description: 'Cash/Bank',
        },
      ],
    };
    return this.postJournalEntry(dto);
  }

  async autoPostExpense(
    expenseId: string,
    amount: number,
    category: string,
    createdBy: string,
  ): Promise<JournalEntry> {
    const dto: CreateJournalEntryDto = {
      date: new Date(),
      reference: expenseId,
      referenceType: 'expense',
      description: `Auto-post for Expense ${expenseId} - ${category}`,
      descriptionAr: `قيد تلقائي لمصروف ${expenseId}`,
      createdBy,
      lines: [
        {
          accountId: '6100-default',
          debit: amount,
          credit: 0,
          description: `Expense: ${category}`,
        },
        {
          accountId: '1000-default',
          debit: 0,
          credit: amount,
          description: 'Cash/Bank',
        },
      ],
    };
    return this.postJournalEntry(dto);
  }

  /* ─────────── Report Generation ─────────── */

  async autoGenerateMonthlyReports(
    year: number,
    month: number,
    generatedBy: string,
  ): Promise<FinancialReport[]> {
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59);

    const reports: FinancialReport[] = [];

    // Trial Balance
    const trialBalanceData = await this.getTrialBalance(periodEnd);
    reports.push(
      await this.saveReport({
        type: 'trial_balance',
        period: 'monthly',
        periodStart,
        periodEnd,
        generatedBy,
        data: trialBalanceData as unknown as Record<string, unknown>,
      }),
    );

    // Balance Sheet
    const balanceSheetData = await this.getBalanceSheet(periodEnd);
    reports.push(
      await this.saveReport({
        type: 'balance_sheet',
        period: 'monthly',
        periodStart,
        periodEnd,
        generatedBy,
        data: balanceSheetData as unknown as Record<string, unknown>,
      }),
    );

    // Income Statement
    const incomeStatementData = await this.getIncomeStatement(
      periodStart,
      periodEnd,
    );
    reports.push(
      await this.saveReport({
        type: 'income_statement',
        period: 'monthly',
        periodStart,
        periodEnd,
        generatedBy,
        data: incomeStatementData as unknown as Record<string, unknown>,
      }),
    );

    // Cash Flow
    const cashFlowData = await this.getCashFlow(periodStart, periodEnd);
    reports.push(
      await this.saveReport({
        type: 'cash_flow',
        period: 'monthly',
        periodStart,
        periodEnd,
        generatedBy,
        data: cashFlowData as unknown as Record<string, unknown>,
      }),
    );

    return reports;
  }

  private async saveReport(dto: GenerateReportDto & { data: Record<string, unknown> }): Promise<FinancialReport> {
    const report = this.financialReportRepo.create({
      type: dto.type,
      period: dto.period,
      periodStart: dto.periodStart,
      periodEnd: dto.periodEnd,
      data: dto.data,
      generatedBy: dto.generatedBy,
    });
    return this.financialReportRepo.save(report);
  }

  async getFinancialReports(type?: string): Promise<FinancialReport[]> {
    const where = type ? { type: type as ReportType } : {};
    return this.financialReportRepo.find({
      where,
      order: { generatedAt: 'DESC' },
    });
  }
}

function Like(pattern: string) {
  return pattern;
}
