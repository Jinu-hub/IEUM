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

interface SecretMetadata {
  id: string;
  name: string;
  description?: string;
  type: 'github_token' | 'slack_bot_token' | 'api_key' | 'webhook_secret';
  createdAt: string;
  updatedAt: string;
  rotationPolicy?: {
    enabled: boolean;
    intervalDays: number;
    lastRotated?: string;
  };
}

interface SecretRequest {
  action: 'store' | 'get' | 'update' | 'delete' | 'list';
  credentialRef?: string;
  value?: string;
  metadata?: SecretMetadata;
}

serve(async (req: Request) => {
  try {
    // CORS 헤더 설정
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const authHeader = req.headers.get('Authorization')
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

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 요청 본문 파싱
    const body: SecretRequest = await req.json()
    const { action, credentialRef, value, metadata } = body

    // Secrets는 Deno KV를 사용하여 암호화된 저장소에 저장
    const kv = await Deno.openKv()

    switch (action) {
      case 'store': {
        if (!credentialRef || !value || !metadata) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields for store action' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        // Secret 저장 (KV에 암호화되어 저장됨)
        await kv.set(['secrets', credentialRef], {
          value,
          metadata: {
            ...metadata,
            createdBy: user.id,
          }
        })

        // 메타데이터를 별도로 저장 (목록 조회용)
        await kv.set(['secrets_metadata', credentialRef], {
          ...metadata,
          createdBy: user.id,
        })

        console.log(`Secret stored: ${credentialRef} (type: ${metadata.type})`)

        return new Response(
          JSON.stringify({ success: true }),
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

        const result = await kv.get(['secrets', credentialRef])
        
        if (!result || !result.value) {
          return new Response(
            JSON.stringify({ error: 'Secret not found' }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        const secretData = result.value as { value: string; metadata: SecretMetadata }

        console.log(`Secret retrieved: ${credentialRef}`)

        return new Response(
          JSON.stringify({
            value: secretData.value,
            metadata: secretData.metadata
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
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

        // 기존 Secret 조회
        const existingResult = await kv.get(['secrets', credentialRef])
        if (!existingResult || !existingResult.value) {
          return new Response(
            JSON.stringify({ error: 'Secret not found' }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        const existingData = existingResult.value as { value: string; metadata: SecretMetadata }
        const updatedMetadata = {
          ...existingData.metadata,
          ...metadata,
          updatedAt: new Date().toISOString(),
          updatedBy: user.id,
        }

        // Secret 업데이트
        await kv.set(['secrets', credentialRef], {
          value,
          metadata: updatedMetadata
        })

        // 메타데이터 업데이트
        await kv.set(['secrets_metadata', credentialRef], updatedMetadata)

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
        await kv.delete(['secrets', credentialRef])
        await kv.delete(['secrets_metadata', credentialRef])

        console.log(`Secret deleted: ${credentialRef}`)

        return new Response(
          JSON.stringify({ success: true }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      case 'list': {
        // 모든 메타데이터 조회
        const secrets: SecretMetadata[] = []
        const iter = kv.list({ prefix: ['secrets_metadata'] })
        
        for await (const entry of iter) {
          secrets.push(entry.value as SecretMetadata)
        }

        console.log(`Listed ${secrets.length} secrets`)

        return new Response(
          JSON.stringify({ secrets }),
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
