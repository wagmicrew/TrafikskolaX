"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mail, Phone, X } from "lucide-react"
import { submitContactForm } from "@/lib/actions"
import { useActionState } from "react"

interface ContactFormProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactForm({ isOpen, onClose }: ContactFormProps) {
  const [preferredContact, setPreferredContact] = useState<"email" | "phone">("email")
  const [state, action, isPending] = useActionState(submitContactForm, null)

  // Validate Swedish phone number (mobile and landline)
  const validateSwedishPhone = (phone: string): boolean => {
    // Remove all spaces, dashes, and plus signs
    const cleanPhone = phone.replace(/[\s\-+]/g, "")

    // Swedish mobile: 07X-XXXXXXX (10 digits starting with 07)
    // Swedish landline: 0XX-XXXXXXX (9-10 digits starting with 0, not 07)
    const mobilePattern = /^07[0-9]{8}$/
    const landlinePattern = /^0[1-6,8-9][0-9]{7,8}$/

    return mobilePattern.test(cleanPhone) || landlinePattern.test(cleanPhone)
  }

  // Validate email
  const validateEmail = (email: string): boolean => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailPattern.test(email)
  }

  const handleSubmit = async (formData: FormData) => {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const message = formData.get("message") as string

    // Validate required fields
    if (!name || !message) {
      return
    }

    // Validate preferred contact method
    if (preferredContact === "email") {
      if (!email || !validateEmail(email)) {
        return
      }
    } else {
      if (!phone || !validateSwedishPhone(phone)) {
        return
      }
    }

    // Add preferred contact method to form data
    formData.append("preferredContact", preferredContact)

    await action(formData)
  }

  // Close modal on successful submission
  if (state?.success) {
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[750px] max-h-[95vh] sm:max-h-[90vh] p-0 overflow-hidden border-0 bg-transparent shadow-none">
        {/* Glassmorphism Container */}
        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl h-full max-h-[95vh] overflow-hidden">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-blue-500/20 rounded-xl sm:rounded-2xl"></div>

          {/* Scrollable Content Container */}
          <div className="relative z-10 h-full overflow-y-auto">
            <div className="p-4 sm:p-6 md:p-8">
              {/* Header */}
              <DialogHeader className="relative mb-4 sm:mb-6">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg pr-2">
                    Kontakta oss
                  </DialogTitle>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 group flex-shrink-0"
                    aria-label="Stäng formulär"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
                  </button>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mt-3 sm:mt-4"></div>
              </DialogHeader>

              <form action={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                    Namn *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Ditt fullständiga namn"
                    className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg sm:rounded-xl h-10 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                {/* Contact Method Selection */}
                <div className="space-y-3 sm:space-y-4">
                  <Label className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                    Föredragen kontaktmetod
                  </Label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {/* Email Button */}
                    <button
                      type="button"
                      onClick={() => setPreferredContact("email")}
                      className={`flex items-center justify-center space-x-2 sm:space-x-3 p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                        preferredContact === "email"
                          ? "bg-green-500/30 border-green-400/50 shadow-lg scale-105"
                          : "bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30"
                      }`}
                    >
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      <span className="text-white font-medium text-sm sm:text-base">E-post</span>
                    </button>

                    {/* Phone Button */}
                    <button
                      type="button"
                      onClick={() => setPreferredContact("phone")}
                      className={`flex items-center justify-center space-x-2 sm:space-x-3 p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                        preferredContact === "phone"
                          ? "bg-blue-500/30 border-blue-400/50 shadow-lg scale-105"
                          : "bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30"
                      }`}
                    >
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      <span className="text-white font-medium text-sm sm:text-base">Telefon</span>
                    </button>
                  </div>
                </div>

                {/* Email Field */}
                {preferredContact === "email" ? (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                      E-postadress *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required={preferredContact === "email"}
                      placeholder="din@email.se"
                      className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg sm:rounded-xl h-10 sm:h-12 text-sm sm:text-base"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                      Telefonnummer *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required={preferredContact === "phone"}
                      placeholder="070-123 45 67 eller 0451-123 456"
                      className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg sm:rounded-xl h-10 sm:h-12 text-sm sm:text-base"
                    />
                    <p className="text-xs sm:text-sm text-white/70 drop-shadow-sm">
                      Ange svenskt mobilnummer (07X-XXXXXXX) eller fast telefon
                    </p>
                  </div>
                )}

                {/* Optional Field */}
                {preferredContact === "phone" && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/80 font-medium drop-shadow-sm text-sm sm:text-base">
                      E-postadress (valfritt)
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="din@email.se"
                      className="bg-white/5 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:bg-white/10 focus:border-white/30 transition-all duration-200 rounded-lg sm:rounded-xl h-10 sm:h-12 text-sm sm:text-base"
                    />
                  </div>
                )}

                {preferredContact === "email" && (
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white/80 font-medium drop-shadow-sm text-sm sm:text-base">
                      Telefonnummer (valfritt)
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="070-123 45 67"
                      className="bg-white/5 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:bg-white/10 focus:border-white/30 transition-all duration-200 rounded-lg sm:rounded-xl h-10 sm:h-12 text-sm sm:text-base"
                    />
                  </div>
                )}

                {/* Message Field */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                    Meddelande *
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    placeholder="Berätta vad du är intresserad av - körkort, bedömningslektion, eller andra frågor..."
                    rows={3}
                    className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg sm:rounded-xl resize-none text-sm sm:text-base min-h-[80px] sm:min-h-[100px]"
                  />
                </div>

                {/* Error Message */}
                {state?.error && (
                  <div className="p-3 sm:p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg sm:rounded-xl">
                    <p className="text-red-100 text-xs sm:text-sm font-medium drop-shadow-sm">{state.error}</p>
                  </div>
                )}

                {/* Success Message */}
                {state?.success && (
                  <div className="p-3 sm:p-4 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-lg sm:rounded-xl">
                    <p className="text-green-100 text-xs sm:text-sm font-medium drop-shadow-sm">
                      Tack för ditt meddelande! Vi kontaktar dig inom kort.
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-red-500/30 text-sm sm:text-base"
                >
                  {isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Skickar...</span>
                    </div>
                  ) : (
                    "Skicka meddelande"
                  )}
                </Button>
              </form>

              {/* Privacy Notice */}
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10">
                <p className="text-xs sm:text-sm text-white/70 text-center drop-shadow-sm leading-relaxed">
                  Vi behandlar dina personuppgifter enligt GDPR och kontaktar dig endast angående din förfrågan.
                  <br />
                  <span className="text-white/50">Din Trafikskola Hässleholm</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
