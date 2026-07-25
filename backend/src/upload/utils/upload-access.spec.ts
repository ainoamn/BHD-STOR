import {
  assertSafePublicId,
  assertUploadDeleteAccess,
  buildOwnedCloudinaryFolder,
  buildOwnedUploadBasename,
  parseUploadOwnerId,
} from './upload-access';

const OWNER = '550e8400-e29b-41d4-a716-446655440000';
const OTHER = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

describe('upload-access', () => {
  describe('buildOwnedUploadBasename', () => {
    it('prefixes owner uuid', () => {
      const name = buildOwnedUploadBasename(OWNER, 'photo.PNG', 1000, 'xyz');
      expect(name).toBe(`u_${OWNER}_1000_xyz.png`);
    });
  });

  describe('buildOwnedCloudinaryFolder', () => {
    it('nests under u_{userId}', () => {
      expect(buildOwnedCloudinaryFolder('bhd-marketplace', OWNER)).toBe(
        `bhd-marketplace/u_${OWNER}`,
      );
    });
  });

  describe('parseUploadOwnerId', () => {
    it('parses local filename', () => {
      expect(
        parseUploadOwnerId(`u_${OWNER}_1000_xyz.jpg`),
      ).toBe(OWNER);
    });

    it('parses cloudinary folder public_id', () => {
      expect(
        parseUploadOwnerId(`bhd-marketplace/u_${OWNER}/abc123`),
      ).toBe(OWNER);
    });

    it('returns null for legacy ids', () => {
      expect(parseUploadOwnerId('1710000000-abc.jpg')).toBeNull();
    });
  });

  describe('assertUploadDeleteAccess', () => {
    it('allows owner', () => {
      expect(() =>
        assertUploadDeleteAccess(`u_${OWNER}_1_a.jpg`, OWNER, 'seller'),
      ).not.toThrow();
    });

    it('allows staff on any id', () => {
      expect(() =>
        assertUploadDeleteAccess('legacy.jpg', OTHER, 'admin'),
      ).not.toThrow();
    });

    it('rejects other users', () => {
      expect(() =>
        assertUploadDeleteAccess(`u_${OWNER}_1_a.jpg`, OTHER, 'customer'),
      ).toThrow(/only delete your own/i);
    });

    it('rejects legacy ids for non-staff', () => {
      expect(() =>
        assertUploadDeleteAccess('legacy.jpg', OWNER, 'seller'),
      ).toThrow(/only delete your own/i);
    });
  });

  describe('assertSafePublicId', () => {
    it('rejects path traversal', () => {
      expect(() => assertSafePublicId('../etc/passwd')).toThrow(/Invalid/);
    });
  });
});
