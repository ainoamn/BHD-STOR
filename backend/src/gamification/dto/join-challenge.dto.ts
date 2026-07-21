import { IsUUID } from 'class-validator';

export class JoinChallengeDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  challengeId: string;
}
