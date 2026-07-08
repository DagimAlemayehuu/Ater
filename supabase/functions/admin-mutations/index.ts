// Supabase Edge Function: admin-mutations
// Purpose: Secure administration actions (credits, locks, bans, waitlist) with audit logging.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ""
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Authorization: Check if user is Admin or Developer (case-insensitive)
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['admin', 'developer'].includes(profile.role.toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const body = await req.json()
    const { action, target_user_id, ...params } = body

    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let resultData = null
    let logDetails = { ...params }

    if (action === 'grant_credits') {
      if (!target_user_id) throw new Error('Missing target_user_id')
      const { amount } = params
      if (typeof amount !== 'number') {
        throw new Error('Invalid amount for grant_credits')
      }
      const { data, error } = await supabaseAdmin.rpc('admin_adjust_user_balance_delta', {
        target_user_id,
        delta_amount: amount
      })
      if (error) throw error
      resultData = data
    } else if (action === 'update_user_status') {
      if (!target_user_id) throw new Error('Missing target_user_id')
      const { status } = params
      if (!['active', 'suspended', 'banned'].includes(status)) {
        throw new Error('Invalid status')
      }
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ account_status: status })
        .eq('id', target_user_id)
      if (error) throw error
      resultData = { status }
    } else if (action === 'update_feature_locks') {
      if (!target_user_id) throw new Error('Missing target_user_id')
      const { locked_features } = params
      if (!Array.isArray(locked_features)) {
        throw new Error('locked_features must be an array')
      }
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ locked_features })
        .eq('id', target_user_id)
      if (error) throw error
      resultData = { locked_features }
    } else if (action === 'blacklist_hardware') {
      const { machine_id, reason } = params
      if (!machine_id) throw new Error('Missing machine_id')
      const { error } = await supabaseAdmin
        .from('hardware_blacklist')
        .insert({
          machine_id,
          reason: reason || 'Manual admin block'
        })
      if (error) throw error
      resultData = { machine_id, blacklisted: true }
    } else if (action === 'remove_hardware_blacklist') {
      const { machine_id } = params
      if (!machine_id) throw new Error('Missing machine_id')
      const { error } = await supabaseAdmin
        .from('hardware_blacklist')
        .delete()
        .eq('machine_id', machine_id)
      if (error) throw error
      resultData = { machine_id, blacklisted: false }
    } else if (action === 'handle_waitlist_decision') {
      const { waitlist_id, email, decision, activation_code } = params
      if (!waitlist_id || !email || !decision) throw new Error('Missing parameters for waitlist decision')

      // Update waiting_list table
      const { error: wlError } = await supabaseAdmin
        .from('waiting_list')
        .update({ status: decision, activation_code })
        .eq('id', waitlist_id)
      if (wlError) throw wlError

      // Update profiles table
      const { error: profError } = await supabaseAdmin
        .from('profiles')
        .update({
          activation_code,
          is_approved: decision === 'approved',
          waitlist_status: decision
        })
        .eq('email', email)
      if (profError) throw profError

      resultData = { waitlist_id, decision }
    } else {
      return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Audit Logging
    await supabaseAdmin.from('admin_audit_log').insert({
      admin_id: user.id,
      target_user_id: target_user_id || params.target_user_id || null,
      action_type: action,
      action_details: logDetails
    })

    return new Response(JSON.stringify({ success: true, data: resultData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error(`[Admin Mutation Error] ${error.message}`)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
