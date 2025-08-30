import { emailReceiverEnum, emailTriggerEnum } from '@/lib/db/schema/email-templates';

// Type for email trigger type from database schema
export type EmailTriggerType = typeof emailTriggerEnum.enumValues[number];

// Type for email receiver type from database schema
export type EmailReceiverType = typeof emailReceiverEnum.enumValues[number];

// Interface for email template
export interface EmailTemplate {
  id: string;
  triggerType: EmailTriggerType;
  subject: string;
  htmlContent: string;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  receivers?: EmailReceiverType[];
}

// Interface for template variable
export interface TemplateVariable {
  key: string;
  description: string;
  example?: string;
  category?: 'user' | 'booking' | 'payment' | 'school' | 'system';
}

// Interface for new template creation
export interface CreateTemplatePayload {
  triggerType: EmailTriggerType;
  subject: string;
  htmlContent: string;
  receivers: EmailReceiverType[];
}

// Interface for template update
export interface UpdateTemplatePayload {
  id: string;
  subject: string;
  htmlContent: string;
  isActive: boolean;
  receivers: EmailReceiverType[];
}

// Interface for API responses
export interface TemplateApiResponse {
  templates: EmailTemplate[];
  schoolname: string;
  schoolPhone: string;
}
