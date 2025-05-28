"use server"

interface ContactFormState {
  success?: boolean
  error?: string
}

export async function submitContactForm(
  prevState: ContactFormState | null,
  formData: FormData,
): Promise<ContactFormState> {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const message = formData.get("message") as string
    const preferredContact = formData.get("preferredContact") as string

    // Validate required fields
    if (!name || !message) {
      return { error: "Namn och meddelande är obligatoriska fält." }
    }

    // Validate preferred contact method
    if (preferredContact === "email") {
      if (!email || !validateEmail(email)) {
        return { error: "Vänligen ange en giltig e-postadress." }
      }
    } else if (preferredContact === "phone") {
      if (!phone || !validateSwedishPhone(phone)) {
        return { error: "Vänligen ange ett giltigt svenskt telefonnummer." }
      }
    }

    console.log("=== EMAIL DEBUG START ===")
    console.log("Environment check:", {
      hasDrivingSchoolEmail: !!process.env.DRIVING_SCHOOL_EMAIL,
      drivingSchoolEmailValue: process.env.DRIVING_SCHOOL_EMAIL,
      hasSendGridApiKey: !!process.env.SENDGRID_API_KEY,
      sendGridApiKeyPrefix: process.env.SENDGRID_API_KEY?.substring(0, 10) + "...",
      hasSendGridFromEmail: !!process.env.SENDGRID_FROM_EMAIL,
      sendGridFromEmailValue: process.env.SENDGRID_FROM_EMAIL,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    })

    // Get the driving school email from environment variables
    const drivingSchoolEmail = process.env.DRIVING_SCHOOL_EMAIL

    if (!drivingSchoolEmail) {
      console.error("DRIVING_SCHOOL_EMAIL environment variable is not set")
      return { error: "E-postkonfiguration saknas (mottagare). Vänligen ring oss direkt på 0760-389192." }
    }

    // Create email content
    const emailSubject = `Ny kontaktförfrågan från ${name} - Din Trafikskola Hässleholm`
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #DC2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Din Trafikskola Hässleholm</h1>
          <p style="margin: 5px 0 0 0;">Ny kontaktförfrågan från webbsidan</p>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #DC2626; margin-top: 0;">Kontaktinformation</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #ddd; font-weight: bold; width: 30%;">Namn:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #ddd;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #ddd; font-weight: bold;">E-post:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #ddd;">${email || "Ej angiven"}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #ddd; font-weight: bold;">Telefon:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #ddd;">${phone || "Ej angiven"}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #ddd; font-weight: bold;">Föredragen kontakt:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #ddd;">
                <span style="background-color: ${preferredContact === "email" ? "#10B981" : "#3B82F6"}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                  ${preferredContact === "email" ? "📧 E-post" : "📞 Telefon"}
                </span>
              </td>
            </tr>
          </table>
          
          <h3 style="color: #DC2626; margin-top: 30px;">Meddelande</h3>
          <div style="background-color: white; padding: 20px; border-left: 4px solid #DC2626; margin: 10px 0; border-radius: 4px;">
            ${message.replace(/\n/g, "<br>")}
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background-color: #EFF6FF; border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0; color: #1E40AF;">Nästa steg:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #374151;">
              <li>Kontakta kunden inom 24 timmar</li>
              <li>Använd den föredragna kontaktmetoden: <strong>${preferredContact === "email" ? "E-post" : "Telefon"}</strong></li>
              <li>Erbjud bedömningslektion för 500 kr (kampanjpris)</li>
              <li>Boka tid som passar kundens schema</li>
            </ul>
          </div>
        </div>
        
        <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">Skickat från Din Trafikskola Hässleholm webbsida</p>
          <p style="margin: 5px 0 0 0;">Datum: ${new Date().toLocaleString("sv-SE")}</p>
          <p style="margin: 5px 0 0 0;">Environment: ${process.env.VERCEL_ENV || "development"}</p>
        </div>
      </div>
    `

    const emailText = `
Ny kontaktförfrågan från webbsidan:

Namn: ${name}
E-post: ${email || "Ej angiven"}
Telefon: ${phone || "Ej angiven"}
Föredragen kontaktmetod: ${preferredContact === "email" ? "E-post" : "Telefon"}

Meddelande:
${message}

Nästa steg:
- Kontakta kunden inom 24 timmar
- Använd föredragen kontaktmetod: ${preferredContact === "email" ? "E-post" : "Telefon"}
- Erbjud bedömningslektion för 500 kr (kampanjpris)

---
Skickat från Din Trafikskola Hässleholm webbsida
Datum: ${new Date().toLocaleString("sv-SE")}
Environment: ${process.env.VERCEL_ENV || "development"}
    `.trim()

    // Check for SendGrid credentials
    const sendGridApiKey = process.env.SENDGRID_API_KEY
    const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL

    if (sendGridApiKey && sendGridFromEmail) {
      console.log("Attempting to send email via SendGrid...")
      console.log("SendGrid API Key format check:", {
        hasApiKey: !!sendGridApiKey,
        startsWithSG: sendGridApiKey.startsWith("SG."),
        keyLength: sendGridApiKey.length,
        keyPrefix: sendGridApiKey.substring(0, 10),
        fromEmail: sendGridFromEmail,
      })

      // Validate API key format
      if (!sendGridApiKey.startsWith("SG.")) {
        console.error("Invalid SendGrid API key format - should start with 'SG.'")
        return { error: "SendGrid API-nyckel har fel format. Kontakta administratör." }
      }

      if (sendGridApiKey.length < 50) {
        console.error("SendGrid API key seems too short")
        return { error: "SendGrid API-nyckel verkar vara ofullständig. Kontakta administratör." }
      }

      try {
        const sendGridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sendGridApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [
              {
                to: [{ email: drivingSchoolEmail }],
                subject: emailSubject,
              },
            ],
            from: {
              email: sendGridFromEmail,
              name: "Din Trafikskola Hässleholm",
            },
            content: [
              {
                type: "text/plain",
                value: emailText,
              },
              {
                type: "text/html",
                value: emailHtml,
              },
            ],
            reply_to: {
              email: email || sendGridFromEmail,
            },
          }),
        })

        console.log("SendGrid response status:", sendGridResponse.status)

        if (sendGridResponse.ok) {
          console.log("✅ Email sent successfully via SendGrid")
          return { success: true }
        } else {
          const errorText = await sendGridResponse.text()
          console.error("SendGrid API error details:", {
            status: sendGridResponse.status,
            statusText: sendGridResponse.statusText,
            error: errorText,
          })

          // Parse the error response
          let errorMessage = "SendGrid API fel"
          try {
            const errorJson = JSON.parse(errorText)
            if (errorJson.errors && errorJson.errors.length > 0) {
              const firstError = errorJson.errors[0]
              if (firstError.message.includes("authorization grant is invalid")) {
                errorMessage = "SendGrid API-nyckel är ogiltig eller har gått ut. Kontrollera API-nyckeln."
              } else if (firstError.message.includes("not verified")) {
                errorMessage = "E-postadressen är inte verifierad i SendGrid. Verifiera avsändaradressen."
              } else {
                errorMessage = `SendGrid fel: ${firstError.message}`
              }
            }
          } catch (parseError) {
            console.error("Could not parse SendGrid error response")
          }

          return { error: errorMessage }
        }
      } catch (fetchError: any) {
        console.error("Network error when calling SendGrid:", fetchError)
        return { error: "Nätverksfel vid e-postsändning. Försök igen senare." }
      }
    } else {
      // Fallback: Log the email content
      console.log("SendGrid credentials not available, logging email content:")
      console.log("=== EMAIL CONTENT ===")
      console.log("To:", drivingSchoolEmail)
      console.log("Subject:", emailSubject)
      console.log("Content:", emailText)
      console.log("=== END EMAIL CONTENT ===")

      // Return success so the form works
      return { success: true }
    }
  } catch (error: any) {
    console.error("❌ Error submitting contact form:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    })

    return { error: `Tekniskt fel: ${error.message}. Ring oss på 0760-389192.` }
  }
}

// Validate Swedish phone number (mobile and landline)
function validateSwedishPhone(phone: string): boolean {
  // Remove all spaces, dashes, and plus signs
  const cleanPhone = phone.replace(/[\s\-+]/g, "")

  // Swedish mobile: 07X-XXXXXXX (10 digits starting with 07)
  // Swedish landline: 0XX-XXXXXXX (9-10 digits starting with 0, not 07)
  const mobilePattern = /^07[0-9]{8}$/
  const landlinePattern = /^0[1-6,8-9][0-9]{7,8}$/

  return mobilePattern.test(cleanPhone) || landlinePattern.test(cleanPhone)
}

// Validate email
function validateEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(email)
}
