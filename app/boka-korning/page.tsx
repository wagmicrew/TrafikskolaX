"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ContactForm } from "@/components/contact-form"
import { Calendar, Phone, Mail, Clock, User, LogIn } from "lucide-react"

interface User {
  userId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

export default function BookingPage() {
  const [showContactForm, setShowContactForm] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('auth-token')
    if (token) {
      fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch(() => {
        localStorage.removeItem('auth-token')
      })
      .finally(() => {
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <main className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Boka körning</h1>
              <p className="text-xl text-gray-600">Boka din körlektion enkelt online</p>
            </div>

            {/* Authentication Status */}
            {isLoading ? (
              <Card className="p-6 mb-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Laddar...</p>
                </div>
              </Card>
            ) : user ? (
              <Card className="p-6 mb-6 bg-green-50 border-green-200">
                <div className="text-center">
                  <User className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Välkommen, {user.firstName}!
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Du är inloggad som {user.role}
                  </p>
                  <Badge className="bg-green-600 text-white">Redo att boka</Badge>
                </div>
              </Card>
            ) : (
              <Card className="p-6 mb-6 bg-yellow-50 border-yellow-200">
                <div className="text-center">
                  <LogIn className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Logga in för att boka
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Du behöver ett konto för att boka lektioner
                  </p>
                  <Button 
                    onClick={() => router.push('/inloggning')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Gå till inloggning
                  </Button>
                </div>
              </Card>
            )}

            {user ? (
              /* Booking Form for Authenticated Users */
              <Card>
                <CardHeader>
                  <CardTitle>Boka körlektion</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="lessonType">Typ av lektion</Label>
                      <Select name="lessonType">
                        <SelectTrigger>
                          <SelectValue placeholder="Välj lektionstyp" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="b_license">B-körkort</SelectItem>
                          <SelectItem value="a_license">A-körkort</SelectItem>
                          <SelectItem value="assessment">Bedömningslektion</SelectItem>
                          <SelectItem value="taxi_license">Taxiförarlegitimation</SelectItem>
                          <SelectItem value="theory">Teoriundervisning</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Datum</Label>
                        <Input id="date" name="date" type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Tid</Label>
                        <Select name="time">
                          <SelectTrigger>
                            <SelectValue placeholder="Välj tid" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="08:00">08:00</SelectItem>
                            <SelectItem value="09:00">09:00</SelectItem>
                            <SelectItem value="10:00">10:00</SelectItem>
                            <SelectItem value="11:00">11:00</SelectItem>
                            <SelectItem value="13:00">13:00</SelectItem>
                            <SelectItem value="14:00">14:00</SelectItem>
                            <SelectItem value="15:00">15:00</SelectItem>
                            <SelectItem value="16:00">16:00</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="duration">Varaktighet</Label>
                      <Select name="duration">
                        <SelectTrigger>
                          <SelectValue placeholder="Välj varaktighet" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">60 minuter</SelectItem>
                          <SelectItem value="90">90 minuter</SelectItem>
                          <SelectItem value="120">120 minuter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Anteckningar (valfritt)</Label>
                      <Input 
                        id="notes" 
                        name="notes" 
                        placeholder="Speciella önskemål eller information..."
                      />
                    </div>
                    
                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                      Boka lektion
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              /* Coming Soon Notice for Non-Authenticated Users */
              <Card className="p-8 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="text-center">
                  <Calendar className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Bokningssystem kommer snart!</h2>
                  <p className="text-gray-700 mb-6">Vi utvecklar ett enkelt bokningssystem där du kommer att kunna:</p>
                  <div className="text-left space-y-2 mb-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-gray-700">Boka och avboka lektioner online</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-gray-700">Se tillgängliga tider i realtid</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-gray-700">Välja instruktör och bil</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-gray-700">Betala direkt online</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-gray-700">Få påminnelser via SMS/e-post</span>
                    </div>
                  </div>
                  <Badge className="bg-blue-600 text-white text-lg px-4 py-2">Lanseras inom kort</Badge>
                </div>
              </Card>
            )}

            {/* Current Contact Options */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Under tiden - kontakta oss direkt</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <Phone className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-800">Ring oss</p>
                  <a href="tel:0760389192" className="text-red-600 hover:text-red-700 text-lg font-semibold">
                    0760-389192
                  </a>
                  <p className="text-sm text-gray-600 mt-1">Måndag - Fredag: 08:00 - 18:00</p>
                </div>

                <div className="text-center border-t pt-4">
                  <Mail className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-800 mb-3">Skicka meddelande</p>
                  <Button onClick={() => setShowContactForm(true)} className="bg-red-600 hover:bg-red-700 w-full">
                    Kontakta oss
                  </Button>
                </div>
              </div>
            </Card>

            {/* Special Offer */}
            <Card className="p-6 mt-6 bg-yellow-50 border-yellow-200">
              <div className="text-center">
                <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <h4 className="text-lg font-bold text-gray-800 mb-2">Kampanj - Bedömningslektion</h4>
                <p className="text-2xl font-bold text-red-600 mb-2">500 kr</p>
                <p className="text-sm text-gray-600">Ordinarie pris: 580 kr</p>
                <p className="text-sm text-gray-700 mt-2">Perfekt för att komma igång med din körkortsutbildning!</p>
              </div>
            </Card>

            {/* Information */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                När bokningssystemet lanseras kommer du att kunna boka lektioner dygnet runt, 7 dagar i veckan.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Contact Form Modal */}
      <ContactForm isOpen={showContactForm} onClose={() => setShowContactForm(false)} />
    </div>
  )
}
