// Bilingual notification templates for SMS, Email, and Push notifications

export const NotificationTemplates = {
  // Welcome notifications
  welcome: {
    en: {
      email: {
        subject: "Welcome to MBOALINK - Your Fiber Connection Awaits!",
        body: `Dear {{firstName}},

Welcome to MBOALINK! We're thrilled to have you join our fiber network family.

Your account has been successfully created with Customer ID: {{customerId}}

What's Next?
- Our team will contact you within 24 hours to schedule your installation
- You can track your order status anytime through our customer portal
- Download our mobile app for easy account management

Need Help?
Contact our support team at support@mboalink.com or call us anytime.

Thank you for choosing MBOALINK for your internet needs!

Best regards,
The MBOALINK Team`
      },
      sms: "Welcome to MBOALINK! Your account {{customerId}} is ready. We'll contact you soon for installation. Need help? Call support.",
      push: {
        title: "Welcome to MBOALINK!",
        body: "Your fiber internet journey begins now. Installation scheduled soon."
      }
    },
    fr: {
      email: {
        subject: "Bienvenue chez MBOALINK - Votre connexion fibre vous attend!",
        body: `Cher(e) {{firstName}},

Bienvenue chez MBOALINK! Nous sommes ravis de vous compter parmi notre famille réseau fibre.

Votre compte a été créé avec succès avec l'ID Client: {{customerId}}

Prochaines étapes?
- Notre équipe vous contactera dans les 24 heures pour planifier votre installation
- Vous pouvez suivre l'état de votre commande via notre portail client
- Téléchargez notre application mobile pour gérer facilement votre compte

Besoin d'aide?
Contactez notre équipe support à support@mboalink.com ou appelez-nous.

Merci d'avoir choisi MBOALINK pour vos besoins Internet!

Cordialement,
L'équipe MBOALINK`
      },
      sms: "Bienvenue chez MBOALINK! Votre compte {{customerId}} est prêt. Nous vous contacterons bientôt pour l'installation. Besoin d'aide? Appelez le support.",
      push: {
        title: "Bienvenue chez MBOALINK!",
        body: "Votre parcours internet fibre commence maintenant. Installation bientôt planifiée."
      }
    }
  },

  // Payment confirmation
  payment_received: {
    en: {
      email: {
        subject: "Payment Received - MBOALINK",
        body: `Dear {{firstName}},

We have successfully received your payment of {{amount}} XAF.

Payment Details:
- Transaction Reference: {{transactionRef}}
- Amount: {{amount}} XAF
- Date: {{date}}
- Payment Method: {{method}}

Your account balance has been updated and your service will continue uninterrupted.

Thank you for your prompt payment!

Best regards,
MBOALINK Billing Team`
      },
      sms: "Payment received: {{amount}} XAF. Ref: {{transactionRef}}. Thank you! - MBOALINK",
      push: {
        title: "Payment Confirmed",
        body: "Your payment of {{amount}} XAF has been received. Thank you!"
      }
    },
    fr: {
      email: {
        subject: "Paiement reçu - MBOALINK",
        body: `Cher(e) {{firstName}},

Nous avons bien reçu votre paiement de {{amount}} XAF.

Détails du paiement:
- Référence transaction: {{transactionRef}}
- Montant: {{amount}} XAF
- Date: {{date}}
- Méthode de paiement: {{method}}

Le solde de votre compte a été mis à jour et votre service continuera sans interruption.

Merci pour votre paiement rapide!

Cordialement,
Équipe facturation MBOALINK`
      },
      sms: "Paiement reçu: {{amount}} XAF. Réf: {{transactionRef}}. Merci! - MBOALINK",
      push: {
        title: "Paiement confirmé",
        body: "Votre paiement de {{amount}} XAF a été reçu. Merci!"
      }
    }
  },

  // Service disruption alert
  service_disruption: {
    en: {
      email: {
        subject: "Service Disruption Notice - MBOALINK",
        body: `Dear {{firstName}},

We're experiencing a service disruption in your area that may affect your connection.

Issue Details:
- Affected Area: {{area}}
- Estimated Resolution: {{estimatedTime}}
- Status: Our technical team is actively working to resolve this

We apologize for any inconvenience and appreciate your patience.

Updates will be sent as the situation progresses.

MBOALINK Technical Support`
      },
      sms: "Service disruption in {{area}}. Our team is working on it. Est. resolution: {{estimatedTime}}. - MBOALINK",
      push: {
        title: "Service Disruption Alert",
        body: "Connection issue in your area. We're working to fix it."
      }
    },
    fr: {
      email: {
        subject: "Avis de perturbation de service - MBOALINK",
        body: `Cher(e) {{firstName}},

Nous rencontrons une perturbation de service dans votre zone qui peut affecter votre connexion.

Détails du problème:
- Zone affectée: {{area}}
- Résolution estimée: {{estimatedTime}}
- Statut: Notre équipe technique travaille activement à résoudre ceci

Nous nous excusons pour tout désagrément et apprécions votre patience.

Des mises à jour seront envoyées au fur et à mesure.

Support technique MBOALINK`
      },
      sms: "Perturbation de service dans {{area}}. Notre équipe y travaille. Résolution est.: {{estimatedTime}}. - MBOALINK",
      push: {
        title: "Alerte perturbation service",
        body: "Problème de connexion dans votre zone. Nous y travaillons."
      }
    }
  },

  // Installation scheduled
  installation_scheduled: {
    en: {
      email: {
        subject: "Installation Scheduled - MBOALINK",
        body: `Dear {{firstName}},

Great news! Your fiber installation has been scheduled.

Appointment Details:
- Date: {{date}}
- Time Slot: {{timeSlot}}
- Technician: {{technicianName}}
- Estimated Duration: 2-3 hours

Please ensure someone is available at the installation address during this time.

What to Prepare:
- Clear access to your property
- Decide on router placement location
- Have your ID ready for verification

Need to reschedule? Contact us at least 24 hours in advance.

See you soon!
MBOALINK Installation Team`
      },
      sms: "Installation scheduled for {{date}} ({{timeSlot}}). Technician {{technicianName}} will arrive. Please be available. - MBOALINK",
      push: {
        title: "Installation Scheduled",
        body: "Your fiber installation is set for {{date}}. Be ready!"
      }
    },
    fr: {
      email: {
        subject: "Installation planifiée - MBOALINK",
        body: `Cher(e) {{firstName}},

Bonne nouvelle! Votre installation fibre a été planifiée.

Détails du rendez-vous:
- Date: {{date}}
- Créneau horaire: {{timeSlot}}
- Technicien: {{technicianName}}
- Durée estimée: 2-3 heures

Veuillez vous assurer que quelqu'un est disponible à l'adresse d'installation pendant ce temps.

À préparer:
- Accès dégagé à votre propriété
- Décider de l'emplacement du routeur
- Avoir votre pièce d'identité pour vérification

Besoin de reporter? Contactez-nous au moins 24 heures à l'avance.

À bientôt!
Équipe installation MBOALINK`
      },
      sms: "Installation planifiée le {{date}} ({{timeSlot}}). Le technicien {{technicianName}} arrivera. Soyez disponible SVP. - MBOALINK",
      push: {
        title: "Installation planifiée",
        body: "Votre installation fibre est prévue le {{date}}. Soyez prêt!"
      }
    }
  },

  // Ticket update
  ticket_update: {
    en: {
      email: {
        subject: "Ticket Update: {{ticketId}} - MBOALINK",
        body: `Dear {{firstName}},

Your support ticket has been updated.

Ticket: {{ticketId}}
Status: {{status}}
Priority: {{priority}}

Latest Update:
{{updateMessage}}

{{#if resolved}}
We're glad we could help resolve your issue. If you need further assistance, please don't hesitate to contact us.
{{else}}
Our team continues to work on your request. We'll keep you updated on progress.
{{/if}}

Best regards,
MBOALINK Support Team`
      },
      sms: "Ticket {{ticketId}} update: {{status}}. {{updateMessage}} - MBOALINK",
      push: {
        title: "Support Ticket Updated",
        body: "Ticket {{ticketId}} status: {{status}}"
      }
    },
    fr: {
      email: {
        subject: "Mise à jour ticket: {{ticketId}} - MBOALINK",
        body: `Cher(e) {{firstName}},

Votre ticket de support a été mis à jour.

Ticket: {{ticketId}}
Statut: {{status}}
Priorité: {{priority}}

Dernière mise à jour:
{{updateMessage}}

{{#if resolved}}
Nous sommes heureux d'avoir pu résoudre votre problème. Si vous avez besoin d'aide supplémentaire, n'hésitez pas à nous contacter.
{{else}}
Notre équipe continue à travailler sur votre demande. Nous vous tiendrons informé des progrès.
{{/if}}

Cordialement,
Équipe support MBOALINK`
      },
      sms: "Ticket {{ticketId}} mis à jour: {{status}}. {{updateMessage}} - MBOALINK",
      push: {
        title: "Ticket support mis à jour",
        body: "Ticket {{ticketId}} statut: {{status}}"
      }
    }
  },

  // Invoice generated
  invoice_generated: {
    en: {
      email: {
        subject: "New Invoice - {{invoiceNumber}} - MBOALINK",
        body: `Dear {{firstName}},

A new invoice has been generated for your account.

Invoice: {{invoiceNumber}}
Amount Due: {{amount}} XAF
Due Date: {{dueDate}}
Billing Period: {{billingPeriod}}

Payment Options:
- MTN Mobile Money
- Orange Money
- Bank Transfer
- Online Payment Portal

Pay before {{dueDate}} to avoid service interruption.

View your invoice in the customer portal or mobile app.

Thank you,
MBOALINK Billing`
      },
      sms: "New invoice {{invoiceNumber}}: {{amount}} XAF due by {{dueDate}}. Pay now to avoid interruption. - MBOALINK",
      push: {
        title: "New Invoice Available",
        body: "Invoice {{invoiceNumber}}: {{amount}} XAF due {{dueDate}}"
      }
    },
    fr: {
      email: {
        subject: "Nouvelle facture - {{invoiceNumber}} - MBOALINK",
        body: `Cher(e) {{firstName}},

Une nouvelle facture a été générée pour votre compte.

Facture: {{invoiceNumber}}
Montant dû: {{amount}} XAF
Date d'échéance: {{dueDate}}
Période de facturation: {{billingPeriod}}

Options de paiement:
- MTN Mobile Money
- Orange Money
- Virement bancaire
- Portail de paiement en ligne

Payez avant le {{dueDate}} pour éviter l'interruption du service.

Consultez votre facture sur le portail client ou l'application mobile.

Merci,
Facturation MBOALINK`
      },
      sms: "Nouvelle facture {{invoiceNumber}}: {{amount}} XAF à payer avant le {{dueDate}}. Payez maintenant pour éviter interruption. - MBOALINK",
      push: {
        title: "Nouvelle facture disponible",
        body: "Facture {{invoiceNumber}}: {{amount}} XAF échéance {{dueDate}}"
      }
    }
  },

  // Service restored
  service_restored: {
    en: {
      email: {
        subject: "Service Restored - MBOALINK",
        body: `Dear {{firstName}},

Good news! The service disruption in your area has been resolved.

Your internet connection should now be fully operational.

Disruption Details:
- Duration: {{duration}}
- Issue: {{issue}}
- Resolution: {{resolution}}

We apologize for the inconvenience caused and thank you for your patience.

If you're still experiencing issues, please contact our support team.

Best regards,
MBOALINK Technical Support`
      },
      sms: "Service restored! Your connection is back online. Sorry for the disruption. - MBOALINK",
      push: {
        title: "Service Restored",
        body: "Your internet is back online. Thank you for your patience!"
      }
    },
    fr: {
      email: {
        subject: "Service rétabli - MBOALINK",
        body: `Cher(e) {{firstName}},

Bonne nouvelle! La perturbation de service dans votre zone a été résolue.

Votre connexion internet devrait maintenant être pleinement opérationnelle.

Détails de la perturbation:
- Durée: {{duration}}
- Problème: {{issue}}
- Résolution: {{resolution}}

Nous nous excusons pour le désagrément causé et vous remercions de votre patience.

Si vous rencontrez toujours des problèmes, contactez notre équipe support.

Cordialement,
Support technique MBOALINK`
      },
      sms: "Service rétabli! Votre connexion est de nouveau en ligne. Désolé pour la perturbation. - MBOALINK",
      push: {
        title: "Service rétabli",
        body: "Votre internet est de nouveau en ligne. Merci de votre patience!"
      }
    }
  }
};

// Helper function to replace template variables
export function replaceTemplateVariables(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}