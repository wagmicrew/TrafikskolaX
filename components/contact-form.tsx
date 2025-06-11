"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mail, Phone, X } from "lucide-react"

interface ContactFormProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactForm({ isOpen, onClose }: ContactFormProps) {
  const [preferredContact, setPreferredContact] = useState<"email" | "phone">("email")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setSubmitStatus("success")
    setIsSubmitting(false)

    // Close modal after success
    setTimeout(() => {
      onClose()
      setSubmitStatus("idle")
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

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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

                {/* Email/Phone Field */}
                {preferredContact === "email" ? (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                      E-postadress *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
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
                      required
                      placeholder="070-123 45 67"
                      className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg sm:rounded-xl h-10 sm:h-12 text-sm sm:text-base"
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

                {/* Success Message */}
                {submitStatus === "success" && (
                  <div className="p-3 sm:p-4 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-lg sm:rounded-xl">
                    <p className="text-green-100 text-xs sm:text-sm font-medium drop-shadow-sm">
                      Tack för ditt meddelande! Vi kontaktar dig inom kort.
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-red-500/30 text-sm sm:text-base"
                >
                  {isSubmitting ? (
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
