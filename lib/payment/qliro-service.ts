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
  environment: 'production' | 'sandbox';
}

interface QliroOrderItem {
  MerchantReference: string;
  Description: string;
  Quantity: number;
  PricePerItemIncludingVat: number;
  VatRate: number;
}

interface QliroCheckoutRequest {
  MerchantReference: string;
  CountryCode: string;
  CurrencyCode: string;
  OrderItems: QliroOrderItem[];
  TotalOrderValue: number;
  TotalOrderValueIncludingVat: number;
  TotalOrderValueExcludingVat: number;
  TotalVatAmount: number;
  Customer?: {
    Email?: string;
    MobileNumber?: string;
    FirstName?: string;
    LastName?: string;
  };
  PaymentMethods: string[];
  Gui: {
    ColorScheme: string;
    Locale: string;
  };
  MerchantConfirmationUrl: string;
  MerchantNotificationUrl: string;
  CheckoutCompletedCallbackUrl: string;
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
        apiUrl: isProduction ? settingsMap['qliro_prod_api_url'] : 'https://playground.qliro.com',
        webhookSecret: settingsMap['qliro_webhook_secret'] || settingsMap['qliro_secret'] || '',
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
    
    const checkoutRequest: QliroCheckoutRequest = {
      MerchantReference: params.reference,
      CountryCode: 'SE',
      CurrencyCode: 'SEK',
      OrderItems: [
        {
          MerchantReference: params.reference,
          Description: params.description,
          Quantity: 1,
          PricePerItemIncludingVat: Math.round(params.amount * 100), // Convert to öre
          VatRate: 0, // 0% VAT for driving lessons
        }
      ],
      TotalOrderValue: Math.round(params.amount * 100),
      TotalOrderValueIncludingVat: Math.round(params.amount * 100),
      TotalOrderValueExcludingVat: Math.round(params.amount * 100),
      TotalVatAmount: 0,
      Customer: params.customerEmail ? {
        Email: params.customerEmail,
        MobileNumber: params.customerPhone,
        FirstName: params.customerFirstName,
        LastName: params.customerLastName,
      } : undefined,
      PaymentMethods: ['Card', 'Invoice', 'Installment'],
      Gui: {
        ColorScheme: 'White',
        Locale: 'sv-SE',
      },
      MerchantConfirmationUrl: `${baseUrl}/api/payments/qliro/webhook`,
      MerchantNotificationUrl: `${baseUrl}/api/payments/qliro/webhook`,
      CheckoutCompletedCallbackUrl: params.returnUrl,
    };

    try {
      const response = await fetch(`${settings.apiUrl}/v2/checkouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${settings.merchantId}:${settings.apiKey}`).toString('base64')}`,
        },
        body: JSON.stringify(checkoutRequest),
      });

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
        throw new Error(`Qliro API error: ${response.status} ${response.statusText}`);
      }

      const checkoutData = JSON.parse(responseText);

      logger.info('payment', 'Qliro checkout created successfully', {
        checkoutId: checkoutData.CheckoutId,
        reference: params.reference,
        environment: settings.environment
      });

      return {
        checkoutId: checkoutData.CheckoutId,
        checkoutUrl: checkoutData.CheckoutHtmlSnippet ? 
          `${settings.apiUrl}/checkout/${checkoutData.CheckoutId}` : 
          checkoutData.CheckoutUrl,
        merchantReference: params.reference,
      };
    } catch (error) {
      logger.error('payment', 'Failed to create Qliro checkout', {
        error: error instanceof Error ? error.message : 'Unknown error',
        reference: params.reference
      });
      throw error;
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
          environment: settings.environment,
          merchantId: settings.merchantId
        }
      };
    } catch (error) {
      logger.error('payment', 'Qliro connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Update test status as failed
      await db
        .update(siteSettings)
        .set({
          value: 'false',
          updatedAt: new Date()
        })
        .where(eq(siteSettings.key, 'qliro_test_passed'));

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
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
