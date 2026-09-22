import { describe, it, expect, beforeEach } from 'vitest';
import {
  isOwner,
  checkIsAdmin,
  checkUserAppAccess,
  canPerformAction,
  updateTeammatePermissions,
  removeAdminEmail,
  PRIMARY_OWNER,
  DEFAULT_ADMINS,
} from '@/lib/auth/admins';

describe('Admin Dashboard Tabs & Role-Based Permissions Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Owner Invariants', () => {
    it('recognizes PRIMARY_OWNER as owner and immutable', () => {
      expect(isOwner(PRIMARY_OWNER)).toBe(true);
      expect(isOwner('someone_else@example.com')).toBe(false);
      expect(isOwner('DAGIMALEMAYEHUU@GMAIL.COM ')).toBe(true);
    });

    it('prevents any attempt to remove or downgrade the owner', async () => {
      // Trying to remove owner as owner should fail
      const result = await removeAdminEmail(PRIMARY_OWNER, PRIMARY_OWNER);
      expect(result).toBe(false);

      // Non-owner trying to remove owner should fail
      const resultFromNonOwner = await removeAdminEmail('millionsimeon@gmail.com', PRIMARY_OWNER);
      expect(resultFromNonOwner).toBe(false);
    });

    it('prevents modifying owner permissions', async () => {
      const result = await updateTeammatePermissions(PRIMARY_OWNER, PRIMARY_OWNER, {
        can_manage_waitlist: false,
      });
      expect(result).toBe(false);
    });
  });

  describe('App Access Gates', () => {
    it('grants immediate app access to admins without waitlist checks', async () => {
      const ownerAccess = await checkUserAppAccess(PRIMARY_OWNER);
      expect(ownerAccess.allowed).toBe(true);
      expect(ownerAccess.isAdmin).toBe(true);
      expect(ownerAccess.isOwner).toBe(true);

      const adminAccess = await checkUserAppAccess('millionsimeon@gmail.com');
      expect(adminAccess.allowed).toBe(true);
      expect(adminAccess.isAdmin).toBe(true);
      expect(adminAccess.status).toBe('approved');
    });

    it('denies unauthenticated users', async () => {
      const unauth = await checkUserAppAccess(null);
      expect(unauth.allowed).toBe(false);
      expect(unauth.status).toBe('unauthenticated');
    });
  });

  describe('Granular Teammate Permissions', () => {
    const teammate = 'millionsimeon@gmail.com';

    it('allows owner to perform all dashboard tab actions', async () => {
      expect(await canPerformAction(PRIMARY_OWNER, 'manage_waitlist')).toBe(true);
      expect(await canPerformAction(PRIMARY_OWNER, 'view_production')).toBe(true);
      expect(await canPerformAction(PRIMARY_OWNER, 'manage_team')).toBe(true);
    });

    it('grants default member permissions for waitlist and production but denies team management', async () => {
      expect(await canPerformAction(teammate, 'manage_waitlist')).toBe(true);
      expect(await canPerformAction(teammate, 'view_production')).toBe(true);
      expect(await canPerformAction(teammate, 'manage_team')).toBe(false);
    });

    it('allows owner to revoke a specific permission (e.g. waitlist approval) for teammate', async () => {
      // Owner revokes waitlist management from teammate
      const updateResult = await updateTeammatePermissions(PRIMARY_OWNER, teammate, {
        can_manage_waitlist: false,
      });
      expect(updateResult).toBe(true);

      // Verify permission is now false
      expect(await canPerformAction(teammate, 'manage_waitlist')).toBe(false);
      // Production tab should remain true
      expect(await canPerformAction(teammate, 'view_production')).toBe(true);
    });

    it('blocks non-owner from updating teammate permissions', async () => {
      const unauthorizedUpdate = await updateTeammatePermissions(
        'other@example.com',
        teammate,
        { can_manage_waitlist: false }
      );
      expect(unauthorizedUpdate).toBe(false);
    });
  });
});
