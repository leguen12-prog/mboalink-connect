import { base44 } from '@/api/base44Client';
import { NotificationTemplates, replaceTemplateVariables } from './NotificationTemplates';

/**
 * Bilingual Notification Service
 * Sends SMS, Email, and Push notifications in customer's preferred language
 */

export class NotificationService {
  
  /**
   * Send a notification to a customer in their preferred language
   * @param {string} customerId - Customer ID
   * @param {string} templateKey - Template key (e.g., 'welcome', 'payment_received')
   * @param {string} notificationType - Type: 'email', 'sms', or 'push'
   * @param {object} variables - Template variables to replace
   * @returns {Promise<object>} Notification result
   */
  static async sendNotification(customerId, templateKey, notificationType, variables = {}) {
    try {
      // Fetch customer to get preferred language
      const customers = await base44.entities.Customer.filter({ id: customerId });
      if (!customers || customers.length === 0) {
        throw new Error(`Customer ${customerId} not found`);
      }

      const customer = customers[0];
      const language = customer.preferred_language || 'en';

      // Get template in customer's language
      const template = NotificationTemplates[templateKey];
      if (!template) {
        throw new Error(`Template ${templateKey} not found`);
      }

      const languageTemplate = template[language];
      if (!languageTemplate) {
        throw new Error(`Template ${templateKey} not available in ${language}`);
      }

      const typeTemplate = languageTemplate[notificationType];
      if (!typeTemplate) {
        throw new Error(`Template ${templateKey} not available for ${notificationType}`);
      }

      // Add customer info to variables
      const allVariables = {
        firstName: customer.first_name,
        lastName: customer.last_name,
        customerId: customer.customer_id,
        ...variables
      };

      // Prepare notification content
      let subject = '';
      let body = '';
      let recipient = '';

      if (notificationType === 'email') {
        subject = replaceTemplateVariables(typeTemplate.subject, allVariables);
        body = replaceTemplateVariables(typeTemplate.body, allVariables);
        recipient = customer.email;
      } else if (notificationType === 'sms') {
        body = replaceTemplateVariables(typeTemplate, allVariables);
        recipient = customer.phone;
      } else if (notificationType === 'push') {
        subject = replaceTemplateVariables(typeTemplate.title, allVariables);
        body = replaceTemplateVariables(typeTemplate.body, allVariables);
        recipient = customer.customer_id; // Use customer ID for push targeting
      }

      // Send the notification
      let notificationResult = { status: 'sent' };
      
      if (notificationType === 'email' && recipient) {
        try {
          await base44.integrations.Core.SendEmail({
            to: recipient,
            subject: subject,
            body: body,
            from_name: 'MBOALINK'
          });
        } catch (error) {
          notificationResult = { status: 'failed', error: error.message };
        }
      } else if (notificationType === 'sms' && recipient) {
        // SMS would be sent via SMS gateway integration (placeholder)
        notificationResult = { status: 'sent', note: 'SMS gateway integration required' };
      } else if (notificationType === 'push') {
        // Push would be sent via push notification service (placeholder)
        notificationResult = { status: 'sent', note: 'Push notification service required' };
      }

      // Log notification to database
      const logEntry = await base44.entities.NotificationLog.create({
        notification_id: `NOTIF-${Date.now().toString().slice(-8)}`,
        customer_id: customerId,
        type: notificationType,
        template_key: templateKey,
        language: language,
        subject: subject,
        body: body,
        recipient: recipient,
        status: notificationResult.status,
        sent_at: new Date().toISOString(),
        error_message: notificationResult.error || null,
        metadata: variables
      });

      return {
        success: notificationResult.status === 'sent',
        language: language,
        logId: logEntry.id,
        ...notificationResult
      };

    } catch (error) {
      console.error('Notification send error:', error);
      
      // Log failed notification
      try {
        await base44.entities.NotificationLog.create({
          notification_id: `NOTIF-${Date.now().toString().slice(-8)}`,
          customer_id: customerId,
          type: notificationType,
          template_key: templateKey,
          language: 'en',
          status: 'failed',
          error_message: error.message,
          metadata: variables
        });
      } catch (logError) {
        console.error('Failed to log notification error:', logError);
      }

      throw error;
    }
  }

  /**
   * Send bulk notifications to multiple customers
   * Each customer receives notification in their preferred language
   */
  static async sendBulkNotification(customerIds, templateKey, notificationType, variables = {}) {
    const results = [];
    
    for (const customerId of customerIds) {
      try {
        const result = await this.sendNotification(customerId, templateKey, notificationType, variables);
        results.push({ customerId, success: true, ...result });
      } catch (error) {
        results.push({ customerId, success: false, error: error.message });
      }
    }

    return {
      total: customerIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Get notification history for a customer
   */
  static async getCustomerNotificationHistory(customerId, limit = 50) {
    return await base44.entities.NotificationLog.filter(
      { customer_id: customerId },
      '-sent_at',
      limit
    );
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats(startDate, endDate) {
    const logs = await base44.entities.NotificationLog.list();
    
    const stats = {
      total: logs.length,
      byType: { email: 0, sms: 0, push: 0 },
      byLanguage: { en: 0, fr: 0 },
      byStatus: { sent: 0, failed: 0, pending: 0 }
    };

    logs.forEach(log => {
      if (log.type) stats.byType[log.type]++;
      if (log.language) stats.byLanguage[log.language]++;
      if (log.status) stats.byStatus[log.status]++;
    });

    return stats;
  }
}

// Example usage:
// await NotificationService.sendNotification(customerId, 'welcome', 'email');
// await NotificationService.sendNotification(customerId, 'payment_received', 'sms', { amount: 50000, transactionRef: 'TXN123' });