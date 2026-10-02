import { base44 } from '@/api/base44Client';
import { NotificationTemplates, replaceTemplateVariables } from './NotificationTemplates';

/**
 * Data Cap Notification Service
 * Checks customer data usage against 80% and 95% thresholds and sends notifications.
 */

const THRESHOLDS = {
  WARNING: 80,
  CRITICAL: 95,
};

// Push notifications are gated OFF until the native mobile app ships with
// push credentials configured. Flip on via DataCapNotificationService.setPushEnabled(true).
let pushEnabled = false;

function getBillingPeriod(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getResetDate() {
  const now = new Date();
  const reset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return reset.toISOString().split('T')[0];
}

function round2(num) {
  return Math.round(num * 100) / 100;
}

export const DataCapNotificationService = {

  /**
   * Enable/disable push delivery of data cap alerts. Push is gated off until the
   * native mobile app is live with push credentials — flipping this on alone will
   * queue/log push attempts which only actually deliver once credentials are set.
   */
  setPushEnabled(enabled) {
    pushEnabled = !!enabled;
  },

  isPushEnabled() {
    return pushEnabled;
  },

  /**
   * Run the data cap check across all active customers.
   * Sends 80% and 95% threshold notifications (email) where applicable,
   * deduplicating per billing period via NotificationLog metadata.
   * @returns {Promise<object>} Summary of notifications sent
   */
  async runDataCapCheck() {
    const billingPeriod = getBillingPeriod();
    const resetDate = getResetDate();

    // Fetch active customers
    const customers = await base44.entities.Customer.filter({ status: 'active' });

    // Fetch service plans
    const plans = await base44.entities.ServicePlan.list();
    const planByCode = new Map();
    const planById = new Map();
    plans.forEach(p => {
      if (p.plan_code) planByCode.set(p.plan_code, p);
      planById.set(p.id, p);
    });

    // Fetch current billing-period data usage
    const usageRecords = await base44.entities.DataUsage.filter({ billing_period: billingPeriod });
    const usageByCustomer = new Map();
    usageRecords.forEach(u => usageByCustomer.set(u.customer_id, u));

    // Fetch recent data-cap notification logs for dedup
    const recentLogs = await base44.entities.NotificationLog.list();
    const sentKeys = new Set();
    recentLogs.forEach(log => {
      const meta = log.metadata || {};
      if (['data_cap_80', 'data_cap_95'].includes(log.template_key) && meta.billing_period === billingPeriod && meta.customer_id) {
        sentKeys.add(`${meta.customer_id}:${log.template_key}`);
      }
    });

    const results = [];
    let sent80 = 0;
    let sent95 = 0;
    let skipped = 0;
    let errors = 0;

    for (const customer of customers) {
      try {
        // Resolve plan
        let plan;
        if (customer.current_plan_id) {
          plan = planById.get(customer.current_plan_id) || planByCode.get(customer.current_plan_id);
        }
        if (!plan) continue;

        // Skip unlimited plans
        if (plan.data_cap_gb == null || plan.data_cap_gb <= 0) continue;

        // Get usage
        const usage = usageByCustomer.get(customer.id);
        if (!usage) {
          skipped++;
          continue;
        }

        const dataUsed = usage.data_used_gb || 0;
        const dataCap = plan.data_cap_gb;
        const pct = (dataUsed / dataCap) * 100;
        const dataRemaining = Math.max(0, round2(dataCap - dataUsed));
        const lang = customer.preferred_language || 'en';

        const vars = {
          firstName: customer.first_name || '',
          lastName: customer.last_name || '',
          customerId: customer.customer_id || customer.id,
          dataUsed: round2(dataUsed),
          dataCap,
          dataRemaining,
          billingPeriod,
          resetDate,
        };

        // 80% threshold
        if (pct >= THRESHOLDS.WARNING && pct < THRESHOLDS.CRITICAL) {
          const dedupeKey = `${customer.id}:data_cap_80`;
          const alreadySent = sentKeys.has(dedupeKey) || usage.notification_80_sent;
          if (!alreadySent) {
            await this._sendThresholdNotification({
              customer, templateKey: 'data_cap_80', lang, vars, usage, pct, plan, billingPeriod,
            });
            sentKeys.add(dedupeKey);
            sent80++;
            results.push({ customer: customer.customer_id || customer.id, name: `${customer.first_name} ${customer.last_name}`, threshold: 80, pct: round2(pct) });
          }
        }

        // 95% threshold
        if (pct >= THRESHOLDS.CRITICAL) {
          const dedupeKey = `${customer.id}:data_cap_95`;
          const alreadySent = sentKeys.has(dedupeKey) || usage.notification_95_sent;
          if (!alreadySent) {
            await this._sendThresholdNotification({
              customer, templateKey: 'data_cap_95', lang, vars, usage, pct, plan, billingPeriod,
            });
            sentKeys.add(dedupeKey);
            sent95++;
            results.push({ customer: customer.customer_id || customer.id, name: `${customer.first_name} ${customer.last_name}`, threshold: 95, pct: round2(pct) });
          }
        }
      } catch (err) {
        errors++;
      }
    }

    return {
      billingPeriod,
      activeCustomersChecked: customers.length,
      notificationsSent80: sent80,
      notificationsSent95: sent95,
      skippedNoUsage: skipped,
      errors,
      details: results,
    };
  },

  async _sendThresholdNotification({ customer, templateKey, lang, vars, usage, pct, plan, billingPeriod }) {
    const template = NotificationTemplates[templateKey];
    const langTemplate = template[lang] || template.en;
    const emailTemplate = langTemplate.email;

    const subject = replaceTemplateVariables(emailTemplate.subject, vars);
    const body = replaceTemplateVariables(emailTemplate.body, vars);

    let sendStatus = 'sent';
    let errorMsg = null;

    // Send email if customer has email
    if (customer.email) {
      try {
        await base44.integrations.Core.SendEmail({
          to: customer.email,
          subject,
          body,
          from_name: 'MBOALINK',
        });
      } catch (e) {
        sendStatus = 'failed';
        errorMsg = e.message;
      }
    }

    // Log email notification
    await base44.entities.NotificationLog.create({
      notification_id: `NOTIF-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`,
      customer_id: customer.id,
      type: 'email',
      template_key: templateKey,
      language: lang,
      subject,
      body,
      recipient: customer.email || '',
      status: sendStatus,
      sent_at: new Date().toISOString(),
      error_message: errorMsg,
      metadata: {
        customer_id: customer.id,
        billing_period: billingPeriod,
        data_used_gb: vars.dataUsed,
        data_cap_gb: vars.dataCap,
        percentage: round2(pct),
        plan_code: plan.plan_code,
      },
    });

    // Send push notification (only when mobile app + credentials are in place)
    if (pushEnabled) {
      try {
        await this._sendPushNotification({ customer, templateKey, lang, vars, billingPeriod, pct, plan });
      } catch (e) {
        // push failure must not block the email flow
      }
    }

    // Update usage record flags
    const updateData = {
      percentage_used: round2(pct),
      last_updated: new Date().toISOString(),
    };
    if (templateKey === 'data_cap_80') updateData.notification_80_sent = true;
    if (templateKey === 'data_cap_95') updateData.notification_95_sent = true;
    await base44.entities.DataUsage.update(usage.id, updateData);
  },

  /**
   * Send a push alert to the customer's app account (matched by email).
   * Gated by pushEnabled — only callable once the native mobile app + push
   * credentials are configured. Pushes are logged as their own NotificationLog
   * with type 'push' so email + push delivery show up separately in history.
   */
  async _sendPushNotification({ customer, templateKey, lang, vars, billingPeriod, pct, plan }) {
    if (!customer.email) return;

    let userId = null;
    try {
      const users = await base44.entities.User.filter({ email: customer.email });
      if (users && users.length > 0) userId = users[0].id;
    } catch (e) {
      userId = null;
    }
    if (!userId) return;

    const template = NotificationTemplates[templateKey];
    const langTemplate = template[lang] || template.en;
    const push = langTemplate.push;
    if (!push) return;

    const title = replaceTemplateVariables(push.title, vars);
    const content = replaceTemplateVariables(push.body, vars);

    let pushStatus = 'sent';
    let pushError = null;
    try {
      await base44.asServiceRole.integrations.Core.SendPushNotification({
        user_id: userId,
        title,
        content,
        action_label: 'View Usage',
        action_url: '/Settings',
      });
    } catch (e) {
      pushStatus = 'failed';
      pushError = e.message;
    }

    await base44.entities.NotificationLog.create({
      notification_id: `NOTIF-PUSH-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`,
      customer_id: customer.id,
      type: 'push',
      template_key: templateKey,
      language: lang,
      subject: title,
      body: content,
      recipient: `user:${userId}`,
      status: pushStatus,
      sent_at: new Date().toISOString(),
      error_message: pushError,
      metadata: {
        customer_id: customer.id,
        billing_period: billingPeriod,
        data_used_gb: vars.dataUsed,
        data_cap_gb: vars.dataCap,
        percentage: round2(pct),
        plan_code: plan.plan_code,
        user_id: userId,
      },
    });
  },

  /**
   * Get data cap notification history
   */
  async getNotificationHistory(limit = 50) {
    const logs = await base44.entities.NotificationLog.list('-sent_at', limit);
    return logs.filter(l => ['data_cap_80', 'data_cap_95'].includes(l.template_key));
  },

  /**
   * Get current billing period usage summary
   */
  async getUsageSummary() {
    const billingPeriod = getBillingPeriod();
    const usageRecords = await base44.entities.DataUsage.filter({ billing_period: billingPeriod });
    const plans = await base44.entities.ServicePlan.list();
    const planByCode = new Map();
    const planById = new Map();
    plans.forEach(p => {
      if (p.plan_code) planByCode.set(p.plan_code, p);
      planById.set(p.id, p);
    });

    const summary = {
      billingPeriod,
      totalTracked: usageRecords.length,
      at80: 0,
      at95: 0,
      below80: 0,
      unlimited: 0,
      notificationsSent80: 0,
      notificationsSent95: 0,
    };

    usageRecords.forEach(u => {
      let plan;
      // We need customer to resolve plan, but for summary just use stored cap
      if (u.data_cap_gb == null || u.data_cap_gb <= 0) {
        summary.unlimited++;
        return;
      }
      const pct = (u.data_used_gb / u.data_cap_gb) * 100;
      if (pct >= 95) {
        summary.at95++;
        if (u.notification_95_sent) summary.notificationsSent95++;
      } else if (pct >= 80) {
        summary.at80++;
        if (u.notification_80_sent) summary.notificationsSent80++;
      } else {
        summary.below80++;
      }
    });

    return summary;
  },
};