import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private app: admin.app.App | null = null;

  constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Check if Firebase is already initialized
      if (admin.apps.length > 0) {
        this.app = admin.app();
        this.logger.log('[FCM] Firebase Admin SDK already initialized');
        return;
      }

      // Initialize Firebase Admin SDK
      // For production, use service account key file or environment variables
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      if (serviceAccount) {
        try {
          const serviceAccountJson = JSON.parse(serviceAccount);
          this.app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccountJson as admin.ServiceAccount)
          });
          this.logger.log('[FCM] ✅ Firebase Admin SDK initialized with service account from environment variable');
        } catch (error: any) {
          this.logger.warn(`[FCM] ⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${error.message}, trying default credentials`);
          try {
            this.app = admin.initializeApp();
            this.logger.log('[FCM] ✅ Firebase Admin SDK initialized with default credentials');
          } catch (defaultError: any) {
            this.logger.error(`[FCM] ❌ Failed to initialize with default credentials: ${defaultError.message}`);
            this.app = null;
          }
        }
      } else {
        // Try to initialize with default credentials (for local development)
        // In production, you should set FIREBASE_SERVICE_ACCOUNT_KEY environment variable
        try {
          this.app = admin.initializeApp();
          this.logger.log('[FCM] ✅ Firebase Admin SDK initialized with default credentials (no FIREBASE_SERVICE_ACCOUNT_KEY env var)');
        } catch (error: any) {
          this.logger.error(`[FCM] ❌ Failed to initialize Firebase Admin SDK with default credentials: ${error.message}`);
          this.logger.error(`[FCM] Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable with your Firebase service account JSON`);
          this.app = null;
        }
      }
    } catch (error: any) {
      this.logger.error(`[FCM] ❌ Failed to initialize Firebase Admin SDK: ${error.message}`);
      this.logger.error(`[FCM] Error stack: ${error.stack}`);
      this.app = null;
    }
  }

  /**
   * Send FCM notification to a driver
   * @param fcmToken - The FCM token of the driver
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Additional data payload
   */
  async sendNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<boolean> {
    if (!this.app) {
      this.logger.warn('[FCM] ❌ Firebase Admin SDK not initialized, skipping notification');
      return false;
    }

    if (!fcmToken || fcmToken.trim() === '') {
      this.logger.warn('[FCM] ❌ FCM token is empty, skipping notification');
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body
        },
        data: data || {},
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'stackfood',
            priority: 'high' as const
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      this.logger.log(`[FCM] 📤 Sending notification to token: ${fcmToken.substring(0, 20)}...`);
      this.logger.debug(`[FCM] Message payload: ${JSON.stringify({ title, body, data })}`);

      const response = await admin.messaging().send(message);
      this.logger.log(`[FCM] ✅ Successfully sent notification. Response: ${response}`);
      return true;
    } catch (error: any) {
      // Handle specific FCM errors
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        this.logger.warn(`[FCM] ⚠️ Invalid or unregistered FCM token: ${fcmToken.substring(0, 20)}... (code: ${error.code})`);
        // Token is invalid, should be removed from database
        return false;
      }
      
      this.logger.error(`[FCM] ❌ Failed to send FCM notification. Error code: ${error.code}, Message: ${error.message}`);
      this.logger.error(`[FCM] Error details:`, error);
      return false;
    }
  }

  /**
   * Send notification to multiple tokens
   */
  async sendMulticast(
    fcmTokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.app) {
      this.logger.warn('Firebase Admin SDK not initialized, skipping notification');
      return { successCount: 0, failureCount: fcmTokens.length };
    }

    const validTokens = fcmTokens.filter(token => token && token.trim() !== '');
    if (validTokens.length === 0) {
      this.logger.warn('No valid FCM tokens provided');
      return { successCount: 0, failureCount: 0 };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: validTokens,
        notification: {
          title,
          body
        },
        data: data || {},
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'stackfood',
            priority: 'high' as const
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      this.logger.log(
        `Multicast notification sent: ${response.successCount} successful, ${response.failureCount} failed`
      );
      
      // Log failed tokens for cleanup
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            this.logger.warn(`Failed token ${validTokens[idx]}: ${resp.error.message}`);
          }
        });
      }

      return {
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } catch (error: any) {
      this.logger.error('Failed to send multicast notification:', error.message || error);
      return { successCount: 0, failureCount: validTokens.length };
    }
  }
}

