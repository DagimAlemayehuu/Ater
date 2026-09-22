import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export const PRIMARY_OWNER = 'dagimalemayehuu@gmail.com';

export const DEFAULT_ADMINS = [
  'dagimalemayehuu@gmail.com',
  'millionsimeon@gmail.com',
];

export interface AdminPermissions {
  can_manage_waitlist: boolean;
  can_view_production: boolean;
  can_manage_team: boolean;
}

export interface TeamMember {
  email: string;
  role: 'owner' | 'admin';
  is_owner: boolean;
  permissions: AdminPermissions;
  full_name?: string | null;
  created_at?: string;
}

const DEFAULT_OWNER_PERMISSIONS: AdminPermissions = {
  can_manage_waitlist: true,
  can_view_production: true,
  can_manage_team: true,
};

const DEFAULT_MEMBER_PERMISSIONS: AdminPermissions = {
  can_manage_waitlist: true,
  can_view_production: true,
  can_manage_team: false,
};

export function isOwner(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === PRIMARY_OWNER.toLowerCase();
}

/**
 * Checks whether an email has admin privileges by checking:
 * 1. The hardcoded default admin list
 * 2. The database (waiting_list table where referral_source = 'admin')
 */
export async function checkIsAdmin(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  
  if (DEFAULT_ADMINS.some((a) => a.toLowerCase() === clean)) {
    return true;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  try {
    const { data } = await supabase
      .from('waiting_list')
      .select('referral_source')
      .eq('email', clean)
      .maybeSingle();

    return data?.referral_source === 'admin';
  } catch (_e) {
    return false;
  }
}

/**
 * Checks whether a user has permission to access the learning application.
 * Returns true if the user is an admin or has an approved waitlist status.
 */
export async function checkUserAppAccess(email?: string | null): Promise<{
  allowed: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  status: string;
}> {
  if (!email) {
    return { allowed: false, isAdmin: false, isOwner: false, status: 'unauthenticated' };
  }

  const clean = email.trim().toLowerCase();
  const isAdmin = await checkIsAdmin(clean);
  const userIsOwner = isOwner(clean);

  if (isAdmin || userIsOwner) {
    return { allowed: true, isAdmin: true, isOwner: userIsOwner, status: 'approved' };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { allowed: false, isAdmin: false, isOwner: false, status: 'client_unavailable' };
  }

  try {
    const { data } = await supabase
      .from('waiting_list')
      .select('status')
      .eq('email', clean)
      .maybeSingle();

    const status = data?.status || 'pending';
    return {
      allowed: status === 'approved',
      isAdmin: false,
      isOwner: false,
      status,
    };
  } catch (_err) {
    return { allowed: false, isAdmin: false, isOwner: false, status: 'pending' };
  }
}

/**
 * Fetches all registered admin emails from database and default list.
 */
export async function getAdminEmails(): Promise<string[]> {
  const adminSet = new Set<string>(DEFAULT_ADMINS.map((e) => e.toLowerCase()));

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return Array.from(adminSet);

  try {
    const { data } = await supabase
      .from('waiting_list')
      .select('email')
      .eq('referral_source', 'admin');

    if (Array.isArray(data)) {
      data.forEach((row) => {
        if (row?.email) adminSet.add(row.email.trim().toLowerCase());
      });
    }
  } catch (_e) {}

  return Array.from(adminSet);
}

/**
 * Fetches all team members with their roles and permissions.
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  const adminEmails = await getAdminEmails();
  const membersMap = new Map<string, TeamMember>();

  // Initialize with known default admins
  adminEmails.forEach((email) => {
    const clean = email.toLowerCase();
    const isPrimary = isOwner(clean);
    membersMap.set(clean, {
      email: clean,
      role: isPrimary ? 'owner' : 'admin',
      is_owner: isPrimary,
      permissions: isPrimary ? { ...DEFAULT_OWNER_PERMISSIONS } : { ...DEFAULT_MEMBER_PERMISSIONS },
    });
  });

  // Query database for custom permissions or full names if stored
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('waiting_list')
        .select('email, full_name, created_at, status')
        .in('email', Array.from(membersMap.keys()));

      if (Array.isArray(data)) {
        data.forEach((row) => {
          const clean = row.email?.toLowerCase();
          if (clean && membersMap.has(clean)) {
            const existing = membersMap.get(clean)!;
            existing.full_name = row.full_name || null;
            existing.created_at = row.created_at || undefined;
          }
        });
      }
    } catch (_e) {}
  }

  // Load any locally stored permission overrides for teammates
  try {
    const stored = localStorage.getItem('ater_team_permissions_v1');
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.keys(parsed).forEach((email) => {
        const clean = email.toLowerCase();
        if (membersMap.has(clean) && !isOwner(clean)) {
          const m = membersMap.get(clean)!;
          m.permissions = { ...m.permissions, ...parsed[email] };
        }
      });
    }
  } catch (_e) {}

  return Array.from(membersMap.values());
}

/**
 * Updates teammate permissions (only allowed if actor is owner, and cannot alter owner).
 */
export async function updateTeammatePermissions(
  actorEmail: string,
  targetEmail: string,
  permissions: Partial<AdminPermissions>
): Promise<boolean> {
  if (!isOwner(actorEmail)) return false;
  const targetClean = targetEmail.trim().toLowerCase();
  if (isOwner(targetClean)) return false; // Owner permissions cannot be modified

  try {
    let existingMap: Record<string, AdminPermissions> = {};
    const stored = localStorage.getItem('ater_team_permissions_v1');
    if (stored) {
      existingMap = JSON.parse(stored);
    }
    existingMap[targetClean] = {
      ...(existingMap[targetClean] || DEFAULT_MEMBER_PERMISSIONS),
      ...permissions,
    };
    localStorage.setItem('ater_team_permissions_v1', JSON.stringify(existingMap));
    return true;
  } catch (_e) {
    return false;
  }
}

/**
 * Updates a waitlist user's status: 'approved', 'denied', or 'pending'.
 */
export async function updateWaitlistStatus(
  email: string,
  newStatus: 'approved' | 'denied' | 'pending'
): Promise<boolean> {
  const clean = email.trim().toLowerCase();
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('waiting_list')
      .update({ status: newStatus })
      .eq('email', clean);

    return !error;
  } catch (_e) {
    return false;
  }
}

/**
 * Grants admin role to an email in the database.
 */
export async function addAdminEmail(email: string): Promise<boolean> {
  const clean = email.trim().toLowerCase();
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  try {
    // Check if user exists in waiting_list
    const { data: existing } = await supabase
      .from('waiting_list')
      .select('id')
      .eq('email', clean)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('waiting_list')
        .update({ referral_source: 'admin', status: 'approved' })
        .eq('email', clean);
      return !error;
    } else {
      const { error } = await supabase
        .from('waiting_list')
        .insert([{ email: clean, referral_source: 'admin', status: 'approved' }]);
      return !error;
    }
  } catch (_e) {
    return false;
  }
}

/**
 * Revokes admin role from an email in the database (protecting primary owner).
 */
export async function removeAdminEmail(actorEmail: string, emailToRemove: string): Promise<boolean> {
  const cleanActor = actorEmail.trim().toLowerCase();
  const cleanTarget = emailToRemove.trim().toLowerCase();

  // Protect owner
  if (isOwner(cleanTarget)) return false;

  // Only owner can remove team members
  if (!isOwner(cleanActor)) return false;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('waiting_list')
      .update({ referral_source: null })
      .eq('email', cleanTarget);
    return !error;
  } catch (_e) {
    return false;
  }
}

/**
 * Checks whether a given admin has permission to perform a specific action:
 * - 'manage_waitlist'
 * - 'view_production'
 * - 'manage_team'
 */
export async function canPerformAction(
  email: string | null | undefined,
  action: 'manage_waitlist' | 'view_production' | 'manage_team'
): Promise<boolean> {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  if (isOwner(clean)) return true;

  const isAdmin = await checkIsAdmin(clean);
  if (!isAdmin) return false;

  // Owner action is strictly restricted to owner
  if (action === 'manage_team') return false;

  try {
    const stored = localStorage.getItem('ater_team_permissions_v1');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed[clean]) {
        if (action === 'manage_waitlist') {
          return parsed[clean].can_manage_waitlist ?? DEFAULT_MEMBER_PERMISSIONS.can_manage_waitlist;
        }
        if (action === 'view_production') {
          return parsed[clean].can_view_production ?? DEFAULT_MEMBER_PERMISSIONS.can_view_production;
        }
      }
    }
  } catch (_e) {}

  if (action === 'manage_waitlist') return DEFAULT_MEMBER_PERMISSIONS.can_manage_waitlist;
  if (action === 'view_production') return DEFAULT_MEMBER_PERMISSIONS.can_view_production;
  return false;
}

