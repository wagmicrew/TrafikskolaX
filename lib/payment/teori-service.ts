import { db } from '@/lib/db';
import { siteSettings, qliroOrders } from '@/lib/db/schema';
import { eq, and, or, InferInsertModel, lt } from 'drizzle-orm';
import { logger } from '@/lib/logging/logger';
import crypto from 'crypto';

interface TeoriSettings {
  enabled: boolean;
  apiKey: string;
  apiSecret: string;
  apiUrl: string;
  webhookSecret: string;
  environment: 'production' | 'sandbox';
  publicUrl: string;
}

class TeoriApiError extends Error {
  status?: number;
  statusText?: string;
  body?: string;
  constructor(message: string, init?: { status?: number; statusText?: string; body?: string }) {
    super(message);
    this.name = 'TeoriApiError';
    this.status = init?.status;
    this.statusText = init?.statusText;
    this.body = init?.body;
  }
}

export class TeoriService {
  private static instance: TeoriService;
  private settings: TeoriSettings | null = null;
  private lastSettingsLoad: Date | null = null;
  private settingsCacheDuration = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): TeoriService {
    if (!TeoriService.instance) {
      TeoriService.instance = new TeoriService();
    }
    return TeoriService.instance;
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

  private async loadSettings(forceReload = false): Promise<TeoriSettings> {
    if (this.settings && !forceReload && this.lastSettingsLoad && Date.now() - this.lastSettingsLoad.getTime() < this.settingsCacheDuration) {
      return this.settings;
    }

    logger.debug('payment', 'Loading Teori settings from database');

    try {
      // Load all site settings (some installs may not set category='payment')
      const settings = await db.select().from(siteSettings);
      const settingsMap = settings.reduce((acc, setting) => {
        if (setting.key) acc[setting.key] = setting.value || '';
        return acc;
      }, {} as Record<string, string>);

      // Get retry attempts from settings (default: 3)
      const retryAttempts = parseInt(settingsMap['teori_retry_attempts'] || '3', 10);
      const cacheDuration = parseInt(settingsMap['teori_cache_duration'] || '300', 10) * 1000; // Convert to ms
      
      // Update cache duration if different from default
      if (cacheDuration !== this.settingsCacheDuration) {
        this.settingsCacheDuration = cacheDuration;
        logger.debug('payment', 'Updated Teori cache duration', { cacheDuration });
      }

      logger.debug('payment', 'Found Teori settings', {
        hasApiKey: !!settingsMap['teori_api_key'],
        hasApiSecret: !!settingsMap['teori_api_secret'],
        apiUrl: settingsMap['teori_api_url'],
        enabled: settingsMap['teori_enabled'],
        environment: settingsMap['teori_environment']
      });

      // Resolve public URL from settings or env
      const publicUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        settingsMap['public_app_url'] ||
        settingsMap['site_public_url'] ||
        settingsMap['app_url'] ||
        settingsMap['teori_public_url'] ||
        '';
      if (publicUrl && !publicUrl.startsWith('https://')) {
        logger.error('payment', 'Invalid public URL for Teori', { publicUrl });
        throw new Error('Teori requires HTTPS public URL');
      }

      // Determine environment and enabled flag (support legacy and prod/dev toggles)
      const envExplicit = settingsMap['teori_environment'];
      const prodEnabled = settingsMap['teori_prod_enabled'] === 'true' || settingsMap['teori_use_prod_env'] === 'true';
      const baseEnabled = settingsMap['teori_enabled'] === 'true';
      const environment: 'production' | 'sandbox' = envExplicit === 'production' || prodEnabled ? 'production' : 'sandbox';
      const enabled = baseEnabled || prodEnabled;

      // Resolve credentials from multiple possible keys and env fallbacks
      const envApiKey = process.env.TEORI_API_KEY || process.env.TEORI_MERCHANT_ID || '';
      const envApiSecret = process.env.TEORI_API_SECRET || process.env.TEORI_SHARED_SECRET || '';

      const apiKey =
        (environment === 'production'
          ? (settingsMap['teori_prod_api_key'] || settingsMap['teori_api_key'] || '')
          : (settingsMap['teori_api_key'] || settingsMap['teori_dev_api_key'] || '')) || envApiKey;

      const apiSecret =
        (
          environment === 'production'
            ? (settingsMap['teori_prod_api_secret'] || settingsMap['teori_prod_shared_secret'] || '')
            : (settingsMap['teori_api_secret'] || settingsMap['teori_secret'] || settingsMap['teori_shared_secret'] || '')
        ) || envApiSecret;

      const apiUrl =
        (environment === 'production'
          ? (settingsMap['teori_prod_api_url'] || settingsMap['teori_api_url'] || 'https://payments.teori.nu')
          : (settingsMap['teori_dev_api_url'] || settingsMap['teori_api_url'] || 'https://pago.teori.nu'));

      this.settings = {
        enabled,
        apiKey,
        apiSecret,
        apiUrl,
        webhookSecret: settingsMap['teori_webhook_secret'] || settingsMap['teori_secret'] || '',
        environment,
        publicUrl,
      };

      // Validate critical settings: require at least apiSecret. apiKey is optional (secret-only mode supported)
      if (!this.settings.apiSecret) {
        logger.error('payment', 'Missing critical Teori settings (apiSecret)', {
          hasApiKey: !!this.settings.apiKey,
          hasApiSecret: !!this.settings.apiSecret,
          environment: this.settings.environment
        });
        throw new Error('Missing Teori API credentials');
      }

      this.lastSettingsLoad = new Date();
      logger.info('payment', 'Teori settings loaded successfully', {
        environment: this.settings.environment,
        enabled: this.settings.enabled,
        apiUrl: this.settings.apiUrl,
        hasApiKey: !!this.settings.apiKey,
        hasApiSecret: !!this.settings.apiSecret,
        publicUrl: this.settings.publicUrl
      });

      return this.settings;
    } catch (error) {
      logger.error('payment', 'Failed to load Teori settings', {
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
    return `Teori ${token}`;
  }

  private sanitizeMerchantReference(reference: string): string {
    // Teori requires: ^[A-Za-z0-9_-]{1,25}$
    // Strategy:
    // - Keep as-is if already compliant and <= 25.
    // - If longer, create a deterministic short ref using a type prefix + hash.
    const cleaned = (reference || '').replace(/[^A-Za-z0-9_-]/g, '');

    if (cleaned.length > 0 && cleaned.length <= 25) {
      return cleaned;
    }

    // Determine a short, readable prefix based on original ref
    const base = cleaned || 'ref';
    const firstPart = base.split('_')[0]?.toLowerCase() || 'ref';
    let prefix = 'ref';
    if (firstPart.startsWith('teori')) prefix = 'teo';
    else if (firstPart.startsWith('handledar')) prefix = 'hdl';
    else if (firstPart.startsWith('session')) prefix = 'ses';
    else if (firstPart.startsWith('booking')) prefix = 'bok';

    // Deterministic hash to ensure uniqueness and stability for same input
    const hash = crypto
      .createHash('sha1')
      .update(reference)
      .digest('base64url')
      .replace(/[^A-Za-z0-9_-]/g, '');

    // Compose: <prefix>_<hashFragment> with total length <= 25
    const remaining = 25 - (prefix.length + 1);
    const shortRef = `${prefix}_${hash.slice(0, Math.max(0, remaining))}`;

    console.log(`[TEORI DEBUG] Sanitized reference: "${reference}" -> "${shortRef}" (${shortRef.length} chars)`);
    return shortRef;
  }

  private generateCallbackToken(ttlMs: number = 24 * 60 * 60 * 1000): { token: string; expiresAt: Date } {
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + ttlMs);
    return { token, expiresAt };
  }

  private async retryApiCall<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (i === maxRetries - 1) {
          logger.error('payment', `Teori API call failed after ${maxRetries} attempts`, {
            error: lastError.message,
            attempt: i + 1,
            maxRetries
          });
          throw lastError;
        }
        
        const delay = 1000 * Math.pow(2, i); // Exponential backoff: 1s, 2s, 4s
        logger.warn('payment', `Teori API call failed, retrying in ${delay}ms`, {
          error: lastError.message,
          attempt: i + 1,
          maxRetries,
          delay
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
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
    
    console.log('[TEORI DEBUG] GetOrder request:', { url, hasApiKey: !!settings.apiKey, orderId });
    
    return this.retryApiCall(async () => {
      const res = await fetch(url, { method: 'GET', headers });
      const text = await res.text();
      
      if (!res.ok) {
        throw new TeoriApiError(`GetOrder error: ${res.status} ${res.statusText}`, { 
          status: res.status, 
          body: text,
          statusText: res.statusText
        });
      }
      
      return JSON.parse(text);
    });
  }

  public async findExistingOrder(teoriBookingId?: string): Promise<any> {
    if (!teoriBookingId) {
      return null;
    }

    try {
      const existingOrder = await db.select().from(qliroOrders).where(eq(qliroOrders.teoriBookingId, teoriBookingId)).limit(1);
      return existingOrder.length > 0 ? existingOrder[0] : null;
    } catch (error) {
      logger.warn('payment', 'Failed to find existing Teori order', {
        error: error instanceof Error ? error.message : 'Unknown error',
        teoriBookingId
      });
      return null;
    }
  }

  public async createOrderRecord(params: {
    teoriBookingId?: string;
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
        teoriBookingId: params.teoriBookingId || null,
        qliroOrderId: params.qliroOrderId,
        merchantReference: params.merchantReference,
        // Store amount in SEK as decimal string; params.amount is provided in SEK
        amount: Number(params.amount).toFixed(2),
        paymentLink: params.paymentLink || null,
        environment: params.environment || 'sandbox',
        callbackToken: params.callbackToken || null,
        callbackTokenExpiresAt: params.callbackTokenExpiresAt || null
      };

      const result = await db.insert(qliroOrders).values(orderRecord).returning({ id: qliroOrders.id });
      
      logger.info('payment', 'Teori order record created', {
        recordId: result[0]?.id,
        qliroOrderId: params.qliroOrderId,
        merchantReference: params.merchantReference
      });

      return result[0]?.id?.toString() || null;
    } catch (error) {
      logger.error('payment', 'Failed to create Teori order record', {
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

      logger.info('payment', 'Teori order status updated', {
        qliroOrderId,
        status,
        hasPaymentLink: !!paymentLink
      });
    } catch (error) {
      logger.error('payment', 'Failed to update Teori order status', {
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
    teoriBookingId?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerFirstName?: string;
    customerLastName?: string;
  }): Promise<{ checkoutId: string; checkoutUrl: string; merchantReference: string; isExisting: boolean }> {
    // Step 1: Authorize - Load settings and validate Teori is enabled
    const settings = await this.loadSettings();
    if (!settings.enabled) {
      throw new Error('Teori payment service is not enabled');
    }

    // Step 2: Check for existing order first
    const existingOrder = await this.findExistingOrder(params.teoriBookingId);

    if (existingOrder) {
      logger.info('payment', 'Found existing Teori order, fetching current status', {
        qliroOrderId: existingOrder.qliroOrderId,
        teoriBookingId: params.teoriBookingId
      });

      try {
        // Step 3: Fetch current order status from Teori API
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
        logger.warn('payment', 'Failed to fetch existing Teori order, creating new one', {
          qliroOrderId: existingOrder.qliroOrderId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        // If we can't fetch the existing order, create a new one
      }
    }

    // Step 5: Create new order with Teori API
    logger.info('payment', 'Creating new Teori order', {
      amount: params.amount,
      reference: params.reference,
      teoriBookingId: params.teoriBookingId
    });

    // Generate per-order callback token for webhook (defense-in-depth)
    const { token: cbToken, expiresAt: cbExpiresAt } = this.generateCallbackToken();

    // Before creating, also check if an order exists with the same merchantReference
    const sanitizedMerchantRef = this.sanitizeMerchantReference(params.reference);
    try {
      const byRef = await db
        .select()
        .from(qliroOrders)
        .where(eq(qliroOrders.merchantReference, sanitizedMerchantRef))
        .limit(1);
      if (byRef.length > 0) {
        logger.info('payment', 'Found existing Teori order by merchantReference', {
          merchantReference: sanitizedMerchantRef,
          qliroOrderId: byRef[0].qliroOrderId
        });

        try {
          const orderData = await this.getOrder(byRef[0].qliroOrderId);
          if (orderData.PaymentLink && orderData.PaymentLink !== byRef[0].paymentLink) {
            await this.updateOrderStatus(byRef[0].qliroOrderId, orderData.Status || 'pending', orderData.PaymentLink);
          }
          return {
            checkoutId: byRef[0].qliroOrderId,
            checkoutUrl: orderData.PaymentLink || byRef[0].paymentLink,
            merchantReference: sanitizedMerchantRef,
            isExisting: true
          };
        } catch (e) {
          logger.warn('payment', 'Failed to fetch existing Teori order by merchantReference; will attempt to create new one', {
            error: e instanceof Error ? e.message : 'Unknown error',
            merchantReference: sanitizedMerchantRef
          });
        }
      }
    } catch (lookupErr) {
      logger.warn('payment', 'Lookup by merchantReference failed; proceeding to create new Teori order', {
        error: lookupErr instanceof Error ? lookupErr.message : 'Unknown error',
        merchantReference: sanitizedMerchantRef
      });
    }

    let result: { checkoutId: string; checkoutUrl: string; merchantReference: string };
    try {
      result = await this.createCheckout({
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
    } catch (error: any) {
      const body: string | undefined = error?.body || error?.data?.body;
      const isExists = typeof body === 'string' && body.includes('ORDER_ALREADY_EXISTS');
      if (error?.name === 'TeoriApiError' && isExists) {
        logger.warn('payment', 'Teori reported ORDER_ALREADY_EXISTS; attempting recovery via merchantReference', {
          merchantReference: sanitizedMerchantRef
        });

        try {
          const existing = await db
            .select()
            .from(qliroOrders)
            .where(eq(qliroOrders.merchantReference, sanitizedMerchantRef))
            .limit(1);
          if (existing.length > 0) {
            const orderData = await this.getOrder(existing[0].qliroOrderId);
            const checkoutUrl = orderData.PaymentLink || existing[0].paymentLink;
            if (checkoutUrl && checkoutUrl !== existing[0].paymentLink) {
              await this.updateOrderStatus(existing[0].qliroOrderId, orderData.Status || 'pending', checkoutUrl);
            }
            return {
              checkoutId: existing[0].qliroOrderId,
              checkoutUrl: checkoutUrl!,
              merchantReference: sanitizedMerchantRef,
              isExisting: true
            };
          }
        } catch (recoverErr) {
          logger.warn('payment', 'Recovery after ORDER_ALREADY_EXISTS failed', {
            error: recoverErr instanceof Error ? recoverErr.message : 'Unknown error',
            merchantReference: sanitizedMerchantRef
          });
        }
      }
      // If not recoverable, rethrow
      throw error;
    }

    // Step 6: Insert order reference in database
    try {
      const recordId = await this.createOrderRecord({
        teoriBookingId: params.teoriBookingId,
        qliroOrderId: result.checkoutId,
        merchantReference: result.merchantReference,
        amount: params.amount,
        paymentLink: result.checkoutUrl,
        environment: settings.environment,
        callbackToken: cbToken,
        callbackTokenExpiresAt: cbExpiresAt
      });

      logger.info('payment', 'Teori order record created in database', {
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
      throw new Error('Teori payment service is not enabled');
    }

    const merchantReference = this.sanitizeMerchantReference(params.reference);
    
    logger.info('payment', 'Creating Teori checkout', {
      amount: params.amount,
      merchantReference,
      hasCustomer: !!(params.customerEmail || params.customerFirstName),
      returnUrl: params.returnUrl
    });

    // Add debug logging for URLs being sent to Teori
    const checkoutUrls = {
      termsUrl: `${this.settings!.publicUrl}/kopvillkor`,
      confirmationUrl: params.returnUrl,
      checkoutStatusPushUrl: `${this.settings!.publicUrl}/api/payments/teori/webhook`,
      orderManagementStatusPushUrl: `${this.settings!.publicUrl}/api/payments/teori/order-management-status`,
      orderValidationUrl: `${this.settings!.publicUrl}/api/payments/teori/order-validate`,
    };
    
    console.log('[TEORI DEBUG] URLs being sent to Teori:', checkoutUrls);

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
      PaymentMethods: ['Card', 'Swish', 'Invoice'], // Default payment methods for Teori
      OrderItems: [{
        MerchantReference: merchantReference,
        Description: params.description,
        Type: 'Product',
        Quantity: 1,
        // Teori expects SEK values, not öre; assume params.amount is SEK number
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

      logger.debug('payment', 'Added customer information to Teori checkout request', {
        hasEmail: !!params.customerEmail,
        hasName: !!(params.customerFirstName || params.customerLastName),
        hasPhone: !!params.customerPhone
      });
    }

    const bodyString = JSON.stringify(checkoutRequest);
    const url = `${settings.apiUrl}/checkout/merchantapi/Orders`;
    const authHeader = this.generateAuthHeader(bodyString);

    logger.info('payment', 'Sending Teori checkout request', {
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

      response = await this.retryApiCall(async () => {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'Authorization': authHeader,
            'x-api-key': settings.apiKey,
            'Teori-Application-Id': settings.apiKey,
            'X-Teori-Application-Id': settings.apiKey,
            'User-Agent': 'TrafikskolaX/1.0'
          },
          body: bodyString,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return res;
      });
    } catch (fetchError: any) {
      logger.error('payment', 'Network error when calling Teori API', {
        error: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error',
        errorName: fetchError?.name,
        errorCause: fetchError?.cause,
        url,
        merchantReference
      });
      
      // Provide more specific error messages
      if (fetchError?.name === 'AbortError') {
        throw new TeoriApiError('Request timeout: Teori API did not respond within 30 seconds');
      } else if (fetchError?.code === 'ENOTFOUND' || fetchError?.code === 'ECONNREFUSED') {
        throw new TeoriApiError('Network connectivity issue: Cannot reach Teori API');
      } else {
        throw new TeoriApiError(`Network error: ${fetchError instanceof Error ? fetchError.message : 'fetch failed'}`);
      }
    }

    let text: string;
    try {
      text = await response.text();
    } catch (textError: any) {
      logger.error('payment', 'Failed to read Teori API response', {
        error: textError instanceof Error ? textError.message : 'Unknown text error',
        status: response.status,
        url,
        merchantReference
      });
      throw new TeoriApiError(`Response read error: ${textError instanceof Error ? textError.message : 'text read failed'}`, { 
        status: response.status 
      });
    }

    if (!response.ok) {
      logger.error('payment', 'Teori checkout creation failed', {
        status: response.status,
        statusText: response.statusText,
        body: text,
        url,
        merchantReference,
        requestBody: bodyString
      });
      throw new TeoriApiError(`CreateCheckout error: ${response.status} ${response.statusText}`, { 
        status: response.status, 
        body: text,
        statusText: response.statusText
      });
    }

    const checkoutData = JSON.parse(text);
    
    logger.info('payment', 'Teori checkout created successfully', {
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

  public async verifyWebhookSignature(signature: string, body: string): Promise<boolean> {
    try {
      const settings = await this.loadSettings();
      if (!settings.webhookSecret) {
        logger.warn('payment', 'No webhook secret configured for Teori');
        return false;
      }

      // Generate expected signature using the same method as the payment provider
      const expectedSignature = crypto
        .createHmac('sha256', settings.webhookSecret)
        .update(body)
        .digest('hex');

      const providedSignature = signature.replace(/^sha256=/, '');
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
    } catch (error) {
      logger.error('payment', 'Error verifying Teori webhook signature', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
}

// Export singleton instance
export const teoriService = TeoriService.getInstance();
