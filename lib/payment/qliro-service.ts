import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logging/logger';
import crypto from 'crypto';

  interface QliroSettings {
  enabled: boolean;
  merchantId: string;
  apiKey: string;
  apiUrl: string;
    webhookSecret: string;
    apiSecret: string;
  environment: 'production' | 'sandbox';
}

interface QliroOrderItem {
  MerchantReference: string;
  Description: string;
  Type: string;
  Quantity: number;
  PricePerItemIncVat: number;
  PricePerItemExVat: number;
  VatRate: number;
}

interface QliroCheckoutRequest {
  MerchantApiKey: string;
  MerchantReference: string;
  Currency: string;
  Country: string;
  Language: string;
  MerchantTermsUrl: string;
  MerchantConfirmationUrl: string;
  MerchantCheckoutStatusPushUrl: string;
  OrderItems: QliroOrderItem[];
  CustomerInformation?: {
    Email?: string;
    MobileNumber?: number;
    JuridicalType?: string;
  };
}

class QliroApiError extends Error {
  status?: number;
  statusText?: string;
  body?: string;
  constructor(message: string, init?: { status?: number; statusText?: string; body?: string }) {
    super(message);
    this.name = 'QliroApiError';
    this.status = init?.status;
    this.statusText = init?.statusText;
    this.body = init?.body;
  }
}

export class QliroService {
  private static instance: QliroService;
  private settings: QliroSettings | null = null;
  private lastSettingsLoad: Date | null = null;
  private settingsCacheDuration = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): QliroService {
    if (!QliroService.instance) {
      QliroService.instance = new QliroService();
    }
    return QliroService.instance;
  }

  private async loadSettings(forceReload = false): Promise<QliroSettings> {
    // Check cache
    if (!forceReload && this.settings && this.lastSettingsLoad) {
      const cacheAge = Date.now() - this.lastSettingsLoad.getTime();
      if (cacheAge < this.settingsCacheDuration) {
        return this.settings;
      }
    }

    logger.debug('payment', 'Loading Qliro settings from database');

    try {
      // Fetch all Qliro-related settings
      const settings = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.category, 'payment'));

      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value || '';
        return acc;
      }, {} as Record<string, string>);

      // Check which environment is enabled
      const prodEnabled = settingsMap['qliro_prod_enabled'] === 'true';
      const sandboxEnabled = settingsMap['qliro_enabled'] === 'true';

      if (!prodEnabled && !sandboxEnabled) {
        logger.warn('payment', 'Qliro is not enabled in any environment');
        throw new Error('Qliro is not enabled');
      }

      if (prodEnabled && sandboxEnabled) {
        logger.warn('payment', 'Both Qliro production and sandbox are enabled, using production');
      }

      const isProduction = prodEnabled;
      const environment = isProduction ? 'production' : 'sandbox';

      this.settings = {
        enabled: true,
        merchantId: isProduction ? settingsMap['qliro_prod_merchant_id'] : settingsMap['qliro_merchant_id'],
        apiKey: isProduction ? settingsMap['qliro_prod_api_key'] : settingsMap['qliro_api_key'],
        apiUrl: isProduction ? (settingsMap['qliro_prod_api_url'] || 'https://api.qliro.com') : (settingsMap['qliro_dev_api_url'] || 'https://playground.qliro.com'),
        webhookSecret: settingsMap['qliro_webhook_secret'] || settingsMap['qliro_secret'] || '',
        apiSecret: settingsMap['qliro_api_secret'] || settingsMap['qliro_secret'] || '',
        environment
      };

      this.lastSettingsLoad = new Date();

      logger.info('payment', `Qliro settings loaded successfully`, {
        environment,
        merchantId: this.settings.merchantId,
        apiUrl: this.settings.apiUrl
      });

      return this.settings;
    } catch (error) {
      logger.error('payment', 'Failed to load Qliro settings', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private generateAuthHeader(payload: any): string {
    const payloadString = payload ? JSON.stringify(payload) : '';
    const secret = this.settings?.apiSecret || '';
    const input = payloadString + secret;
    // Compute SHA256 and encode Base64
    const hash = crypto.createHash('sha256').update(input).digest('base64');
    return `Qliro ${hash}`;
  }

  public async getOrder(orderId: string): Promise<any> {
    const settings = await this.loadSettings();
    const url = `${settings.apiUrl}/checkout/merchantapi/orders/${encodeURIComponent(orderId)}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': this.generateAuthHeader(null),
    };
    const res = await fetch(url, { method: 'GET', headers });
    const text = await res.text();
    if (!res.ok) {
      throw new QliroApiError(`Qliro GetOrder error: ${res.status} ${res.statusText}`, { status: res.status, statusText: res.statusText, body: text });
    }
    return JSON.parse(text);
  }

  public async adminPost(path: string, payload: any): Promise<any> {
    const settings = await this.loadSettings();
    const url = `${settings.apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': this.generateAuthHeader(payload),
    };
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
    const text = await res.text();
    if (!res.ok) {
      throw new QliroApiError(`Qliro admin POST error: ${res.status} ${res.statusText}`, { status: res.status, statusText: res.statusText, body: text });
    }
    return text ? JSON.parse(text) : {};
  }

  public async adminGet(path: string): Promise<any> {
    const settings = await this.loadSettings();
    const url = `${settings.apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    const headers: Record<string, string> = {
      'Authorization': this.generateAuthHeader(null),
    };
    const res = await fetch(url, { method: 'GET', headers });
    const text = await res.text();
    if (!res.ok) {
      throw new QliroApiError(`Qliro admin GET error: ${res.status} ${res.statusText}`, { status: res.status, statusText: res.statusText, body: text });
    }
    return text ? JSON.parse(text) : {};
  }

  public async isEnabled(): Promise<boolean> {
    try {
      const settings = await this.loadSettings();
      return settings.enabled;
    } catch {
      return false;
    }
  }

  public async getEnvironment(): Promise<'production' | 'sandbox' | null> {
    try {
      const settings = await this.loadSettings();
      return settings.environment;
    } catch {
      return null;
    }
  }

  public async createCheckout(params: {
    amount: number;
    reference: string;
    description: string;
    returnUrl: string;
    customerEmail?: string;
    customerPhone?: string;
    customerFirstName?: string;
    customerLastName?: string;
  }): Promise<{ checkoutId: string; checkoutUrl: string; merchantReference: string }> {
    const settings = await this.loadSettings();

    logger.info('payment', 'Creating Qliro checkout', {
      reference: params.reference,
      amount: params.amount,
      environment: settings.environment
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Use the correct Qliro API structure based on their documentation

    // Generate short-lived token for status push URL (valid for 3 hours)
    const pushToken = crypto.randomUUID();
    try {
      const { cache } = await import('@/lib/redis/client');
      await cache.set(`qliro:push:${pushToken}`, { reference: params.reference, createdAt: Date.now() }, 60 * 60 * 3);
    } catch (e) {
      logger.warn('payment', 'Redis not available for Qliro push token; proceeding without token');
    }

    const checkoutRequest: QliroCheckoutRequest = {
      MerchantApiKey: settings.apiKey,
      MerchantReference: params.reference,
      Currency: 'SEK',
      Country: 'SE',
      Language: 'sv-se',
      MerchantTermsUrl: `${baseUrl}/kopvillkor`,
      MerchantConfirmationUrl: params.returnUrl,
      MerchantCheckoutStatusPushUrl: `${baseUrl}/api/payments/qliro/checkout-push?token=${pushToken}`,
      OrderItems: [
        {
          MerchantReference: params.reference,
          Description: params.description,
          Type: 'Product',
          Quantity: 1,
          PricePerItemIncVat: params.amount,
          PricePerItemExVat: params.amount,
          VatRate: 0, // 0% VAT for driving lessons
        }
      ],
      CustomerInformation: params.customerEmail ? {
        Email: params.customerEmail,
        MobileNumber: params.customerPhone ? parseInt(params.customerPhone.replace(/\D/g, '')) : undefined,
        JuridicalType: 'Physical',
      } : undefined,
    };

    try {
      // First check if we can reach the API (with timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${settings.apiUrl}/checkout/merchantapi/Orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.generateAuthHeader(checkoutRequest),
        },
        body: JSON.stringify(checkoutRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseText = await response.text();
      
      logger.debug('payment', 'Qliro API response', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });

      if (!response.ok) {
        logger.error('payment', 'Qliro checkout creation failed', {
          status: response.status,
          statusText: response.statusText,
          body: responseText,
          reference: params.reference
        });
        throw new QliroApiError(`Qliro API error: ${response.status} ${response.statusText}` , {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        });
      }

      const checkoutData = JSON.parse(responseText);

      logger.info('payment', 'Qliro checkout created successfully', {
        orderId: checkoutData.OrderId,
        reference: params.reference,
        environment: settings.environment
      });

      // Require a valid payment link from Qliro; do not fallback to mock
      if (!checkoutData.PaymentLink) {
        throw new Error('Qliro did not return a PaymentLink');
      }

      return {
        checkoutId: checkoutData.OrderId?.toString() || params.reference,
        checkoutUrl: checkoutData.PaymentLink,
        merchantReference: params.reference,
      };
    } catch (error) {
      if ((error as any)?.name === 'AbortError') {
        logger.error('payment', 'Failed to create Qliro checkout (timeout/abort)', {
          reference: params.reference
        });
        throw new QliroApiError('Qliro API timeout/abort');
      }

      if (error instanceof QliroApiError) {
        logger.error('payment', 'Failed to create Qliro checkout', {
          error: error.message,
          status: error.status,
          statusText: error.statusText,
          body: error.body,
          reference: params.reference
        });
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('payment', 'Failed to create Qliro checkout', {
        error: errorMessage,
        reference: params.reference
      });
      // Always propagate errors; no mock fallback
      throw new Error(errorMessage);
    }
  }

  public async verifyWebhookSignature(signature: string, body: string): Promise<boolean> {
    const settings = await this.loadSettings();
    
    if (!settings.webhookSecret) {
      logger.warn('payment', 'No webhook secret configured for Qliro');
      return true; // Allow in development/testing
    }

    try {
      // Implement proper signature verification based on Qliro's documentation
      // This is a placeholder implementation
      const expectedSignature = crypto
        .createHmac('sha256', settings.webhookSecret)
        .update(body)
        .digest('hex');

      const isValid = signature === expectedSignature;

      logger.debug('payment', 'Webhook signature verification', {
        isValid,
        environment: settings.environment
      });

      return isValid;
    } catch (error) {
      logger.error('payment', 'Failed to verify webhook signature', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  public async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const settings = await this.loadSettings();

      logger.info('payment', 'Testing Qliro connection', {
        environment: settings.environment,
        merchantId: settings.merchantId,
        apiUrl: settings.apiUrl
      });

      // Create a test checkout
      const testReference = `test_${Date.now()}`;
      const result = await this.createCheckout({
        amount: 1, // 1 SEK test amount
        reference: testReference,
        description: 'Connection test',
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/settings?test=complete`,
      });

      // Update test status in database
      await db
        .update(siteSettings)
        .set({
          value: 'true',
          updatedAt: new Date()
        })
        .where(eq(siteSettings.key, 'qliro_test_passed'));

      await db
        .update(siteSettings)
        .set({
          value: new Date().toISOString(),
          updatedAt: new Date()
        })
        .where(eq(siteSettings.key, 'qliro_last_test_date'));

      logger.info('payment', 'Qliro connection test successful', {
        checkoutId: result.checkoutId,
        environment: settings.environment
      });

      return {
        success: true,
        message: `Successfully connected to Qliro ${settings.environment} environment`,
        details: {
          checkoutId: result.checkoutId,
          checkoutUrl: result.checkoutUrl,
          environment: settings.environment,
          merchantId: settings.merchantId
        }
      };
    } catch (error) {
      if (error instanceof QliroApiError) {
        logger.error('payment', 'Qliro connection test failed', {
          error: error.message,
          status: error.status,
          statusText: error.statusText,
          body: error.body
        });
      } else {
        logger.error('payment', 'Qliro connection test failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Update test status as failed
      await db
        .update(siteSettings)
        .set({
          value: 'false',
          updatedAt: new Date()
        })
        .where(eq(siteSettings.key, 'qliro_test_passed'));

      const fallbackMessage = error instanceof Error ? error.message : 'Connection test failed';
      return {
        success: false,
        message: fallbackMessage,
        details: error instanceof QliroApiError ? {
          status: error.status,
          statusText: error.statusText,
          body: error.body
        } : undefined
      };
    }
  }

  public async getTestStatus(): Promise<{ passed: boolean; lastTestDate: string | null }> {
    const settings = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.category, 'payment'));

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value || '';
      return acc;
    }, {} as Record<string, string>);

    return {
      passed: settingsMap['qliro_test_passed'] === 'true',
      lastTestDate: settingsMap['qliro_last_test_date'] || null
    };
  }
}

export const qliroService = QliroService.getInstance();
