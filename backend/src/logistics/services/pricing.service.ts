import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingRule } from '../entities/pricing-rule.entity';
import { B2BCustomer } from '../entities/b2b-customer.entity';
import { CreatePricingRuleDto } from '../dto/create-pricing-rule.dto';
import { CalculatePriceDto } from '../dto/calculate-price.dto';
import { ServiceType } from '../entities/shipment.entity';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(PricingRule)
    private readonly pricingRepo: Repository<PricingRule>,
    @InjectRepository(B2BCustomer)
    private readonly b2bRepo: Repository<B2BCustomer>,
  ) {}

  async calculatePrice(data: CalculatePriceDto): Promise<{
    basePrice: number;
    weightCharge: number;
    volumeCharge: number;
    distanceCharge: number;
    serviceMultiplier: number;
    fuelSurcharge: number;
    subtotal: number;
    discount: number;
    total: number;
    currency: string;
  }> {
    const {
      fromZoneId,
      toZoneId,
      weight,
      volume = 0,
      distance = 0,
      serviceType,
      vehicleType,
      b2bCustomerId,
    } = data;

    const rule = await this.pricingRepo.findOne({
      where: {
        fromZoneId,
        toZoneId,
        vehicleType: vehicleType || 'car',
        active: true,
      },
    });

    if (!rule) {
      throw new NotFoundException(
        'No pricing rule found for the given route and vehicle type',
      );
    }

    const basePrice = parseFloat(rule.basePrice as any);
    const weightCharge = weight * parseFloat(rule.weightRate as any);
    const volumeCharge = volume * parseFloat(rule.volumeRate as any);
    const distanceCharge = distance * parseFloat(rule.distanceRate as any);

    let serviceMultiplier = 1.0;
    switch (serviceType) {
      case ServiceType.EXPRESS:
        serviceMultiplier = parseFloat(rule.expressMultiplier as any);
        break;
      case ServiceType.SAME_DAY:
        serviceMultiplier = parseFloat(rule.sameDayMultiplier as any);
        break;
      case ServiceType.NEXT_DAY:
        serviceMultiplier = 1.25;
        break;
    }

    const subtotalBeforeMultiplier =
      basePrice + weightCharge + volumeCharge + distanceCharge;
    const multipliedSubtotal = subtotalBeforeMultiplier * serviceMultiplier;

    const fuelSurchargeRate = parseFloat(rule.fuelSurcharge as any) / 100;
    const fuelSurcharge = multipliedSubtotal * fuelSurchargeRate;

    let subtotal = multipliedSubtotal + fuelSurcharge;
    let discount = 0;

    if (b2bCustomerId) {
      const customer = await this.b2bRepo.findOne({
        where: { id: b2bCustomerId },
      });
      if (customer && customer.discountRate > 0) {
        discount = subtotal * (parseFloat(customer.discountRate as any) / 100);
      }
    }

    let total = subtotal - discount;
    const minPrice = parseFloat(rule.minPrice as any);
    if (total < minPrice) total = minPrice;
    if (rule.maxPrice) {
      const maxPrice = parseFloat(rule.maxPrice as any);
      if (total > maxPrice) total = maxPrice;
    }

    return {
      basePrice: Math.round(basePrice * 1000) / 1000,
      weightCharge: Math.round(weightCharge * 1000) / 1000,
      volumeCharge: Math.round(volumeCharge * 1000) / 1000,
      distanceCharge: Math.round(distanceCharge * 1000) / 1000,
      serviceMultiplier: Math.round(serviceMultiplier * 100) / 100,
      fuelSurcharge: Math.round(fuelSurcharge * 1000) / 1000,
      subtotal: Math.round(subtotal * 1000) / 1000,
      discount: Math.round(discount * 1000) / 1000,
      total: Math.round(total * 1000) / 1000,
      currency: 'OMR',
    };
  }

  async createPricingRule(dto: CreatePricingRuleDto): Promise<PricingRule> {
    const rule = this.pricingRepo.create(dto);
    return this.pricingRepo.save(rule);
  }

  async findAllRules(): Promise<PricingRule[]> {
    return this.pricingRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async updateRule(
    id: string,
    dto: Partial<CreatePricingRuleDto>,
  ): Promise<PricingRule> {
    const rule = await this.pricingRepo.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`Pricing rule with ID ${id} not found`);
    }
    Object.assign(rule, dto);
    return this.pricingRepo.save(rule);
  }

  async bulkUpdateRules(
    rules: { id: string; data: Partial<CreatePricingRuleDto> }[],
  ): Promise<PricingRule[]> {
    const updated: PricingRule[] = [];
    for (const { id, data } of rules) {
      const rule = await this.updateRule(id, data);
      updated.push(rule);
    }
    return updated;
  }

  async getPricingForB2B(
    customerId: string,
    weight: number,
    zones: { fromZoneId: string; toZoneId: string; distance?: number },
  ): Promise<{
    basePrice: number;
    discountRate: number;
    discountedPrice: number;
    finalPrice: number;
  }> {
    const customer = await this.b2bRepo.findOne({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException(`B2B customer with ID ${customerId} not found`);
    }

    const priceResult = await this.calculatePrice({
      fromZoneId: zones.fromZoneId,
      toZoneId: zones.toZoneId,
      weight,
      distance: zones.distance || 0,
      serviceType: ServiceType.STANDARD,
      b2bCustomerId: customerId,
    });

    return {
      basePrice: priceResult.subtotal,
      discountRate: parseFloat(customer.discountRate as any),
      discountedPrice: priceResult.discount,
      finalPrice: priceResult.total,
    };
  }
}
