import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as crypto from 'crypto';
import { UsersService, UserSecurityFields } from '@users/users.service';

export interface TotpSetupResult {
  secret: string;
  otpauthUrl: string;
  qrLabel: string;
}

@Injectable()
export class TotpService {
  private readonly logger = new Logger(TotpService.name);
  private readonly encryptionKey: Buffer;
  private readonly backupPepper: string;
  private readonly issuer: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = this.resolveEncryptionKey();
    this.backupPepper =
      this.configService.get<string>('API_KEY_PEPPER') ||
      this.configService.get<string>('JWT_SECRET', '') ||
      '';
    this.issuer = this.configService.get<string>(
      'TOTP_ISSUER',
      'BHD Oman Marketplace',
    );
  }

  /**
   * Begin TOTP enrollment: generate secret, store encrypted temp, return setup payload.
   */
  async setup(userId: string): Promise<TotpSetupResult> {
    const user = await this.usersService.getUserSecurity(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    const secret = authenticator.generateSecret();
    const encrypted = this.encryptSecret(secret);
    await this.usersService.saveTwoFactorState(userId, {
      twoFactorTempSecret: encrypted,
    });

    const qrLabel = `${this.issuer}:${user.email}`;
    const otpauthUrl = authenticator.keyuri(user.email, this.issuer, secret);

    this.logger.log(`TOTP setup initiated for user ${userId}`);
    return { secret, otpauthUrl, qrLabel };
  }

  /**
   * Confirm enrollment with a valid TOTP code; returns one-time backup codes.
   */
  async enable(userId: string, code: string): Promise<{ backupCodes: string[] }> {
    const user = await this.usersService.getUserSecurity(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }
    if (!user.twoFactorTempSecret) {
      throw new BadRequestException('No pending two-factor setup. Call setup first.');
    }

    const plainSecret = this.decryptSecret(user.twoFactorTempSecret);
    if (!authenticator.check(code, plainSecret)) {
      throw new UnauthorizedException('Invalid verification code');
    }

    const backupCodes = this.generateBackupCodes(8);
    const backupHashes = backupCodes.map((c) => this.hashBackupCode(c));

    await this.usersService.saveTwoFactorState(userId, {
      twoFactorSecret: user.twoFactorTempSecret,
      twoFactorTempSecret: null,
      twoFactorEnabled: true,
      twoFactorBackupHashes: backupHashes,
    });

    this.logger.log(`TOTP enabled for user ${userId}`);
    return { backupCodes };
  }

  /**
   * Disable 2FA after verifying TOTP or a backup code.
   */
  async disable(userId: string, code: string, _password?: string): Promise<{ message: string }> {
    const user = await this.usersService.getUserSecurity(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    const valid = await this.verifyCodeAgainstUser(user, code, true);
    if (!valid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.usersService.saveTwoFactorState(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorTempSecret: null,
      twoFactorBackupHashes: null,
    });

    this.logger.log(`TOTP disabled for user ${userId}`);
    return { message: 'Two-factor authentication has been disabled' };
  }

  /**
   * Verify login TOTP or single-use backup code.
   */
  async verifyLoginCode(userId: string, code: string): Promise<boolean> {
    const user = await this.usersService.getUserSecurity(userId);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }
    return this.verifyCodeAgainstUser(user, code, true);
  }

  /** AES-256-GCM encrypt; format iv:tag:ciphertext (hex). */
  encryptSecret(plain: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(plain, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /** Decrypt AES-256-GCM payload produced by encryptSecret. */
  decryptSecret(payload: string): string {
    const parts = payload.split(':');
    if (parts.length !== 3) {
      throw new BadRequestException('Invalid encrypted secret format');
    }
    const [ivHex, tagHex, dataHex] = parts;
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  private async verifyCodeAgainstUser(
    user: UserSecurityFields,
    code: string,
    consumeBackup: boolean,
  ): Promise<boolean> {
    const normalized = (code || '').replace(/\s+/g, '').trim();
    if (!normalized) {
      return false;
    }

    // Prefer TOTP when code looks like 6 digits
    if (/^\d{6}$/.test(normalized) && user.twoFactorSecret) {
      try {
        const plain = this.decryptSecret(user.twoFactorSecret);
        if (authenticator.check(normalized, plain)) {
          return true;
        }
      } catch (err) {
        this.logger.warn(
          `Failed to decrypt TOTP secret for user ${user.id}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    // Backup codes (alphanumeric / longer than 6)
    const hashes = user.twoFactorBackupHashes || [];
    if (hashes.length === 0) {
      return false;
    }

    const candidateHash = this.hashBackupCode(normalized);
    const matchIndex = hashes.findIndex((h) => this.equalHex(h, candidateHash));
    if (matchIndex < 0) {
      return false;
    }

    if (consumeBackup) {
      const remaining = [...hashes];
      remaining.splice(matchIndex, 1);
      await this.usersService.saveTwoFactorState(user.id, {
        twoFactorBackupHashes: remaining.length > 0 ? remaining : null,
      });
    }
    return true;
  }

  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // 8 bytes -> 16 hex chars, formatted as xxxx-xxxx for readability
      const raw = crypto.randomBytes(4).toString('hex');
      codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
    }
    return codes;
  }

  private hashBackupCode(code: string): string {
    const normalized = code.replace(/[-\s]/g, '').toLowerCase();
    return crypto
      .createHash('sha256')
      .update(`${this.backupPepper}:${normalized}`, 'utf8')
      .digest('hex');
  }

  private equalHex(a: string, b: string): boolean {
    try {
      const bufA = Buffer.from(a, 'hex');
      const bufB = Buffer.from(b, 'hex');
      if (bufA.length === 0 || bufA.length !== bufB.length) {
        return false;
      }
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  private resolveEncryptionKey(): Buffer {
    const hexKey = this.configService.get<string>('TOTP_ENCRYPTION_KEY', '');
    if (hexKey && /^[a-f0-9]{64}$/i.test(hexKey)) {
      return Buffer.from(hexKey, 'hex');
    }
    const jwtSecret = this.configService.get<string>('JWT_SECRET', 'dev-secret');
    return crypto.createHash('sha256').update(`${jwtSecret}:totp`, 'utf8').digest();
  }
}
