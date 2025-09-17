/**
 * Supabase Edge Function: manage-secrets
 * 
 * API 키, 토큰 등의 민감한 정보를 안전하게 관리하는 Edge Function입니다.
 * Supabase의 내장 Secrets 기능을 활용하여 암호화된 저장소를 제공합니다.
 */

/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
/// <reference path="../deno.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface SecretRequest {
  action: 'store' | 'get' | 'update' | 'delete';
  credentialRef?: string;
  value?: string;
}

serve(async (req: Request) => {
  try {
    // CORS 헤더 설정
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Cache-Control': 'no-store',
    }

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // POST 요청만 허용
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 인증 확인
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Service Role Key로 호출하는지 확인 (서비스 레벨 호출)
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (token !== supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Service role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 요청 본문 파싱
    const body: SecretRequest = await req.json()
    const { action, credentialRef, value } = body

    switch (action) {
      case 'store': {
        if (!credentialRef || !value) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields for store action' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        // 1) Vault에 저장
        const { data: insertedId, error: insertErr } = await supabase.rpc('secret_store_by_ref', {
          p_credential_ref: credentialRef,   // vault unique name
          p_value: value,
        });
        if (insertErr) throw insertErr;

        console.log(`Secret stored: ${credentialRef} `)

        return new Response(
          JSON.stringify({ insertedId, success: true }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      case 'get': {
        if (!credentialRef) {
          return new Response(
            JSON.stringify({ error: 'credentialRef is required for get action' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        const { data, error } = await supabase.rpc('secret_read_by_ref', {
          p_credential_ref: credentialRef,
        });
        
        if (error || !data) {
          return new Response(
            JSON.stringify({ error: 'Secret not found' }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        console.log(`Secret retrieved: ${credentialRef}`)

        return new Response(
          JSON.stringify({ value: data as string }), 
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        )
      }

      case 'update': {
        if (!credentialRef || !value) {
          return new Response(
            JSON.stringify({ error: 'credentialRef and value are required for update action' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        const { error: updateErr } = await supabase.rpc('secret_update_by_ref', {
          p_credential_ref: credentialRef,
          p_new_value: value,
        });
        if (updateErr) {
          console.error(updateErr)
          return new Response(JSON.stringify({ error: 'Failed to update secret' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
        }

        console.log(`Secret updated: ${credentialRef}`)

        return new Response(
          JSON.stringify({ success: true }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      case 'delete': {
        if (!credentialRef) {
          return new Response(
            JSON.stringify({ error: 'credentialRef is required for delete action' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        // Secret 삭제
        const { error: deleteErr } = await supabase.rpc('secret_delete_by_ref', {
          p_credential_ref: credentialRef,
        });

        if (deleteErr) {
          console.error(deleteErr)
          return new Response(JSON.stringify({ error: 'Failed to delete secret' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
        }

        console.log(`Secret deleted: ${credentialRef}`)

        return new Response(
          JSON.stringify({ success: true }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }
  } catch (error: unknown) {
    console.error('Error in manage-secrets function:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: errorMessage 
      }),
      { 
        status: 500, 
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})
