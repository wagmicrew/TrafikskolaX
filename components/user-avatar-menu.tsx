"use client"

import { memo, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { 
  User, 
  LogOut, 
  LayoutDashboard, 
  MessageCircle, 
  Settings, 
  BookOpen,
  CreditCard,
  FileText,
  Bell,
  Shield,
  GraduationCap,
  Crown,
  Badge,
  Calendar,
  Star,
  HelpCircle,
  Info,
  Users
} from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useAuthActions } from "@/hooks/useAuthActions"
import { Badge as BadgeComponent } from "@/components/ui/badge"

export const UserAvatarMenu = memo(function UserAvatarMenu() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const { handleLogout } = useAuthActions()
  const unreadCount = 0
  const [messagesEnabled, setMessagesEnabled] = useState(false)
  const [isImpersonating, setIsImpersonating] = useState(false)

  if (!user) return null

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase()

  const dashboardUrl = 
    user.role === "admin"
      ? "/dashboard/admin"
      : user.role === "teacher"
      ? "/dashboard/teacher"
      : "/dashboard/student"

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'teacher': return <GraduationCap className="h-4 w-4" />;
      case 'student': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'teacher': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'student': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administratör';
      case 'teacher': return 'Lärare';
      case 'student': return 'Elev';
      default: return 'Användare';
    }
  };

  useEffect(() => {
    if (user) {
      // Check if currently impersonating
      fetch('/api/auth/impersonation-status')
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => setIsImpersonating(Boolean(data?.impersonating)))
        .catch(() => setIsImpersonating(false))
    }
  }, [user])

  const handleRestoreAdmin = async () => {
    try {
      const res = await fetch('/api/auth/impersonate', { method: 'DELETE' })
      if (res.ok) {
        try {
          const data = await res.json()
          if (data?.token) {
            try { localStorage.setItem('auth-token', data.token) } catch {}
            document.cookie = `auth-token=${data.token}; path=/; max-age=604800; SameSite=Lax`
          } else {
            try { localStorage.removeItem('auth-token') } catch {}
            document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
          }
        } catch {}
      }
    } finally {
      router.push('/dashboard/admin')
      try { await refreshUser?.() } catch {}
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl">
          <Avatar className="h-10 w-10 border-2 border-white/20">
            <AvatarImage 
              src={user.profileImage} 
              alt={fullName || user.email} 
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          {false && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white shadow-lg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.profileImage} alt={fullName || user.email} />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-none text-slate-900 truncate">
                  {fullName || "Användare"}
                </p>
                <p className="text-xs leading-none text-slate-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-1">
              {getRoleIcon(user.role)}
              <BadgeComponent variant="outline" className={getRoleColor(user.role)}>
                {getRoleLabel(user.role)}
              </BadgeComponent>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          {isImpersonating && (
            <DropdownMenuItem
              onClick={handleRestoreAdmin}
              className="cursor-pointer hover:bg-yellow-50 text-yellow-700"
            >
              <Shield className="mr-3 h-4 w-4" />
              <div className="flex-1">
                <span className="font-medium">Återgå till admin</span>
                <p className="text-xs text-yellow-700/80">Avsluta tillfällig användarsession</p>
              </div>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => router.push(dashboardUrl)}
            className="cursor-pointer hover:bg-slate-50"
          >
            <LayoutDashboard className="mr-3 h-4 w-4 text-slate-600" />
            <div className="flex-1">
              <span className="font-medium">Din sida</span>
              <p className="text-xs text-slate-500">Gå till din dashboard</p>
            </div>
          </DropdownMenuItem>
          
          {false && (
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/meddelande")}
              className="cursor-pointer hover:bg-slate-50"
            >
              <MessageCircle className="mr-3 h-4 w-4 text-slate-600" />
              <div className="flex-1">
                <span className="font-medium">Meddelanden</span>
                <p className="text-xs text-slate-500">Hantera dina meddelanden</p>
              </div>
              {unreadCount > 0 && (
                <BadgeComponent variant="secondary" className="ml-auto bg-red-100 text-red-800 border-red-200">
                  {unreadCount}
                </BadgeComponent>
              )}
            </DropdownMenuItem>
          )}
          
          {user.role === "student" && (
            <>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/student/feedback")} 
                className="cursor-pointer hover:bg-slate-50"
              >
                <Star className="mr-3 h-4 w-4 text-slate-600" />
                <div className="flex-1">
                  <span className="font-medium">Feedback</span>
                  <p className="text-xs text-slate-500">Se dina omdömen</p>
                </div>
              </DropdownMenuItem>
            </>
          )}
          
          {user.role === "admin" && (
            <>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/admin/users")} 
                className="cursor-pointer hover:bg-slate-50"
              >
                <Users className="mr-3 h-4 w-4 text-slate-600" />
                <div className="flex-1">
                  <span className="font-medium">Användarhantering</span>
                  <p className="text-xs text-slate-500">Hantera användare</p>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/admin/settings")} 
                className="cursor-pointer hover:bg-slate-50"
              >
                <Shield className="mr-3 h-4 w-4 text-slate-600" />
                <div className="flex-1">
                  <span className="font-medium">Systeminställningar</span>
                  <p className="text-xs text-slate-500">Konfigurera systemet</p>
                </div>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push("/dashboard/settings")}
            className="cursor-pointer hover:bg-slate-50"
          >
            <Settings className="mr-3 h-4 w-4 text-slate-600" />
            <div className="flex-1">
              <span className="font-medium">Inställningar</span>
              <p className="text-xs text-slate-500">Hantera din profil</p>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => router.push("/dashboard/help")}
            className="cursor-pointer hover:bg-slate-50"
          >
            <HelpCircle className="mr-3 h-4 w-4 text-slate-600" />
            <div className="flex-1">
              <span className="font-medium">Hjälp & Support</span>
              <p className="text-xs text-slate-500">Få hjälp och support</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault()
            handleLogout()
          }}
          className="cursor-pointer text-red-600 focus:text-red-600 hover:bg-red-50"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <div className="flex-1">
            <span className="font-medium">Logga ut</span>
            <p className="text-xs text-red-500">Avsluta din session</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
