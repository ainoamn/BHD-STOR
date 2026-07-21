import { IsEnum, IsDate, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportType, ReportPeriod } from '../entities/financial-report.entity';

export class GenerateReportDto {
  @IsEnum(['balance_sheet', 'income_statement', 'cash_flow', 'trial_balance'])
  type: ReportType;

  @IsEnum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
  period: ReportPeriod;

  @IsDate()
  @Type(() => Date)
  periodStart: Date;

  @IsDate()
  @Type(() => Date)
  periodEnd: Date;

  @IsUUID()
  generatedBy: string;
}
