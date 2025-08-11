'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Phone, ArrowRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterSplitPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const payload = {
      firstName: (formData.get('firstName') as string)?.trim(),
      lastName: (formData.get('lastName') as string)?.trim(),
      email: (formData.get('email') as string)?.trim(),
      password: (formData.get('password') as string) || '',
      phone: (formData.get('phone') as string)?.trim() || '',
      role: 'student' as const,
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        if (data.token) {
          try {
            localStorage.setItem('auth-token', data.token)
            document.cookie = `auth-token=${data.token}; path=/; max-age=604800; SameSite=Lax`
          } catch {}
        }
        router.push('/dashboard/student')
      } else {
        setError(data.error || 'Registrering misslyckades')
      }
    } catch {
      setError('Ett fel uppstod vid registrering')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white">
      {/* Left: Image + Copy */}
      <div className="relative hidden md:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/conference-room.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        <div className="relative h-full p-10 flex flex-col justify-end">
          <div>
            <h1 className="text-4xl font-extrabold text-white drop-shadow-md">Skapa ditt konto</h1>
            <p className="mt-4 text-lg text-white/90 max-w-lg">
              Gå med på några sekunder. Du kan alltid komplettera uppgifter senare i din profil.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-2xl font-extrabold text-gray-900">Registrera</h2>
              <p className="text-sm text-gray-600 mt-1">Fyll i minimalt för att komma igång</p>
            </div>

            {error && (
              <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-gray-900 font-semibold">Förnamn</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input id="firstName" name="firstName" placeholder="Anna" required className="pl-12 h-12 rounded-xl" />
                  </div>
                  <p className="text-xs text-gray-500">Ditt tilltalsnamn.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-gray-900 font-semibold">Efternamn</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input id="lastName" name="lastName" placeholder="Andersson" required className="pl-12 h-12 rounded-xl" />
                  </div>
                  <p className="text-xs text-gray-500">Som det står i din legitimation.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-gray-900 font-semibold">E-postadress</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input id="email" name="email" type="email" placeholder="din.email@exempel.se" required className="pl-12 h-12 rounded-xl" />
                </div>
                <p className="text-xs text-gray-500">Vi skickar bokningsbekräftelser hit.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-gray-900 font-semibold">Lösenord</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input id="password" name="password" type="password" placeholder="Minst 8 tecken" required className="pl-12 h-12 rounded-xl" />
                </div>
                <p className="text-xs text-gray-500">Använd minst 8 tecken för ett starkare lösenord.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-gray-900 font-semibold">Telefon (valfritt)</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input id="phone" name="phone" type="tel" placeholder="070-123 45 67" className="pl-12 h-12 rounded-xl" />
                </div>
                <p className="text-xs text-gray-500">Underlättar snabb kontakt vid förändringar.</p>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg rounded-xl bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-200 inline-flex items-center justify-center gap-2">
                {isLoading ? 'Skapar konto...' : 'Skapa konto'}
                {!isLoading && <ArrowRight className="w-5 h-5" />}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Har du redan ett konto?{' '}
                <a href="/login" className="font-semibold text-red-700 hover:text-red-800">Logga in</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}


