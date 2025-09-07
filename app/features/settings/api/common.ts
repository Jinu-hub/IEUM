import { logger } from "~/core/lib/logger";

/**
 * Delete an integration secret
 * 
 * @param credentialRef - The credential reference to delete
 */
export const deleteIntegrationSecret = async (
    { credentialRef }: { credentialRef: string },
) => {
    try {
      const { secretsManager } = await import("~/core/lib/secrets-manager.server");
      const deleteResult = await secretsManager.deleteSecret(credentialRef);
      if (deleteResult.success) {
        logger.info('Successfully deleted existing integration secret', { 
          credentialRef: credentialRef 
        });
      } else {
        logger.warn('Failed to delete existing integration secret', { 
          credentialRef: credentialRef,
          error: deleteResult.error 
        });
      }
    } catch (error) {
      logger.error('Error deleting existing integration secret', {
        credentialRef: credentialRef,
        error: String(error)
      });
    }
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