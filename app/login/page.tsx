'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginSplitPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'login'|'email'|'code'|'reset'>('login')
  const [fpEmail, setFpEmail] = useState('')
  const [fpCode, setFpCode] = useState('')
  const [fpNew, setFpNew] = useState('')
  const [fpConfirm, setFpConfirm] = useState('')
  const [fpBusy, setFpBusy] = useState(false)
  const [fpMsg, setFpMsg] = useState('')

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        // Persist token for client-side needs
        if (data.token) {
          try {
            localStorage.setItem('auth-token', data.token)
            document.cookie = `auth-token=${data.token}; path=/; max-age=604800; SameSite=Lax`
          } catch {}
        }
        // Redirect (honor ?redirect=)
        const urlParams = new URLSearchParams(window.location.search)
        const redirectUrl = urlParams.get('redirect') || data.redirectUrl || '/dashboard'
        router.push(redirectUrl)
      } else {
        setError(data.error || 'Inloggning misslyckades')
      }
    } catch {
      setError('Ett fel uppstod vid inloggning')
    } finally {
      setIsLoading(false)
    }
  }

  const startForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setFpBusy(true)
    setFpMsg('')
    try {
      const res = await fetch('/api/auth/forgot/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fpEmail }) })
      if (res.status === 429) {
        setFpMsg('För många försök – vänta 2 minuter innan du försöker igen.')
        return
      }
      setStep('code')
    } finally { setFpBusy(false) }
  }

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setFpBusy(true)
    setFpMsg('')
    try {
      const res = await fetch('/api/auth/forgot/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fpEmail, code: fpCode }) })
      const data = await res.json()
      if (data?.valid) setStep('reset')
      else setFpMsg('Fel kod – försök igen')
    } finally { setFpBusy(false) }
  }

  const doReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (fpNew.length < 6) { setFpMsg('Lösenordet måste vara minst 6 tecken'); return }
    if (fpNew !== fpConfirm) { setFpMsg('Lösenorden matchar inte'); return }
    setFpBusy(true)
    setFpMsg('')
    try {
      const res = await fetch('/api/auth/forgot/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fpEmail, newPassword: fpNew }) })
      const ok = res.ok
      if (ok) {
        setStep('login')
        setError('Lösenordet är uppdaterat. Logga in med ditt nya lösenord.')
      } else {
        setFpMsg('Kunde inte ändra lösenordet')
      }
    } finally { setFpBusy(false) }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white">
      {/* Left: Image + Brand/Copy */}
      <div className="relative hidden md:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/bil1.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        <div className="relative h-full p-10 flex flex-col justify-end">
          <div>
            <h1 className="text-4xl font-extrabold text-white drop-shadow-md">Välkommen tillbaka</h1>
            <p className="mt-4 text-lg text-white/90 max-w-lg">
              Logga in för att boka körlektioner, hantera paket och följa din utveckling. Allt i ett modernt
              och tydligt gränssnitt.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 md:hidden">
            <div className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-xl shadow-red-900/40">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-extrabold tracking-tight text-gray-900">Din Trafikskola</div>
                <div className="text-gray-500 text-sm">Hässleholm</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-2xl font-extrabold text-gray-900">Logga in</h2>
              <p className="text-sm text-gray-600 mt-1">Ange dina uppgifter för att fortsätta</p>
            </div>

            {error && (
              <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 font-semibold">E-postadress</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="din.email@exempel.se"
                    className="pl-12 h-12 text-lg rounded-xl border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 font-semibold">Lösenord</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Ditt lösenord"
                    className="pl-12 h-12 text-lg rounded-xl border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-lg rounded-xl bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-200 inline-flex items-center justify-center gap-2"
              >
                {isLoading ? 'Loggar in...' : 'Fortsätt'}
                {!isLoading && <ArrowRight className="w-5 h-5" />}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Har du inget konto?{' '}
                <a href="/register" className="font-semibold text-red-700 hover:text-red-800">
                  Skapa ett konto
                </a>
              </div>
              <div className="text-center text-sm mt-2">
                <button type="button" className="text-red-700 hover:text-red-800 font-semibold" onClick={() => { setStep('email'); setError('') }}>
                  Glömt lösenord?
                </button>
              </div>
            </form>
          </div>

          {step !== 'login' && (
            <div className="mt-6 rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-xl font-extrabold text-gray-900">Återställ lösenord</h2>
                <p className="text-sm text-gray-600 mt-1">Följ stegen för att återställa ditt lösenord</p>
              </div>
              {fpMsg && <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-sm">{fpMsg}</div>}
              {step === 'email' && (
                <form onSubmit={startForgot} className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-900 font-semibold">E‑postadress</Label>
                    <Input type="email" value={fpEmail} onChange={(e)=>setFpEmail(e.target.value)} placeholder="din.email@exempel.se" required />
                  </div>
                  <Button type="submit" disabled={fpBusy} className="w-full">Skicka kod</Button>
                </form>
              )}
              {step === 'code' && (
                <form onSubmit={verifyCode} className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-900 font-semibold">Kod (6 siffror)</Label>
                    <Input inputMode="numeric" pattern="[0-9]*" value={fpCode} onChange={(e)=>setFpCode(e.target.value)} placeholder="123456" required />
                  </div>
                  <Button type="submit" disabled={fpBusy} className="w-full">Verifiera kod</Button>
                  <div className="text-sm text-gray-600">Du kan begära ny kod efter 2 minuter.</div>
                </form>
              )}
              {step === 'reset' && (
                <form onSubmit={doReset} className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-900 font-semibold">Nytt lösenord</Label>
                    <Input type="password" value={fpNew} onChange={(e)=>setFpNew(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-900 font-semibold">Bekräfta lösenord</Label>
                    <Input type="password" value={fpConfirm} onChange={(e)=>setFpConfirm(e.target.value)} required />
                  </div>
                  <Button type="submit" disabled={fpBusy} className="w-full">Ändra lösenord</Button>
                </form>
              )}
            </div>
          )}

          <div className="text-center mt-6 text-gray-600">
            Behöver du hjälp? Ring{' '}
            <a href="tel:0760389192" className="text-red-700 font-semibold hover:text-red-800">0760-389192</a>
          </div>
        </div>
      </div>
    </div>
  )
}


