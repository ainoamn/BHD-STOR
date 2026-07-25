import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { isStaffRole } from '../../auth/utils/roles';

/** Filename / Cloudinary public_id prefix that binds an upload to its owner. */
export const UPLOAD_OWNER_PREFIX = 'u_';

/**
 * Build a storage key segment owned by `userId`.
 * Example local: `u_550e8400-e29b-41d4-a716-446655440000_1710000000_abc12.jpg`
 */
export function buildOwnedUploadBasename(
  userId: string,
  originalName: string,
  now = Date.now(),
  random = Math.random().toString(36).substring(2, 15),
): string {
  const owner = sanitizeOwnerId(userId);
  const ext = extractSafeExt(originalName);
  return `${UPLOAD_OWNER_PREFIX}${owner}_${now}_${random}${ext}`;
}

/** Cloudinary folder: `{base}/u_{userId}` so public_id contains the owner segment. */
export function buildOwnedCloudinaryFolder(
  baseFolder: string,
  userId: string,
): string {
  const owner = sanitizeOwnerId(userId);
  const base = String(baseFolder || 'bhd-marketplace').replace(/\/+$/, '');
  return `${base}/${UPLOAD_OWNER_PREFIX}${owner}`;
}

/** Extract owner user id from a publicId / filename, or null if legacy/unscoped. */
export function parseUploadOwnerId(publicId: string): string | null {
  const id = basenameOnly(publicId);
  // u_{uuid}_{rest}  OR  .../u_{uuid}/...
  const folderMatch = publicId.match(
    /(?:^|\/)u_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/|$)/i,
  );
  if (folderMatch) return folderMatch[1].toLowerCase();

  const fileMatch = id.match(
    /^u_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_/i,
  );
  return fileMatch ? fileMatch[1].toLowerCase() : null;
}

/**
 * Staff may delete any; owners only their prefixed uploads.
 * Legacy unscoped publicIds are staff-only (fail-closed).
 */
export function assertUploadDeleteAccess(
  publicId: string,
  requesterId: string,
  role?: string,
): void {
  assertSafePublicId(publicId);
  if (isStaffRole(role)) return;

  const ownerId = parseUploadOwnerId(publicId);
  if (ownerId && requesterId && ownerId === String(requesterId).toLowerCase()) {
    return;
  }

  throw new ForbiddenException(
    'You can only delete your own uploads',
  );
}

export function assertSafePublicId(publicId: string): void {
  const raw = String(publicId || '').trim();
  if (!raw) {
    throw new BadRequestException('Public ID is required');
  }
  if (
    raw.includes('..') ||
    raw.includes('\\') ||
    raw.startsWith('/') ||
    raw.includes('\0')
  ) {
    throw new BadRequestException('Invalid public ID');
  }
}

function sanitizeOwnerId(userId: string): string {
  const id = String(userId || '').trim().toLowerCase();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id,
    )
  ) {
    throw new BadRequestException('Invalid uploader id');
  }
  return id;
}

function extractSafeExt(originalName: string): string {
  const name = String(originalName || '');
  const dot = name.lastIndexOf('.');
  if (dot < 0) return '';
  const ext = name.slice(dot).toLowerCase();
  if (!/^\.[a-z0-9]{1,8}$/.test(ext)) return '';
  return ext;
}

function basenameOnly(publicId: string): string {
  const parts = String(publicId || '').split('/');
  return parts[parts.length - 1] || '';
}
