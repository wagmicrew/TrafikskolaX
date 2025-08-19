"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Lock, Mail, Phone, UserPlus, LogIn, Shield, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('login')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated } = useAuth()

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to dashboard or intended page
      const redirectUrl = searchParams?.get('redirect') || '/dashboard'
      router.push(redirectUrl)
    }
  }, [isAuthenticated, router, searchParams])

  // Set active tab based on URL parameter
  useEffect(() => {
    const tab = searchParams?.get('tab')
    if (tab === 'register') {
      setActiveTab('register')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.target as HTMLFormElement)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        // Use the auth context login method
        if (data.token) {
          login(data.token)
        }

        // Check for redirect parameter
        const redirectUrl = searchParams?.get('redirect') || data.redirectUrl || '/dashboard'
        router.push(redirectUrl)
      } else {
        setError(data.error || 'Inloggning misslyckades')
      }
    } catch (error) {
      setError('Ett fel uppstod vid inloggning')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.target as HTMLFormElement)
    const userData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      phone: formData.get('phone') as string,
      personalNumber: formData.get('personalNumber') as string,
      role: formData.get('role') as string || 'student',
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (data.success) {
        // Use the auth context login method
        if (data.token) {
          login(data.token)
        }
        
        // Redirect to appropriate dashboard
        const redirectUrl = userData.role === 'admin' ? '/dashboard/admin' : 
                           userData.role === 'teacher' ? '/dashboard/teacher' : 
                           '/dashboard/student'
        router.push(redirectUrl)
      } else {
        setError(data.error || 'Registrering misslyckades')
      }
    } catch (error) {
      setError('Ett fel uppstod vid registrering')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Välkommen tillbaka</h1>
          <p className="text-gray-600">Logga in på ditt konto eller skapa ett nytt</p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Login Forms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Inloggning & Registrering</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Logga in</TabsTrigger>
                <TabsTrigger value="register">Registrera</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-postadress</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="din.email@exempel.se"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Lösenord</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Ditt lösenord"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
                    {isLoading ? "Loggar in..." : "Logga in"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Förnamn</Label>
                      <Input id="firstName" name="firstName" placeholder="Anna" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Efternamn</Label>
                      <Input id="lastName" name="lastName" placeholder="Andersson" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regEmail">E-postadress</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="regEmail"
                        name="email"
                        type="email"
                        placeholder="din.email@exempel.se"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefonnummer</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="070-123 45 67"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="personalNumber">Personnummer (valfritt)</Label>
                    <Input
                      id="personalNumber"
                      name="personalNumber"
                      placeholder="YYYYMMDD-XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Roll</Label>
                    <Select name="role" defaultValue="student">
                      <SelectTrigger>
                        <SelectValue placeholder="Välj roll" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Elev</SelectItem>
                        <SelectItem value="teacher">Lärare</SelectItem>
                        <SelectItem value="admin">Administratör</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regPassword">Lösenord</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="regPassword"
                        name="password"
                        type="password"
                        placeholder="Skapa ett säkert lösenord"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
                    {isLoading ? "Registrerar..." : "Skapa konto"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Behöver du hjälp? Ring oss på{" "}
            <a href="tel:0760389192" className="text-red-600 hover:text-red-700 font-semibold">
              0760-389192
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
