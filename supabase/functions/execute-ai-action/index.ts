// Supabase Edge Function: execute-ai-action
// Location: supabase/functions/execute-ai-action/index.ts
// Purpose: Secure, server-side gateway that deducts user credits before invoking GenAI services.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Extract Bearer Token and Verify Authenticated Identity
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ""
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""

    // Initializing client under the user's JWT context
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized credentials verification failed.' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Parse action parameters
    const { feature_slug, prompt } = await req.json()
    if (!feature_slug || !prompt) {
      return new Response(JSON.stringify({ error: 'Missing action parameters: feature_slug and prompt required.' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // 3. Centralized Service Client for Concurrency Billing Transaction
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    
    // Invoke PL/pgSQL atomic credit deduction RPC
    const { data: newBalance, error: rpcError } = await supabaseAdmin.rpc('deduct_user_credits', {
      target_user_id: user.id,
      target_feature_slug: feature_slug
    })

    if (rpcError) {
      return new Response(JSON.stringify({ 
        error: 'Billing transaction rejected.', 
        details: rpcError.message, 
        code: rpcError.code 
      }), { 
        status: 402, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // 4. Billing committed. Safely instantiate Upstream Google Generative AI / Gemini SDK
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? "MOCK_KEY_DEV"
    console.info(`[Billing Success] User ID: ${user.id} charged for [${feature_slug}]. New Balance: ${newBalance}. Initializing Gemini prompt execution...`)

    // 5. Mock Stream text back to the client matching SSE format
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const mockChunks = [
          `[Server Ledger confirmed balance deduction. New Balance: ${newBalance}]\n`,
          `This is an authenticated, usage-billed response streaming from Gemini.\n`,
          `Prompt evaluated successfully: "${prompt.substring(0, 30)}..."\n`,
          `Task completed under secure corporate Edge gating logic.`
        ]

        for (const chunk of mockChunks) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
          await new Promise((r) => setTimeout(r, 200)) // delay for stream feel
        }
        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal gateway error occurred.', details: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
