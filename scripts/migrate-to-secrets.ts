/**
 * Migration Script: Environment Variables to Supabase Secrets
 * 
 * 기존 환경변수로 저장된 API 키와 토큰들을 Supabase Edge Secrets로 마이그레이션합니다.
 * 이 스크립트는 한 번만 실행되며, 기존 통합 설정들을 새로운 보안 저장소로 이전합니다.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';
import { secretsManager, generateCredentialRef } from '../app/core/lib/secrets-manager.server';
import { logger } from '../app/core/lib/logger';

interface MigrationConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  githubToken?: string;
  slackBotToken?: string;
  dryRun?: boolean;
}

interface MigrationResult {
  success: boolean;
  migratedSecrets: number;
  updatedIntegrations: number;
  errors: string[];
}

/**
 * 환경변수에서 설정 로드
 */
function loadMigrationConfig(): MigrationConfig {
  const config: MigrationConfig = {
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    githubToken: process.env.GITHUB_TOKEN,
    slackBotToken: process.env.SLACK_BOT_TOKEN,
    dryRun: process.env.DRY_RUN === 'true',
  };

  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw new Error('Missing required Supabase configuration');
  }

  return config;
}

/**
 * 기존 통합 설정들을 조회
 */
async function getExistingIntegrations(client: ReturnType<typeof createClient<Database>>) {
  const { data: integrations, error } = await client
    .from('integrations')
    .select('*')
    .is('credential_ref', null); // credential_ref가 없는 기존 통합들만

  if (error) {
    throw new Error(`Failed to fetch existing integrations: ${error.message}`);
  }

  return integrations || [];
}

/**
 * GitHub 토큰 마이그레이션
 */
async function migrateGitHubToken(
  config: MigrationConfig,
  client: ReturnType<typeof createClient<Database>>,
  dryRun: boolean
): Promise<{ success: boolean; credentialRef?: string; error?: string }> {
  try {
    if (!config.githubToken) {
      return { success: false, error: 'No GitHub token found in environment variables' };
    }

    const credentialRef = generateCredentialRef('github', 'migration');

    if (dryRun) {
      logger.info('DRY RUN: Would migrate GitHub token', { credentialRef });
      return { success: true, credentialRef };
    }

    // Secrets Manager에 토큰 저장
    const storeResult = await secretsManager.storeSecret(credentialRef, config.githubToken, {
      name: 'GitHub Token (Migrated)',
      description: 'GitHub integration token migrated from environment variables',
      type: 'github_token'
    });

    if (!storeResult.success) {
      return { success: false, error: storeResult.error };
    }

    logger.info('GitHub token migrated successfully', { credentialRef });
    return { success: true, credentialRef };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Slack 토큰 마이그레이션
 */
async function migrateSlackToken(
  config: MigrationConfig,
  client: ReturnType<typeof createClient<Database>>,
  dryRun: boolean
): Promise<{ success: boolean; credentialRef?: string; error?: string }> {
  try {
    if (!config.slackBotToken) {
      return { success: false, error: 'No Slack bot token found in environment variables' };
    }

    const credentialRef = generateCredentialRef('slack', 'migration');

    if (dryRun) {
      logger.info('DRY RUN: Would migrate Slack token', { credentialRef });
      return { success: true, credentialRef };
    }

    // Secrets Manager에 토큰 저장
    const storeResult = await secretsManager.storeSecret(credentialRef, config.slackBotToken, {
      name: 'Slack Bot Token (Migrated)',
      description: 'Slack integration token migrated from environment variables',
      type: 'slack_bot_token'
    });

    if (!storeResult.success) {
      return { success: false, error: storeResult.error };
    }

    logger.info('Slack token migrated successfully', { credentialRef });
    return { success: true, credentialRef };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * 통합 레코드 업데이트
 */
async function updateIntegrationRecord(
  client: ReturnType<typeof createClient<Database>>,
  integrationId: string,
  credentialRef: string,
  dryRun: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    if (dryRun) {
      logger.info('DRY RUN: Would update integration record', { integrationId, credentialRef });
      return { success: true };
    }

    const { error } = await client
      .from('integrations')
      .update({
        credential_ref: credentialRef,
        updated_at: new Date().toISOString()
      })
      .eq('integration_id', integrationId);

    if (error) {
      return { success: false, error: error.message };
    }

    logger.info('Integration record updated', { integrationId, credentialRef });
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * 마이그레이션 실행
 */
async function runMigration(config: MigrationConfig): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedSecrets: 0,
    updatedIntegrations: 0,
    errors: []
  };

  try {
    const client = createClient<Database>(config.supabaseUrl, config.supabaseServiceKey);
    
    logger.info('Starting migration to Supabase Secrets', { 
      dryRun: config.dryRun,
      hasGitHubToken: !!config.githubToken,
      hasSlackToken: !!config.slackBotToken 
    });

    // 기존 통합 설정들 조회
    const existingIntegrations = await getExistingIntegrations(client);
    logger.info(`Found ${existingIntegrations.length} existing integrations to migrate`);

    // GitHub 토큰 마이그레이션
    if (config.githubToken) {
      const githubResult = await migrateGitHubToken(config, client, config.dryRun || false);
      
      if (githubResult.success && githubResult.credentialRef) {
        result.migratedSecrets++;
        
        // GitHub 통합 레코드들 업데이트
        const githubIntegrations = existingIntegrations.filter(i => i.type === 'github');
        for (const integration of githubIntegrations) {
          const updateResult = await updateIntegrationRecord(
            client, 
            integration.integration_id, 
            githubResult.credentialRef,
            config.dryRun || false
          );
          
          if (updateResult.success) {
            result.updatedIntegrations++;
          } else {
            result.errors.push(`Failed to update GitHub integration ${integration.integration_id}: ${updateResult.error}`);
          }
        }
      } else {
        result.errors.push(`GitHub token migration failed: ${githubResult.error}`);
      }
    }

    // Slack 토큰 마이그레이션
    if (config.slackBotToken) {
      const slackResult = await migrateSlackToken(config, client, config.dryRun || false);
      
      if (slackResult.success && slackResult.credentialRef) {
        result.migratedSecrets++;
        
        // Slack 통합 레코드들 업데이트
        const slackIntegrations = existingIntegrations.filter(i => i.type === 'slack');
        for (const integration of slackIntegrations) {
          const updateResult = await updateIntegrationRecord(
            client, 
            integration.integration_id, 
            slackResult.credentialRef,
            config.dryRun || false
          );
          
          if (updateResult.success) {
            result.updatedIntegrations++;
          } else {
            result.errors.push(`Failed to update Slack integration ${integration.integration_id}: ${updateResult.error}`);
          }
        }
      } else {
        result.errors.push(`Slack token migration failed: ${slackResult.error}`);
      }
    }

    if (result.errors.length > 0) {
      result.success = false;
    }

    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(String(error));
    return result;
  }
}

/**
 * 마이그레이션 결과 출력
 */
function printMigrationResult(result: MigrationResult, dryRun: boolean) {
  console.log('\n=== Migration Result ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'PRODUCTION'}`);
  console.log(`Success: ${result.success}`);
  console.log(`Migrated Secrets: ${result.migratedSecrets}`);
  console.log(`Updated Integrations: ${result.updatedIntegrations}`);
  
  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  
  if (dryRun) {
    console.log('\nThis was a dry run. No actual changes were made.');
    console.log('To run the actual migration, set DRY_RUN=false');
  } else {
    console.log('\nMigration completed. You can now remove the tokens from environment variables.');
    console.log('Recommended next steps:');
    console.log('1. Verify all integrations are working correctly');
    console.log('2. Remove GITHUB_TOKEN and SLACK_BOT_TOKEN from environment variables');
    console.log('3. Restart your application');
  }
  
  console.log('========================\n');
}

/**
 * 메인 실행 함수
 */
async function main() {
  try {
    const config = loadMigrationConfig();
    const result = await runMigration(config);
    
    printMigrationResult(result, config.dryRun || false);
    
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// CLI에서 직접 실행된 경우에만 main 함수 실행
if (require.main === module) {
  main();
}

export { runMigration, loadMigrationConfig };
