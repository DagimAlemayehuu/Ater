// Next.js Administrative Panel Service Wrappers
// Location: apps/admin/src/lib/credit_actions.ts
// Purpose: Provide admin SQL / Supabase mutations for credit balances and pricing rules.

import { supabase } from './supabase'

/**
 * Forcefully adjust or override a user's credit balance.
 * Enforces transactional safety by updating public.profiles directly.
 * 
 * @param targetUserId The UUID of the user profile to modify
 * @param newBalance The absolute integer balance target (must be >= 0)
 */
export async function adminOverrideUserBalance(targetUserId: string, newBalance: number) {
  if (!Number.isInteger(newBalance) || newBalance < 0) {
    throw new Error('Overriding balance must be a positive integer.')
  }

  // Deduct/Add via profile balance update
  const { data, error } = await supabase
    .from('profiles')
    .update({ credit_balance: newBalance })
    .eq('id', targetUserId)
    .select()

  if (error) {
    console.error('[Admin Operations] Failed to override user balance:', error)
    throw new Error(`Balance adjustment failed: ${error.message}`)
  }

  return { success: true, profile: data?.[0] }
}

/**
 * Increment or decrement a user's credit balance.
 * 
 * @param targetUserId The UUID of the user profile
 * @param delta The positive/negative integer shift amount
 */
export async function adminAdjustUserBalanceDelta(targetUserId: string, delta: number) {
  if (!Number.isInteger(delta)) {
    throw new Error('Balance adjustment delta must be an integer.')
  }

  // SQL function trigger: increment balance.
  // In Supabase, delta updates can be executed via RPC or raw query, e.g.:
  // UPDATE profiles SET credit_balance = credit_balance + delta WHERE id = targetUserId
  const { data, error } = await supabase.rpc('admin_adjust_user_balance_delta', {
    target_user_id: targetUserId,
    delta_amount: delta
  })

  if (error) {
    console.error('[Admin Operations] Failed to execute balance delta adjustment:', error)
    throw new Error(`Delta balance adjustment failed: ${error.message}`)
  }

  return { success: true, result: data }
}

/**
 * Dynamically adjust feature prices global pricing configs.
 * Updating these records instantly affects all clients on next server handshake.
 * 
 * @param featureSlug The target feature identifier (e.g. 'ai-ingestion')
 * @param newCreditCost The updated credit consumption cost (must be >= 0)
 */
export async function adminUpdateFeaturePricing(featureSlug: string, newCreditCost: number) {
  if (!Number.isInteger(newCreditCost) || newCreditCost < 0) {
    throw new Error('Feature cost must be a positive integer.')
  }

  const { data, error } = await supabase
    .from('system_config')
    .update({ 
      credit_cost: newCreditCost,
      updated_at: new Date().toISOString()
    })
    .eq('slug', featureSlug)
    .select()

  if (error) {
    console.error('[Admin Operations] Failed to adjust feature pricing configuration:', error)
    throw new Error(`Feature pricing update failed: ${error.message}`)
  }

  return { success: true, config: data?.[0] }
}
