import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging/logger';

// Normalize Swish payee alias:
// - Merchant alias starts with '123' (no country code)
// - MSISDN should be in international format without '+', e.g. '46XXXXXXXXX'
// - If we detect '46' prefixed in front of a merchant alias (e.g. '46123...'), strip the '46'
function normalizePayee(input: string): string {
  try {
    let p = (input || '').toString().trim();
    // Remove spaces and non-digits, strip leading '+'
    p = p.replace(/\s+/g, '').replace(/^\+/, '');
    p = p.replace(/[^\d]/g, '');

    // If someone configured '46' + merchant alias (e.g., '46123xxxxxxx'), fix it
    if (p.startsWith('46') && p.slice(2).startsWith('123')) {
      p = p.slice(2);
    }

    // Merchant alias
    if (p.startsWith('123')) {
      return p;
    }

    // MSISDN (Swedish) handling
    if (p.startsWith('46')) return p;
    if (p.startsWith('0')) return '46' + p.slice(1);
    return '46' + p;
  } catch {
    return input;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      payee, 
      amount, 
      message, 
      format = 'png', 
      size = 300,
      border = 0,
      transparent = true,
      editable = false
    } = body;

    const normalizedPayee = typeof payee === 'string' && payee
      ? normalizePayee(payee)
      : undefined;

    // Log the QR code generation request
    logger.info('payment', 'Generating Swish QR code', { 
      payee: normalizedPayee, 
      amount, 
      message: message?.substring(0, 20) + '...', // Log only first part of message for privacy
      format,
      size
    });

    // Validate required fields
    if (!payee && !amount && !message) {
      return NextResponse.json(
        { error: 'At least one of payee, amount, or message must be provided' },
        { status: 400 }
      );
    }

    // Prepare the request payload for Swish QR API
    // Swish API requires minimum size of 300
    const apiSize = format === 'svg' ? undefined : Math.max(size, 300);
    const qrPayload: Record<string, unknown> = {
      format,
      size: apiSize,
      border,
      transparent: format === 'jpg' ? false : transparent
    };

    // Add payee if provided
    if (normalizedPayee) {
      qrPayload.payee = {
        value: normalizedPayee, // Already normalized
        editable
      };
    }

    // Add amount if provided
    if (amount && amount.toString().trim() !== '') {
      const amountValue = parseFloat(amount.toString());
      if (!isNaN(amountValue) && amountValue > 0) {
        qrPayload.amount = {
          value: amountValue,
          editable
        };
      }
    }

    // Add message if provided
    if (message && message.toString().trim() !== '') {
      qrPayload.message = {
        value: message.toString().substring(0, 50), // Max 50 characters
        editable
      };
    }

    // Make request to Swish QR Code API
    const swishQrResponse = await fetch('https://mpc.getswish.net/qrg-swish/api/v1/prefilled', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(qrPayload),
    });

    if (!swishQrResponse.ok) {
      const errorText = await swishQrResponse.text();
      logger.error('payment', 'Swish QR API error', { 
        status: swishQrResponse.status, 
        statusText: swishQrResponse.statusText,
        error: errorText,
        payload: qrPayload,
        url: 'https://mpc.getswish.net/qrg-swish/api/v1/prefilled'
      });
      
      // If Swish API fails, fall back to local QR generation
      logger.info('payment', 'Falling back to local QR generation');
      return await generateLocalQR(normalizedPayee, amount, message, format, size, transparent);
    }

    // Get the image buffer from Swish API
    const imageBuffer = await swishQrResponse.arrayBuffer();
    
    logger.info('payment', 'Swish QR code generated successfully', { 
      format,
      size: imageBuffer.byteLength 
    });

    // Determine content type based on format
    const contentType = format === 'png' ? 'image/png' : 
                       format === 'jpg' ? 'image/jpeg' : 
                       'image/svg+xml';

    // Return the image
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    logger.error('payment', 'Error generating Swish QR code', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    // Fall back to local QR generation on any error
    try {
      const body = await request.json();
      const { payee, amount, message, format = 'png', size = 300, transparent = true } = body;
      const normalizedPayee = typeof payee === 'string' && payee ? normalizePayee(payee) : undefined;
      return await generateLocalQR(normalizedPayee, amount, message, format, size, transparent);
    } catch (fallbackError) {
      console.error('Swish QR generation error:', error);
      return NextResponse.json(
        { error: 'Failed to generate QR code' },
        { status: 500 }
      );
    }
  }
}

// Fallback function to generate QR code locally
async function generateLocalQR(
  payee?: string, 
  amount?: string | number, 
  message?: string, 
  format: string = 'png',
  size: number = 300,
  transparent: boolean = true
) {
  try {
    const QRCode = (await import('qrcode')).default;
    
    // Create Swish payment data structure
    const swishData = {
      version: 1,
      ...(payee && {
        payee: {
          value: payee.replace(/\s/g, ''),
          editable: false
        }
      }),
      ...(amount && {
        amount: {
          value: parseFloat(amount.toString()),
          editable: false
        }
      }),
      ...(message && {
        message: {
          value: message.toString().substring(0, 50),
          editable: false
        }
      })
    };

    const swishUrl = `swish://payment?data=${encodeURIComponent(JSON.stringify(swishData))}`;
    
    if (format === 'svg') {
      const svgString = await QRCode.toString(swishUrl, {
        type: 'svg',
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: transparent ? '#00000000' : '#FFFFFF'
        }
      });
      
      return new NextResponse(svgString, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } else {
      const dataUrl = await QRCode.toDataURL(swishUrl, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: transparent ? '#00000000' : '#FFFFFF'
        }
      });
      
      // Convert data URL to buffer
      const base64Data = dataUrl.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
  } catch (error) {
    logger.error('payment', 'Local QR generation failed', { error });
    throw error;
  }
}
