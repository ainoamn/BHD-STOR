/**
 * @fileoverview Encryption Module
 * @description NestJS module providing encryption services for the application.
 * Provides AES-256-GCM encryption, key derivation, HMAC, and hashing capabilities.
 */

import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './encryption.service';

/**
 * Global Encryption Module
 *
 * Import once in the root AppModule to make encryption services
 * available throughout the application.
 *
 * @example
 * // Encrypt sensitive PII
 * const encrypted = this.encryptionService.encrypt(userEmail);
 * // Store encrypted.ciphertext, encrypted.iv, encrypted.authTag, encrypted.salt
 *
 * @example
 * // Decrypt
 * const decrypted = this.encryptionService.decrypt(encryptedData);
 */
@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
