import { db } from '@/lib/db';
import { siteSettings, qliroOrders } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { logger } from '@/lib/logging/logger';
import crypto from 'crypto';

interface QliroSettings {
  enabled: boolean;
  apiKey: string;
  apiSecret: string;
  apiUrl: string;
  webhookSecret: string;
  environment: 'production' | 'sandbox';
  publicUrl: string;
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
    if (this.settings && !forceReload && this.lastSettingsLoad && Date.now() - this.lastSettingsLoad.getTime() < this.settingsCacheDuration) {
      return this.settings;
    }

    logger.debug('payment', 'Loading Qliro settings from database');

    const settings = await db.select().from(siteSettings).where(eq(siteSettings.category, 'payment'));
    const settingsMap = settings.reduce((acc, setting) => {
      if(setting.key) acc[setting.key] = setting.value || '';
      return acc;
    }, {} as Record<string, string>);

    logger.debug('payment', 'Found Qliro settings', {
      hasApiKey: !!settingsMap['qliro_api_key'],
      hasApiSecret: !!settingsMap['qliro_api_secret'],
      apiUrl: settingsMap['qliro_api_url'],
      enabled: settingsMap['qliro_enabled'],
      environment: settingsMap['qliro_environment']
    });

    const publicUrl = process.env.NEXT_PUBLIC_APP_URL || settingsMap['qliro_public_url'] || '';
    if (publicUrl && !publicUrl.startsWith('https://')) {
      logger.error('payment', 'Invalid public URL for Qliro', { publicUrl });
      throw new Error('Qliro requires HTTPS public URL');
    }

    this.settings = {
      enabled: settingsMap['qliro_enabled'] === 'true',
      apiKey: settingsMap['qliro_api_key'] || '',
      apiSecret: settingsMap['qliro_api_secret'] || '',
      apiUrl: settingsMap['qliro_api_url'] || 'https://api.qliro.com',
      webhookSecret: settingsMap['qliro_webhook_secret'] || '',
      environment: settingsMap['qliro_environment'] === 'production' ? 'production' : 'sandbox',
      publicUrl,
    };

    // Validate critical settings
    if (!this.settings.apiKey || !this.settings.apiSecret) {
      logger.error('payment', 'Missing critical Qliro settings', {
        hasApiKey: !!this.settings.apiKey,
        hasApiSecret: !!this.settings.apiSecret
      });
      throw new Error('Qliro API key and secret are required');
    }

    if (!this.settings.publicUrl) {
      logger.error('payment', 'Missing public URL for Qliro');
      throw new Error('Public URL is required for Qliro integration');
    }

    logger.info('payment', 'Qliro settings loaded successfully', {
      enabled: this.settings.enabled,
      environment: this.settings.environment,
      apiUrl: this.settings.apiUrl,
      publicUrl: this.settings.publicUrl
    });

    this.settingsLoadTime = Date.now();
      logger.info('payment', `Qliro settings loaded`, { environment });
      return this.settings;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('payment', 'Failed to load Qliro settings', { error: message });
      throw new Error(message);
    }
  }

  private generateAuthHeader(payload: any): string {
    if (!this.settings?.apiSecret) return '';
    const payloadString = payload ? JSON.stringify(payload) : '';
    const input = payloadString + this.settings.apiSecret;
    const hash = crypto.createHash('sha256').update(input).digest('base64');
    return `Qliro ${hash}`;
  }

  private sanitizeMerchantReference(reference: string): string {
    const cleaned = (reference || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 25);
    return cleaned || `ref_${Date.now()}`;
  }

  public async isEnabled(): Promise<boolean> {
    try {
      const settings = await this.loadSettings();
      return settings.enabled;
    } catch {
      return false;
    }
  }

  public async getOrder(orderId: string): Promise<any> {
    const settings = await this.loadSettings();
    const url = `${settings.apiUrl}/checkout/merchantapi/orders/${encodeURIComponent(orderId)}`;
    const headers = { 'Authorization': this.generateAuthHeader(null) };
    const res = await fetch(url, { headers });
    const text = await res.text();
    if (!res.ok) {
      throw new QliroApiError(`GetOrder error: ${res.status}`, { status: res.status, body: text });
    }
    return JSON.parse(text);
  }

  // Order tracking methods
  public async findExistingOrder(bookingId?: string, handledarBookingId?: string, packagePurchaseId?: string): Promise<any> {
    if (!bookingId && !handledarBookingId && !packagePurchaseId) {
      return null; // Return null instead of throwing error
    }

    try {
      const conditions = [];
      if (bookingId) conditions.push(eq(qliroOrders.bookingId, bookingId));
      if (handledarBookingId) conditions.push(eq(qliroOrders.handledarBookingId, handledarBookingId));
      if (packagePurchaseId) conditions.push(eq(qliroOrders.packagePurchaseId, packagePurchaseId));

      const existingOrder = await db
        .select()
        .from(qliroOrders)
        .where(or(...conditions))
        .limit(1);

      return existingOrder[0] || null;
    } catch (error) {
      // If table doesn't exist or other DB error, return null to fall back to old behavior
      logger.warn('payment', 'Failed to check existing Qliro orders, falling back to old behavior', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  public async createOrderRecord(params: {
    bookingId?: string;
    handledarBookingId?: string;
    packagePurchaseId?: string;
    qliroOrderId: string;
    merchantReference: string;
    amount: number;
    paymentLink: string;
    environment: string;
  }): Promise<string | null> {
    try {
      const settings = await this.loadSettings();
      
      const [orderRecord] = await db
        .insert(qliroOrders)
        .values({
          bookingId: params.bookingId || null,
          handledarBookingId: params.handledarBookingId || null,
          packagePurchaseId: params.packagePurchaseId || null,
          qliroOrderId: params.qliroOrderId,
          merchantReference: params.merchantReference,
          amount: params.amount.toString(),
          paymentLink: params.paymentLink,
          environment: settings.environment,
          status: 'created',
          lastStatusCheck: new Date(),
        })
        .returning({ id: qliroOrders.id });

      logger.info('payment', 'Created Qliro order record', {
        orderId: orderRecord.id,
        qliroOrderId: params.qliroOrderId,
        bookingId: params.bookingId,
        handledarBookingId: params.handledarBookingId,
        packagePurchaseId: params.packagePurchaseId
      });

      return orderRecord.id;
    } catch (error) {
      // If table doesn't exist or other DB error, log warning but don't fail
      logger.warn('payment', 'Failed to create Qliro order record, continuing without tracking', {
        error: error instanceof Error ? error.message : 'Unknown error',
        qliroOrderId: params.qliroOrderId
      });
      return null;
    }
  }

  public async updateOrderStatus(qliroOrderId: string, status: string, paymentLink?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        lastStatusCheck: new Date(),
        updatedAt: new Date(),
      };

      if (paymentLink) {
        updateData.paymentLink = paymentLink;
      }

      await db
        .update(qliroOrders)
        .set(updateData)
        .where(eq(qliroOrders.qliroOrderId, qliroOrderId));

      logger.debug('payment', 'Updated Qliro order status', {
        qliroOrderId,
        status,
        hasPaymentLink: !!paymentLink
      });
    } catch (error) {
      // If table doesn't exist or other DB error, log warning but don't fail
      logger.warn('payment', 'Failed to update Qliro order status, continuing without tracking', {
        error: error instanceof Error ? error.message : 'Unknown error',
        qliroOrderId
      });
    }
  }

  public async getOrCreateCheckout(params: {
    amount: number;
    reference: string;
    description: string;
    returnUrl: string;
    bookingId?: string;
    handledarBookingId?: string;
    packagePurchaseId?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerFirstName?: string;
    customerLastName?: string;
  }): Promise<{ checkoutId: string; checkoutUrl: string; merchantReference: string; isExisting: boolean }> {
    // Step 1: Authorize - Load settings and validate Qliro is enabled
    const settings = await this.loadSettings();
    if (!settings.enabled) {
      throw new Error('Qliro payment service is not enabled');
    }

    // Step 2: Check for existing order first
    const existingOrder = await this.findExistingOrder(
      params.bookingId,
      params.handledarBookingId,
      params.packagePurchaseId
    );

    if (existingOrder) {
      logger.info('payment', 'Found existing Qliro order, fetching current status', {
        qliroOrderId: existingOrder.qliroOrderId,
        bookingId: params.bookingId,
        handledarBookingId: params.handledarBookingId,
        packagePurchaseId: params.packagePurchaseId
      });

      try {
        // Step 3: Fetch current order status from Qliro API
        const orderData = await this.getOrder(existingOrder.qliroOrderId);
        
        // Step 4: Update our database record with latest status
        if (orderData.PaymentLink && orderData.PaymentLink !== existingOrder.paymentLink) {
          await this.updateOrderStatus(existingOrder.qliroOrderId, orderData.Status || 'pending', orderData.PaymentLink);
        }

        return {
          checkoutId: existingOrder.qliroOrderId,
          checkoutUrl: orderData.PaymentLink || existingOrder.paymentLink,
          merchantReference: existingOrder.merchantReference,
          isExisting: true
        };
      } catch (error) {
        logger.warn('payment', 'Failed to fetch existing Qliro order, creating new one', {
          qliroOrderId: existingOrder.qliroOrderId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        // If we can't fetch the existing order, create a new one
      }
    }

    // Step 5: Create new order with Qliro API
    logger.info('payment', 'Creating new Qliro order', {
      amount: params.amount,
      reference: params.reference,
      bookingId: params.bookingId,
      handledarBookingId: params.handledarBookingId,
      packagePurchaseId: params.packagePurchaseId
    });

    const result = await this.createCheckout({
      amount: params.amount,
      reference: params.reference,
      description: params.description,
      returnUrl: params.returnUrl,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      customerFirstName: params.customerFirstName,
      customerLastName: params.customerLastName
    });

    // Step 6: Insert order reference in database
    try {
      const recordId = await this.createOrderRecord({
        bookingId: params.bookingId,
        handledarBookingId: params.handledarBookingId,
        packagePurchaseId: params.packagePurchaseId,
        qliroOrderId: result.checkoutId,
        merchantReference: result.merchantReference,
        amount: params.amount,
        paymentLink: result.checkoutUrl,
        environment: settings.environment
      });

      logger.info('payment', 'Qliro order record created in database', {
        recordId,
        qliroOrderId: result.checkoutId,
        merchantReference: result.merchantReference
      });
    } catch (error) {
      // Don't fail the entire checkout if order tracking fails
      logger.warn('payment', 'Order tracking failed but checkout succeeded', {
        error: error instanceof Error ? error.message : 'Unknown error',
        qliroOrderId: result.checkoutId
      });
    }

    // Step 7: Fetch order status to ensure it's properly created
    try {
      const orderData = await this.getOrder(result.checkoutId);
      
      // Update with fresh data from Qliro
      if (orderData.PaymentLink && orderData.PaymentLink !== result.checkoutUrl) {
        await this.updateOrderStatus(result.checkoutId, orderData.Status || 'created', orderData.PaymentLink);
        result.checkoutUrl = orderData.PaymentLink;
      }

      logger.info('payment', 'Qliro order verified and ready', {
        qliroOrderId: result.checkoutId,
        status: orderData.Status,
        hasPaymentLink: !!orderData.PaymentLink
      });
    } catch (error) {
      logger.warn('payment', 'Could not verify Qliro order status, proceeding with original data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        qliroOrderId: result.checkoutId
      });
    }

    return {
      ...result,
      isExisting: false
    };
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
    if (!settings.publicUrl) {
      throw new QliroApiError('Qliro requires a public https URL.');
    }

    const merchantReference = this.sanitizeMerchantReference(params.reference);
    const pushToken = crypto.randomUUID();
    try {
      const { cache } = await import('@/lib/redis/client');
      await cache.set(`qliro:push:${pushToken}`, JSON.stringify({ reference: params.reference }), 3 * 3600);
    } catch (e) {
      logger.warn('payment', 'Redis not available for Qliro push token');
    }

    const checkoutRequest: any = {
      MerchantApiKey: settings.apiKey,
      MerchantReference: merchantReference,
      Currency: 'SEK',
      Country: 'SE',
      Language: 'sv-se',
      MerchantTermsUrl: `${settings.publicUrl}/kopvillkor`,
      MerchantConfirmationUrl: params.returnUrl,
      MerchantCheckoutStatusPushUrl: `${settings.publicUrl}/api/payments/qliro/checkout-push?token=${pushToken}`,
      OrderItems: [{
        MerchantReference: merchantReference,
        Description: params.description,
        Type: 'Product',
        Quantity: 1,
        PricePerItemIncVat: params.amount,
        PricePerItemExVat: params.amount,
        VatRate: 0,
      }],
    };

    // Add customer information if provided
    if (params.customerEmail || params.customerFirstName || params.customerLastName || params.customerPhone) {
      checkoutRequest.Customer = {};
      
      if (params.customerEmail) {
        checkoutRequest.Customer.Email = params.customerEmail;
      }
      
      if (params.customerFirstName || params.customerLastName) {
        checkoutRequest.Customer.PersonalNumber = null; // Not provided
        checkoutRequest.Customer.FirstName = params.customerFirstName || '';
        checkoutRequest.Customer.LastName = params.customerLastName || '';
      }
      
      if (params.customerPhone) {
        checkoutRequest.Customer.MobileNumber = params.customerPhone;
      }

      logger.debug('payment', 'Added customer information to Qliro checkout request', {
        hasEmail: !!params.customerEmail,
        hasName: !!(params.customerFirstName || params.customerLastName),
        hasPhone: !!params.customerPhone
      });
    }

    const bodyString = JSON.stringify(checkoutRequest);
    const url = `${settings.apiUrl}/checkout/merchantapi/Orders`;
    const authHeader = this.generateAuthHeader(bodyString);

    logger.info('payment', 'Sending Qliro checkout request', {
      url,
      merchantReference,
      amount: params.amount,
      hasCustomer: !!(params.customerEmail || params.customerFirstName)
    });

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': authHeader },
        body: bodyString,
      });
    } catch (fetchError) {
      logger.error('payment', 'Network error when calling Qliro API', {
        error: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error',
        url,
        merchantReference
      });
      throw new QliroApiError(`Network error: ${fetchError instanceof Error ? fetchError.message : 'fetch failed'}`, { 
        originalError: fetchError 
      });
    }

    let text: string;
    try {
      text = await response.text();
    } catch (textError) {
      logger.error('payment', 'Failed to read Qliro API response', {
        error: textError instanceof Error ? textError.message : 'Unknown text error',
        status: response.status,
        url,
        merchantReference
      });
      throw new QliroApiError(`Response read error: ${textError instanceof Error ? textError.message : 'text read failed'}`, { 
        status: response.status 
      });
    }

    if (!response.ok) {
      logger.error('payment', 'Qliro checkout creation failed', {
        status: response.status,
        statusText: response.statusText,
        body: text,
        url,
        merchantReference,
        requestBody: bodyString
      });
      throw new QliroApiError(`CreateCheckout error: ${response.status} ${response.statusText}`, { 
        status: response.status, 
        body: text,
        statusText: response.statusText
      });
    }

    const checkoutData = JSON.parse(text);
    if (!checkoutData.PaymentLink) {
      throw new Error('Qliro did not return a PaymentLink');
    }

    return {
      checkoutId: checkoutData.OrderId?.toString() || params.reference,
      checkoutUrl: checkoutData.PaymentLink,
      merchantReference,
    };
  }

  public async testConnection(opts?: { extended?: boolean }): Promise<{ success: boolean; message: string; details?: any; debug?: any }> {
    try {
      const settings = await this.loadSettings();
      const testReference = `test_${Date.now()}`;
      const result = await this.createCheckout({
        amount: 100, // 1 SEK in öre
        reference: testReference,
        description: 'Connection test',
        returnUrl: `${settings.publicUrl}/dashboard/admin/settings?test=complete`,
      });

      await db.update(siteSettings).set({ value: 'true', updatedAt: new Date() }).where(eq(siteSettings.key, 'qliro_test_passed'));
      await db.update(siteSettings).set({ value: new Date().toISOString(), updatedAt: new Date() }).where(eq(siteSettings.key, 'qliro_last_test_date'));

      const response: any = {
        success: true,
        message: `Successfully connected to Qliro ${settings.environment} environment`,
        details: { checkoutId: result.checkoutId, checkoutUrl: result.checkoutUrl, environment: settings.environment }
      };
      if (opts?.extended) {
        response.debug = { apiUrl: settings.apiUrl, publicUrl: settings.publicUrl };
      }
      return response;

    } catch (error) {
      await db.update(siteSettings).set({ value: 'false', updatedAt: new Date() }).where(eq(siteSettings.key, 'qliro_test_passed'));
      const message = error instanceof Error ? error.message : 'Connection test failed';
      const failure: any = { success: false, message };
      if (error instanceof QliroApiError) {
        failure.details = { status: error.status, statusText: error.statusText };
        if (opts?.extended) failure.debug = { body: error.body };
      }
      return failure;
    }
  }

  public async verifyWebhookSignature(signature: string, body: string): Promise<boolean> {
    const settings = await this.loadSettings();
    if (!settings.webhookSecret) {
      logger.warn('payment', 'No webhook secret configured for Qliro, skipping verification');
      return true;
    }
    const expectedSignature = crypto.createHmac('sha256', settings.webhookSecret).update(body).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  public async getTestStatus(): Promise<{ passed: boolean; lastTestDate: string | null }> {
    try {
      const settings = await db.select().from(siteSettings).where(eq(siteSettings.category, 'payment'));
      const settingsMap = settings.reduce((acc, setting) => {
        if(setting.key) acc[setting.key] = setting.value || '';
        return acc;
      }, {} as Record<string, string>);

      return {
        passed: settingsMap['qliro_test_passed'] === 'true',
        lastTestDate: settingsMap['qliro_last_test_date'] || null,
      };
    } catch (error) {
      logger.warn('payment', 'Failed to get Qliro test status', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        passed: false,
        lastTestDate: null,
      };
    }
  }
}

export const qliroService = QliroService.getInstance();
