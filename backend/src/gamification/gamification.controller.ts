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
} from '@nestjs/common';
import { GamificationService, UserGamificationStats } from './services/gamification.service';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { LeaderboardEntry, LeaderboardPeriod } from './entities/leaderboard-entry.entity';
import { UserBadge } from './entities/user-badge.entity';
import { Challenge } from './entities/challenge.entity';
import { ChallengeParticipant } from './entities/challenge-participant.entity';
import { TrackProgressDto } from './dto/track-progress.dto';
import { AwardPointsDto } from './dto/award-points.dto';
import { EquipBadgeDto } from './dto/equip-badge.dto';
import { JoinChallengeDto } from './dto/join-challenge.dto';

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  // ─── Achievements ─────────────────────────────────────────────────

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
  @HttpCode(HttpStatus.OK)
  async trackProgress(
    @Body() dto: TrackProgressDto,
  ): Promise<UserAchievement[]> {
    return this.gamificationService.trackProgress(dto.userId, dto.action, dto.value);
  }

  @Post('check-achievements/:userId')
  @HttpCode(HttpStatus.OK)
  async checkAchievements(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<UserAchievement[]> {
    return this.gamificationService.checkAchievements(userId);
  }

  // ─── Leaderboard ──────────────────────────────────────────────────

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
  async equipBadge(@Body() dto: EquipBadgeDto): Promise<UserBadge> {
    return this.gamificationService.equipBadge(dto.userId, dto.badgeId);
  }

  // ─── Challenges ───────────────────────────────────────────────────

  @Get('challenges')
  async getActiveChallenges(): Promise<Challenge[]> {
    return this.gamificationService.getActiveChallenges();
  }

  @Post('join-challenge')
  @HttpCode(HttpStatus.OK)
  async joinChallenge(
    @Body() dto: JoinChallengeDto,
  ): Promise<ChallengeParticipant> {
    return this.gamificationService.joinChallenge(dto.userId, dto.challengeId);
  }

  @Get('users/:userId/challenges')
  async getUserChallenges(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<ChallengeParticipant[]> {
    return this.gamificationService.getUserChallenges(userId);
  }

  // ─── Points & Stats ───────────────────────────────────────────────

  @Post('award-points')
  @HttpCode(HttpStatus.OK)
  async awardPoints(@Body() dto: AwardPointsDto): Promise<LeaderboardEntry> {
    return this.gamificationService.awardPoints(dto.userId, dto.points, dto.reason);
  }

  @Get('users/:userId/stats')
  async getUserStats(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<UserGamificationStats> {
    return this.gamificationService.getUserStats(userId);
  }
}
