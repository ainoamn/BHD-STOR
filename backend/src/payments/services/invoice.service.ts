import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { roundMoney } from '../../common/utils/money.util';

export interface IssueInvoiceInput {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  gateway?: string | null;
}

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  async findByPaymentId(paymentId: string): Promise<Invoice | null> {
    return this.invoiceRepository.findOne({ where: { paymentId } });
  }

  /**
   * Idempotent: one invoice per payment. Allocates yearly sequence under row lock.
   */
  async issueForPayment(input: IssueInvoiceInput): Promise<Invoice> {
    const existing = await this.findByPaymentId(input.paymentId);
    if (existing) return existing;

    const year = new Date().getUTCFullYear();

    return this.dataSource.transaction(async (manager) => {
      const invoiceRepo = manager.getRepository(Invoice);

      const raced = await invoiceRepo.findOne({
        where: { paymentId: input.paymentId },
      });
      if (raced) return raced;

      // Upsert sequence row and lock it
      await manager.query(
        `INSERT INTO invoice_sequences ("year", "last_value") VALUES ($1, 0)
         ON CONFLICT ("year") DO NOTHING`,
        [year],
      );
      const rows: Array<{ last_value: number }> = await manager.query(
        `SELECT "last_value" FROM invoice_sequences WHERE "year" = $1 FOR UPDATE`,
        [year],
      );
      const next = Number(rows[0]?.last_value || 0) + 1;
      await manager.query(
        `UPDATE invoice_sequences SET "last_value" = $1 WHERE "year" = $2`,
        [next, year],
      );

      const invoiceNumber = `INV-${year}-${String(next).padStart(6, '0')}`;
      const invoice = invoiceRepo.create({
        invoiceNumber,
        year,
        sequence: next,
        paymentId: input.paymentId,
        orderId: input.orderId,
        userId: input.userId,
        amount: roundMoney(input.amount),
        currency: input.currency || 'OMR',
        status: InvoiceStatus.ISSUED,
        gateway: input.gateway || null,
        issuedAt: new Date(),
      });

      const saved = await invoiceRepo.save(invoice);
      this.logger.log(`Issued invoice ${saved.invoiceNumber} for payment ${input.paymentId}`);
      return saved;
    });
  }
}
