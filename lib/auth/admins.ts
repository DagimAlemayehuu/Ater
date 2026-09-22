import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export const DEFAULT_ADMINS = [
  'dagimalemayehuu@gmail.com',
  'millionsimeon@gmail.com',
];

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
export async function removeAdminEmail(email: string): Promise<boolean> {
  const clean = email.trim().toLowerCase();
  if (clean === DEFAULT_ADMINS[0].toLowerCase()) return false; // Prevent removing owner

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('waiting_list')
      .update({ referral_source: null })
      .eq('email', clean);
    return !error;
  } catch (_e) {
    return false;
  }
}
