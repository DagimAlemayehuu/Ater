// Supabase Edge Function: admin-mutations
// Purpose: Secure administration actions (credits, locks, bans) with audit logging.

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

    // Authorization: Check if user is Admin
    const { data: isAdmin, error: adminError } = await supabaseClient.rpc('is_admin')
    if (adminError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const { action, target_user_id, ...params } = await req.json()

    if (!action || !target_user_id) {
      return new Response(JSON.stringify({ error: 'Missing action or target_user_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let resultData = null
    let logDetails = { ...params }

    if (action === 'grant_credits') {
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
    } else if (action === 'lock_user') {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ account_status: 'suspended' })
        .eq('id', target_user_id)
      if (error) throw error
      resultData = { status: 'suspended' }
    } else if (action === 'ban_user') {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ account_status: 'banned' })
        .eq('id', target_user_id)
      if (error) throw error
      resultData = { status: 'banned' }
    } else {
      return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Audit Logging
    await supabaseAdmin.from('admin_audit_log').insert({
      admin_id: user.id,
      target_user_id,
      action_type: action,
      action_details: logDetails
    })

    return new Response(JSON.stringify({ success: true, data: resultData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
