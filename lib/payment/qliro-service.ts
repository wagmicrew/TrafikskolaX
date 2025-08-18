import { db } from '@/lib/db';
import { siteSettings, qliroOrders } from '@/lib/db/schema';
import { eq, and, or, InferInsertModel } from 'drizzle-orm';
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

  // Expose resolved settings for diagnostics (secrets masked)
  public async getResolvedSettings(forceReload: boolean = false): Promise<{
    enabled: boolean;
    environment: 'production' | 'sandbox';
    apiUrl: string;
    publicUrl: string;
    hasApiKey: boolean;
    hasApiSecret: boolean;
    apiKeyMasked: string;
  }> {
    const settings = await this.loadSettings(forceReload);
    const mask = (v: string) => (v ? `${v.slice(0, 4)}...${v.slice(-4)}` : '');
    return {
      enabled: settings.enabled,
      environment: settings.environment,
      apiUrl: settings.apiUrl,
      publicUrl: settings.publicUrl,
      hasApiKey: !!settings.apiKey,
      hasApiSecret: !!settings.apiSecret,
      apiKeyMasked: mask(settings.apiKey),
    };
  }

  private async loadSettings(forceReload = false): Promise<QliroSettings> {
    if (this.settings && !forceReload && this.lastSettingsLoad && Date.now() - this.lastSettingsLoad.getTime() < this.settingsCacheDuration) {
      return this.settings;
    }

    logger.debug('payment', 'Loading Qliro settings from database');

    try {
      // Load all site settings (some installs may not set category='payment')
      const settings = await db.select().from(siteSettings);
      const settingsMap = settings.reduce((acc, setting) => {
        if (setting.key) acc[setting.key] = setting.value || '';
        return acc;
      }, {} as Record<string, string>);

      logger.debug('payment', 'Found Qliro settings', {
        hasApiKey: !!settingsMap['qliro_api_key'],
        hasApiSecret: !!settingsMap['qliro_api_secret'],
        apiUrl: settingsMap['qliro_api_url'],
        enabled: settingsMap['qliro_enabled'],
        environment: settingsMap['qliro_environment']
      });

      // Resolve public URL from settings or env
      const publicUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        settingsMap['public_app_url'] ||
        settingsMap['site_public_url'] ||
        settingsMap['app_url'] ||
        settingsMap['qliro_public_url'] ||
        '';
      if (publicUrl && !publicUrl.startsWith('https://')) {
        logger.error('payment', 'Invalid public URL for Qliro', { publicUrl });
        throw new Error('Qliro requires HTTPS public URL');
      }

      // Determine environment and enabled flag (support legacy and prod/dev toggles)
      const envExplicit = settingsMap['qliro_environment'];
      const prodEnabled = settingsMap['qliro_prod_enabled'] === 'true' || settingsMap['qliro_use_prod_env'] === 'true';
      const baseEnabled = settingsMap['qliro_enabled'] === 'true';
      const environment: 'production' | 'sandbox' = envExplicit === 'production' || prodEnabled ? 'production' : 'sandbox';
      const enabled = baseEnabled || prodEnabled;

      // Resolve credentials from multiple possible keys and env fallbacks
      const envApiKey = process.env.QLIRO_API_KEY || process.env.QLIRO_MERCHANT_ID || '';
      const envApiSecret = process.env.QLIRO_API_SECRET || process.env.QLIRO_SHARED_SECRET || '';

      const apiKey =
        (environment === 'production'
          ? (settingsMap['qliro_prod_api_key'] || settingsMap['qliro_api_key'] || '')
          : (settingsMap['qliro_api_key'] || settingsMap['qliro_dev_api_key'] || '')) || envApiKey;

      const apiSecret =
        (
          environment === 'production'
            ? (settingsMap['qliro_prod_api_secret'] || settingsMap['qliro_prod_shared_secret'] || '')
            : (settingsMap['qliro_api_secret'] || settingsMap['qliro_secret'] || settingsMap['qliro_shared_secret'] || '')
        ) || envApiSecret;

      const apiUrl =
        (environment === 'production'
          ? (settingsMap['qliro_prod_api_url'] || settingsMap['qliro_api_url'] || 'https://payments.qit.nu')
          : (settingsMap['qliro_dev_api_url'] || settingsMap['qliro_api_url'] || 'https://pago.qit.nu'));

      this.settings = {
        enabled,
        apiKey,
        apiSecret,
        apiUrl,
        webhookSecret: settingsMap['qliro_webhook_secret'] || settingsMap['qliro_secret'] || '',
        environment,
        publicUrl,
      };

      // Validate critical settings: require at least apiSecret. apiKey is optional (secret-only mode supported)
      if (!this.settings.apiSecret) {
        logger.error('payment', 'Missing critical Qliro settings (apiSecret)', {
          hasApiKey: !!this.settings.apiKey,
          hasApiSecret: !!this.settings.apiSecret,
          environment: this.settings.environment
        });
        throw new Error('Missing Qliro API credentials');
      }

      this.lastSettingsLoad = new Date();
      logger.info('payment', 'Qliro settings loaded successfully', {
        environment: this.settings.environment,
        enabled: this.settings.enabled,
        apiUrl: this.settings.apiUrl,
        hasApiKey: !!this.settings.apiKey,
        hasApiSecret: !!this.settings.apiSecret,
        publicUrl: this.settings.publicUrl
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
    } catch (error) {
      return false;
    }
  }

  private generateAuthHeader(payload: any): string {
    if (!this.settings) {
      throw new Error('Settings not loaded');
    }
    // Based on auth test results, use SHA256(body+secret) base64 method
    const payloadString = typeof payload === 'string' ? payload : (payload ? JSON.stringify(payload) : '');
    const combined = payloadString + this.settings.apiSecret;
    const token = crypto.createHash('sha256').update(combined).digest('base64');
    return `Qliro ${token}`;
  }

  private sanitizeMerchantReference(reference: string): string {
    // Qliro requires: ^[A-Za-z0-9_-]{1,25}$
    // Convert UUIDs and long references to shorter, compliant format
    let sanitized = reference.replace(/[^a-zA-Z0-9-_]/g, '');
    
    // For long references (like UUIDs), create a shorter reference
    if (sanitized.length > 25) {
      // Extract type prefix and create short hash
      const parts = sanitized.split('_');
      if (parts.length >= 2) {
        const prefix = parts[0].substring(0, 8); // e.g., "booking", "handledar" 
        const hash = Buffer.from(parts[1]).toString('base64url').substring(0, 15); // Short hash of UUID
        sanitized = `${prefix}_${hash}`;
      } else {
        // Fallback: just truncate and add timestamp
        const timestamp = Date.now().toString(36).slice(-6);
        sanitized = sanitized.substring(0, 18) + '_' + timestamp;
      }
    }
    
    // Ensure it's between 1-25 characters
    sanitized = sanitized.substring(0, 25);
    
    console.log(`[QLIRO DEBUG] Sanitized reference: "${reference}" -> "${sanitized}" (${sanitized.length} chars)`);
    return sanitized;
  }

  private generateCallbackToken(ttlMs: number = 24 * 60 * 60 * 1000): { token: string; expiresAt: Date } {
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + ttlMs);
    return { token, expiresAt };
  }

  public async getOrder(orderId: string): Promise<any> {
    const settings = await this.loadSettings();
    const url = `${settings.apiUrl}/checkout/merchantapi/Orders/${orderId}`;
    // For GET requests, the payload is empty string
    const headers = { 
      'Authorization': this.generateAuthHeader(''),
      'x-api-key': settings.apiKey,
      'Content-Type': 'application/json'
    };
    
    console.log('[QLIRO DEBUG] GetOrder request:', { url, hasApiKey: !!settings.apiKey, orderId });
    const res = await fetch(url, { method: 'GET', headers });
    const text = await res.text();
    
    if (!res.ok) {
      throw new QliroApiError(`GetOrder error: ${res.status} ${res.statusText}`, { 
        status: res.status, 
        body: text,
        statusText: res.statusText
      });
    }
    
    return JSON.parse(text);
  }

  public async getPaymentOptions(orderId: string): Promise<any> {
    const settings = await this.loadSettings();
    const url = `${settings.apiUrl}/checkout/merchantapi/Orders/${encodeURIComponent(orderId)}/PaymentOptions`;
    const headers = { 'Authorization': this.generateAuthHeader('') };
    const res = await fetch(url, { method: 'GET', headers });
    const text = await res.text();
    if (!res.ok) {
      throw new QliroApiError(`PaymentOptions error: ${res.status} ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
        body: text,
      });
    }
    return JSON.parse(text);
  }

  public async findExistingOrder(bookingId?: string, handledarBookingId?: string, packagePurchaseId?: string): Promise<any> {
    if (!bookingId && !handledarBookingId && !packagePurchaseId) {
      return null;
    }

    try {
      const conditions = [];
      if (bookingId) {
        conditions.push(eq(qliroOrders.bookingId, bookingId));
      }
      if (handledarBookingId) {
        conditions.push(eq(qliroOrders.handledarBookingId, handledarBookingId));
      }
      if (packagePurchaseId) {
        conditions.push(eq(qliroOrders.packagePurchaseId, packagePurchaseId));
      }

      const existingOrder = await db.select().from(qliroOrders).where(or(...conditions)).limit(1);
      return existingOrder.length > 0 ? existingOrder[0] : null;
    } catch (error) {
      logger.warn('payment', 'Failed to find existing Qliro order', {
        error: error instanceof Error ? error.message : 'Unknown error',
        bookingId,
        handledarBookingId,
        packagePurchaseId
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
    paymentLink?: string;
    environment?: string;
    callbackToken?: string | null;
    callbackTokenExpiresAt?: Date | null;
  }): Promise<string | null> {
    try {
      const orderRecord: InferInsertModel<typeof qliroOrders> = {
        bookingId: params.bookingId || null,
        handledarBookingId: params.handledarBookingId || null,
        packagePurchaseId: params.packagePurchaseId || null,
        qliroOrderId: params.qliroOrderId,
        merchantReference: params.merchantReference,
        // Store amount in SEK as decimal string; params.amount is provided in öre
        amount: (params.amount / 100).toFixed(2),
        paymentLink: params.paymentLink || null,
        environment: params.environment || 'sandbox',
        callbackToken: params.callbackToken || null,
        callbackTokenExpiresAt: params.callbackTokenExpiresAt || null
      };

      const result = await db.insert(qliroOrders).values(orderRecord).returning({ id: qliroOrders.id });
      
      logger.info('payment', 'Qliro order record created', {
        recordId: result[0]?.id,
        qliroOrderId: params.qliroOrderId,
        merchantReference: params.merchantReference
      });

      return result[0]?.id?.toString() || null;
    } catch (error) {
      logger.error('payment', 'Failed to create Qliro order record', {
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
        updatedAt: new Date()
      };

      if (paymentLink) {
        updateData.paymentLink = paymentLink;
      }

      await db.update(qliroOrders)
        .set(updateData)
        .where(eq(qliroOrders.qliroOrderId, qliroOrderId));

      logger.info('payment', 'Qliro order status updated', {
        qliroOrderId,
        status,
        hasPaymentLink: !!paymentLink
      });
    } catch (error) {
      logger.error('payment', 'Failed to update Qliro order status', {
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

    // Generate per-order callback token for webhook (defense-in-depth)
    const { token: cbToken, expiresAt: cbExpiresAt } = this.generateCallbackToken();

    const result = await this.createCheckout({
      amount: params.amount,
      reference: params.reference,
      description: params.description,
      returnUrl: params.returnUrl,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      customerFirstName: params.customerFirstName,
      customerLastName: params.customerLastName,
      callbackToken: cbToken
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
        environment: settings.environment,
        callbackToken: cbToken,
        callbackTokenExpiresAt: cbExpiresAt
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
    callbackToken?: string;
  }): Promise<{ checkoutId: string; checkoutUrl: string; merchantReference: string }> {
    const settings = await this.loadSettings();
    if (!settings.enabled) {
      throw new Error('Qliro payment service is not enabled');
    }

    const merchantReference = this.sanitizeMerchantReference(params.reference);
    
    logger.info('payment', 'Creating Qliro checkout', {
      amount: params.amount,
      merchantReference,
      hasCustomer: !!(params.customerEmail || params.customerFirstName)
    });

    // Add debug logging for URLs being sent to Qliro
    const checkoutUrls = {
      termsUrl: `${this.settings!.publicUrl}/kopvillkor`,
      confirmationUrl: params.returnUrl,
      checkoutStatusPushUrl: `${this.settings!.publicUrl}/api/payments/qliro/webhook`,
      orderManagementStatusPushUrl: `${this.settings!.publicUrl}/api/payments/qliro/order-management-status`,
      orderValidationUrl: `${this.settings!.publicUrl}/api/payments/qliro/order-validate`,
    };
    
    console.log('[QLIRO DEBUG] URLs being sent to Qliro:', checkoutUrls);

    const checkoutRequest: any = {
      MerchantApiKey: settings.apiKey,
      MerchantReference: merchantReference,
      Currency: 'SEK',
      Country: 'SE',
      Language: 'sv-se',
      MerchantTermsUrl: checkoutUrls.termsUrl,
      MerchantConfirmationUrl: checkoutUrls.confirmationUrl,
      MerchantCheckoutStatusPushUrl: checkoutUrls.checkoutStatusPushUrl,
      MerchantOrderManagementStatusPushUrl: checkoutUrls.orderManagementStatusPushUrl,
      MerchantOrderValidationUrl: checkoutUrls.orderValidationUrl,
      OrderItems: [{
        MerchantReference: merchantReference,
        Description: params.description,
        Type: 'Product',
        Quantity: 1,
        // Qliro expects SEK values, not öre; assume params.amount is SEK number
        PricePerItemIncVat: Number(params.amount),
        PricePerItemExVat: Number((Number(params.amount) / 1.25).toFixed(2)),
        VatRate: 25
      }]
    };

    // Add customer information if provided
    if (params.customerEmail || params.customerFirstName || params.customerLastName || params.customerPhone) {
      checkoutRequest.Customer = {
        Email: params.customerEmail || ''
      };
      
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
      // Enhanced fetch with timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json', 
          'Authorization': authHeader,
          // Some environments require the API key in a header to resolve merchant before validating signature
          'x-api-key': settings.apiKey,
          'Qliro-Application-Id': settings.apiKey,
          'X-Qliro-Application-Id': settings.apiKey,
          'User-Agent': 'TrafikskolaX/1.0'
        },
        body: bodyString,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      logger.error('payment', 'Network error when calling Qliro API', {
        error: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error',
        errorName: fetchError?.name,
        errorCause: fetchError?.cause,
        url,
        merchantReference
      });
      
      // Provide more specific error messages
      if (fetchError?.name === 'AbortError') {
        throw new QliroApiError('Request timeout: Qliro API did not respond within 30 seconds');
      } else if (fetchError?.code === 'ENOTFOUND' || fetchError?.code === 'ECONNREFUSED') {
        throw new QliroApiError('Network connectivity issue: Cannot reach Qliro API');
      } else {
        throw new QliroApiError(`Network error: ${fetchError instanceof Error ? fetchError.message : 'fetch failed'}`);
      }
    }

    let text: string;
    try {
      text = await response.text();
    } catch (textError: any) {
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
    
    logger.info('payment', 'Qliro checkout created successfully', {
      checkoutId: checkoutData.OrderId,
      merchantReference,
      hasPaymentLink: !!checkoutData.PaymentLink
    });

    return {
      checkoutId: checkoutData.OrderId,
      checkoutUrl: checkoutData.PaymentLink,
      merchantReference
    };
  }

  public async testConnection(opts: { extended?: boolean } = {}): Promise<{ success: boolean; message: string; details?: any; debug?: any }> {
    try {
      const settings = await this.loadSettings();
      const testReference = 'TEST-' + Date.now();
      const result = await this.createCheckout({
        amount: 10000, // 100 SEK in öre
        reference: testReference,
        description: 'Test connection',
        returnUrl: `${settings.publicUrl}/test`
      });

      const debug = opts.extended
        ? { hasApiKey: !!settings.apiKey, apiUrl: settings.apiUrl }
        : undefined;

      return {
        success: true,
        message: 'Qliro API connection successful',
        details: result,
        ...(debug ? { debug } : {}),
      };
    } catch (error: any) {
      if (opts.extended) {
        return {
          success: false,
          message: error?.message || 'Connection test failed',
          debug: error
        };
      }
      return {
        success: false,
        message: error?.message || 'Connection test failed'
      };
    }
  }

  public async verifyWebhookSignature(signature: string, body: string): Promise<boolean> {
    const settings = await this.loadSettings();
    if (!settings.webhookSecret) {
      return false;
    }

    const expectedSignature = crypto.createHmac('sha256', settings.webhookSecret).update(body).digest('hex');
    return signature === expectedSignature;
  }

  public async getTestStatus(): Promise<{ passed: boolean; lastTestDate: string | null }> {
    try {
      const settings = await this.loadSettings();
      // loadSettings returns a QliroSettings object, not an array
      return {
        passed: false,
        lastTestDate: null
      };
    } catch (error: any) {
      return {
        passed: false,
        lastTestDate: null
      };
    }
  }
}
export const qliroService = QliroService.getInstance();
