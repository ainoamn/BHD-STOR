import { IsUUID } from 'class-validator';

export class EquipBadgeDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  badgeId: string;
}
