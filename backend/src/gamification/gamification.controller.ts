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
  Req,
} from '@nestjs/common';
import {
  GamificationService,
  UserGamificationStats,
} from './services/gamification.service';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import {
  LeaderboardEntry,
  LeaderboardPeriod,
} from './entities/leaderboard-entry.entity';
import { UserBadge } from './entities/user-badge.entity';
import { Challenge } from './entities/challenge.entity';
import { ChallengeParticipant } from './entities/challenge-participant.entity';
import { TrackProgressDto } from './dto/track-progress.dto';
import { AwardPointsDto } from './dto/award-points.dto';
import { EquipBadgeDto } from './dto/equip-badge.dto';
import { JoinChallengeDto } from './dto/join-challenge.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { requireRequestUserId } from '../auth/utils/request-user';
import { assertSelfOrStaff } from '../auth/utils/self-or-staff';
import { Public } from '../common/decorators/public.decorator';

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  // ─── Achievements ─────────────────────────────────────────────────

  @Public()
  @Get('achievements')
  async getAllAchievements(): Promise<Achievement[]> {
    return this.gamificationService.achievementRepo.find();
  }

  @Get('users/:userId/achievements')
  async getUserAchievements(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<UserAchievement[]> {
    return this.gamificationService.getUserAchievements(userId);
  }

  @Post('track-progress')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async trackProgress(
    @Body() dto: TrackProgressDto,
  ): Promise<UserAchievement[]> {
    return this.gamificationService.trackProgress(
      dto.userId,
      dto.action,
      dto.value,
    );
  }

  @Post('check-achievements/:userId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async checkAchievements(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<UserAchievement[]> {
    return this.gamificationService.checkAchievements(userId);
  }

  // ─── Leaderboard ──────────────────────────────────────────────────

  @Public()
  @Get('leaderboard')
  async getLeaderboard(
    @Query('period') period: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME,
    @Query('limit') limit: number = 50,
  ): Promise<LeaderboardEntry[]> {
    return this.gamificationService.getLeaderboard(period, limit);
  }

  // ─── Badges ───────────────────────────────────────────────────────

  @Get('users/:userId/badges')
  async getUserBadges(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<UserBadge[]> {
    return this.gamificationService.getUserBadges(userId);
  }

  @Post('equip-badge')
  @HttpCode(HttpStatus.OK)
  async equipBadge(
    @Body() dto: EquipBadgeDto,
    @Req() req: any,
  ): Promise<UserBadge> {
    const userId = requireRequestUserId(req.user);
    return this.gamificationService.equipBadge(userId, dto.badgeId);
  }

  // ─── Challenges ───────────────────────────────────────────────────

  @Public()
  @Get('challenges')
  async getActiveChallenges(): Promise<Challenge[]> {
    return this.gamificationService.getActiveChallenges();
  }

  @Post('join-challenge')
  @HttpCode(HttpStatus.OK)
  async joinChallenge(
    @Body() dto: JoinChallengeDto,
    @Req() req: any,
  ): Promise<ChallengeParticipant> {
    const userId = requireRequestUserId(req.user);
    return this.gamificationService.joinChallenge(userId, dto.challengeId);
  }

  @Get('users/:userId/challenges')
  async getUserChallenges(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() req: any,
  ): Promise<ChallengeParticipant[]> {
    const requesterId = requireRequestUserId(req.user);
    assertSelfOrStaff(
      requesterId,
      userId,
      req.user?.role,
      'You can only view your own challenges',
    );
    return this.gamificationService.getUserChallenges(userId);
  }

  // ─── Points & Stats ───────────────────────────────────────────────

  @Post('award-points')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async awardPoints(@Body() dto: AwardPointsDto): Promise<LeaderboardEntry> {
    return this.gamificationService.awardPoints(
      dto.userId,
      dto.points,
      dto.reason,
    );
  }

  @Get('users/:userId/stats')
  async getUserStats(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<UserGamificationStats> {
    return this.gamificationService.getUserStats(userId);
  }
}
