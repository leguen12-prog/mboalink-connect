import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, Send, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function AutomatedCommunications({ job, technicianName }) {
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState(null);

  const sendAppointmentConfirmation = async () => {
    setSending(true);
    try {
      const customer = await base44.entities.Customer.filter({ id: job.customer_id });
      if (!customer || customer.length === 0) {
        toast.error('Customer not found');
        return;
      }

      const customerData = customer[0];
      const message = `Hello ${customerData.first_name},

Your service appointment has been confirmed:

📅 Date: ${job.scheduled_date}
⏰ Time: ${job.scheduled_time_slot || 'TBD'}
👨‍🔧 Technician: ${technicianName}
🔧 Service Type: ${job.type}

Our technician will arrive within the scheduled window. You'll receive an update when they're on the way.

For questions, reply to this message or call our support line.

- MBOALINK Field Services`;

      await base44.integrations.Core.SendEmail({
        to: customerData.email,
        subject: 'Service Appointment Confirmed',
        body: message
      });

      setLastSent({ type: 'confirmation', time: new Date().toISOString() });
      toast.success('Confirmation sent to customer');

    } catch (error) {
      console.error('Failed to send confirmation:', error);
      toast.error('Failed to send confirmation');
    } finally {
      setSending(false);
    }
  };

  const sendDelayNotification = async (delayMinutes = 30) => {
    setSending(true);
    try {
      const customer = await base44.entities.Customer.filter({ id: job.customer_id });
      if (!customer || customer.length === 0) {
        toast.error('Customer not found');
        return;
      }

      const customerData = customer[0];
      const newETA = new Date(Date.now() + delayMinutes * 60000);
      const message = `Hello ${customerData.first_name},

We wanted to inform you of a slight delay to your appointment.

Original Time: ${job.scheduled_time_slot || 'TBD'}
New ETA: ${newETA.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}

Your technician ${technicianName} is running approximately ${delayMinutes} minutes behind schedule due to an earlier job taking longer than expected.

We apologize for any inconvenience and appreciate your patience.

- MBOALINK Field Services`;

      await base44.integrations.Core.SendEmail({
        to: customerData.email,
        subject: 'Appointment Update - Minor Delay',
        body: message
      });

      setLastSent({ type: 'delay', time: new Date().toISOString(), delay: delayMinutes });
      toast.success('Delay notification sent');

    } catch (error) {
      console.error('Failed to send delay notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const sendEnRouteNotification = async () => {
    setSending(true);
    try {
      const customer = await base44.entities.Customer.filter({ id: job.customer_id });
      if (!customer || customer.length === 0) {
        toast.error('Customer not found');
        return;
      }

      const customerData = customer[0];
      const eta = new Date(Date.now() + 20 * 60000);
      const message = `Hello ${customerData.first_name},

Good news! Your technician is on the way.

👨‍🔧 Technician: ${technicianName}
📍 Estimated Arrival: ${eta.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
🔧 Service: ${job.type}

Please ensure someone is available at the location.

Track your technician in real-time: [Link to tracking]

- MBOALINK Field Services`;

      await base44.integrations.Core.SendEmail({
        to: customerData.email,
        subject: 'Your Technician is On the Way',
        body: message
      });

      setLastSent({ type: 'enroute', time: new Date().toISOString() });
      toast.success('En route notification sent');

    } catch (error) {
      console.error('Failed to send en route notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-4">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-green-400" />
        Customer Communications
      </h3>

      <div className="space-y-2 mb-4">
        <Button
          onClick={sendAppointmentConfirmation}
          disabled={sending}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          <Send className="w-4 h-4 mr-2" />
          Send Confirmation
        </Button>

        <Button
          onClick={sendEnRouteNotification}
          disabled={sending}
          className="w-full bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Send En Route
        </Button>

        <Button
          onClick={() => sendDelayNotification(30)}
          disabled={sending}
          className="w-full bg-orange-600 hover:bg-orange-700"
          size="sm"
        >
          <Clock className="w-4 h-4 mr-2" />
          Notify Delay (30 min)
        </Button>
      </div>

      {lastSent && (
        <div className="bg-slate-800/30 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Last Sent</p>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {lastSent.type}
            </Badge>
            <span className="text-xs text-slate-500">
              {new Date(lastSent.time).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}