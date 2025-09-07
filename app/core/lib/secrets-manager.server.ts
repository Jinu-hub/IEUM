/**
 * Supabase Edge Secrets Manager
 * 
 * API 키, 토큰 등의 민감한 정보를 Supabase Edge Secrets를 통해 안전하게 관리합니다.
 * integrations.credentialRef와 연동하여 동적으로 credential을 로드합니다.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from 'database.types';
import adminClient from './supa-admin-client.server';
import { logger } from './logger';

export interface SecretMetadata {
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

export interface SecretValue {
  value: string;
  metadata: SecretMetadata;
}

/**
 * Supabase Edge Secrets Manager 클래스
 */
export class SecretsManager {
  private supabaseClient: ReturnType<typeof createClient<Database>>;

  constructor() {
    this.supabaseClient = adminClient;
  }

  /**
   * Secret 저장
   */
  async storeSecret(
    credentialRef: string,
    value: string,
    metadata: Omit<SecretMetadata, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Supabase Edge Function을 통한 Secret 저장
      const { data, error } = await this.supabaseClient.functions.invoke('manage-secrets', {
        body: {
          action: 'store',
          credentialRef,
          value,
          metadata: {
            ...metadata,
            id: credentialRef,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        }
      });

      if (error) {
        logger.error('Failed to store secret', { credentialRef, error });
        return { success: false, error: error.message };
      }

      logger.info('Secret stored successfully', { credentialRef, type: metadata.type });
      return { success: true };
    } catch (error) {
      logger.error('Error storing secret', { credentialRef, error });
      return { success: false, error: String(error) };
    }
  }

  /**
   * Secret 조회
   */
  async getSecret(credentialRef: string): Promise<SecretValue | null> {
    try {
      const { data, error } = await this.supabaseClient.functions.invoke('manage-secrets', {
        body: {
          action: 'get',
          credentialRef
        }
      });

      if (error) {
        logger.error('Failed to get secret', { credentialRef, error });
        return null;
      }

      if (!data?.value) {
        logger.warn('Secret not found', { credentialRef });
        return null;
      }

      return {
        value: data.value,
        metadata: data.metadata
      };
    } catch (error) {
      logger.error('Error getting secret', { credentialRef, error });
      return null;
    }
  }

  /**
   * Secret 업데이트
   */
  async updateSecret(
    credentialRef: string,
    newValue: string,
    updateMetadata?: Partial<SecretMetadata>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabaseClient.functions.invoke('manage-secrets', {
        body: {
          action: 'update',
          credentialRef,
          value: newValue,
          metadata: updateMetadata ? {
            ...updateMetadata,
            updatedAt: new Date().toISOString()
          } : undefined
        }
      });

      if (error) {
        logger.error('Failed to update secret', { credentialRef, error });
        return { success: false, error: error.message };
      }

      logger.info('Secret updated successfully', { credentialRef });
      return { success: true };
    } catch (error) {
      logger.error('Error updating secret', { credentialRef, error });
      return { success: false, error: String(error) };
    }
  }

  /**
   * Secret 삭제
   */
  async deleteSecret(credentialRef: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabaseClient.functions.invoke('manage-secrets', {
        body: {
          action: 'delete',
          credentialRef
        }
      });

      if (error) {
        logger.error('Failed to delete secret', { credentialRef, error });
        return { success: false, error: error.message };
      }

      logger.info('Secret deleted successfully', { credentialRef });
      return { success: true };
    } catch (error) {
      logger.error('Error deleting secret', { credentialRef, error });
      return { success: false, error: String(error) };
    }
  }

  /**
   * Secret 목록 조회
   */
  async listSecrets(): Promise<SecretMetadata[]> {
    try {
      const { data, error } = await this.supabaseClient.functions.invoke('manage-secrets', {
        body: {
          action: 'list'
        }
      });

      if (error) {
        logger.error('Failed to list secrets', { error });
        return [];
      }

      return data?.secrets || [];
    } catch (error) {
      logger.error('Error listing secrets', { error });
      return [];
    }
  }

  /**
   * Secret 회전 (토큰 갱신)
   */
  async rotateSecret(
    credentialRef: string,
    newValue: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const currentSecret = await this.getSecret(credentialRef);
      if (!currentSecret) {
        return { success: false, error: 'Secret not found' };
      }

      const updatedMetadata: Partial<SecretMetadata> = {
        ...currentSecret.metadata,
        rotationPolicy: {
          enabled: currentSecret.metadata.rotationPolicy?.enabled ?? true,
          intervalDays: currentSecret.metadata.rotationPolicy?.intervalDays ?? 90,
          lastRotated: new Date().toISOString()
        }
      };

      return await this.updateSecret(credentialRef, newValue, updatedMetadata);
    } catch (error) {
      logger.error('Error rotating secret', { credentialRef, error });
      return { success: false, error: String(error) };
    }
  }

  /**
   * Integration에서 사용할 credential 조회
   */
  async getIntegrationCredential(
    integrationId: string,
    credentialRef: string
  ): Promise<string | null> {
    try {
      // Integration 정보 확인
      const { data: integration, error: integrationError } = await this.supabaseClient
        .from('integrations')
        .select('*')
        .eq('integration_id', integrationId)
        .eq('credential_ref', credentialRef)
        .single();

      if (integrationError || !integration) {
        logger.error('Integration not found or credential mismatch', { 
          integrationId, 
          credentialRef,
          error: integrationError 
        });
        return null;
      }

      // Secret 조회
      const secret = await this.getSecret(credentialRef);
      if (!secret) {
        logger.error('Secret not found for integration', { integrationId, credentialRef });
        return null;
      }

      logger.info('Successfully retrieved integration credential', { 
        integrationId, 
        credentialRef,
        type: secret.metadata.type
      });

      return secret.value;
    } catch (error) {
      logger.error('Error getting integration credential', { integrationId, credentialRef, error });
      return null;
    }
  }
}

// 싱글톤 인스턴스
export const secretsManager = new SecretsManager();

/**
 * Helper 함수들
 */

/**
 * GitHub 토큰 조회
 */
export async function getGitHubToken(credentialRef?: string): Promise<string | null> {
  // "undefined" 문자열도 falsy로 처리
  if (credentialRef && credentialRef !== 'undefined') {
    //return await secretsManager.getSecret(credentialRef).then(secret => secret?.value || null);
    return process.env.GITHUB_TOKEN || null;
  }
  
  // Fallback to environment variable
  // for local development testing : TODO: remove this
  //return process.env.GITHUB_TOKEN || null;
  return null;
}

/**
 * Slack 토큰 조회
 */
export async function getSlackBotToken(credentialRef?: string): Promise<string | null> {
  // "undefined" 문자열도 falsy로 처리
  if (credentialRef && credentialRef !== 'undefined') {
    //return await secretsManager.getSecret(credentialRef).then(secret => secret?.value || null);
    return process.env.SLACK_BOT_TOKEN || null;
  }
  
  // Fallback to environment variable
  // for local development testing : TODO: remove this
  //return process.env.SLACK_BOT_TOKEN || null;
  return null;
}

/**
 * Credential Reference 생성 (UUID 기반)
 */
export function generateCredentialRef(type: string, suffix?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const baseName = `${type}_${timestamp}_${random}`;
  
  return suffix ? `${baseName}_${suffix}` : baseName;
}

/**
 * Credential 유효성 검증
 */
export async function validateCredential(
  credentialRef: string,
  type: 'github_token' | 'slack_bot_token'
): Promise<{ valid: boolean; error?: string }> {
  try {
    const secret = await secretsManager.getSecret(credentialRef);
    if (!secret) {
      return { valid: false, error: 'Secret not found' };
    }

    if (secret.metadata.type !== type) {
      return { valid: false, error: 'Secret type mismatch' };
    }

    // 실제 API 호출로 토큰 유효성 검증
    if (type === 'github_token') {
      const { createOctokit } = await import('../integrations/github/client');
      const octokit = createOctokit(secret.value);
      await octokit.rest.users.getAuthenticated();
    } else if (type === 'slack_bot_token') {
      const { createSlackClient } = await import('../integrations/slack/client');
      const slack = createSlackClient(secret.value);
      const result = await slack.auth.test();
      if (!result.ok) {
        return { valid: false, error: result.error || 'Slack auth failed' };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: String(error) };
  }
}
