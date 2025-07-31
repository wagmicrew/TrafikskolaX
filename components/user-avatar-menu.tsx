"use client"

import { memo } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, LayoutDashboard, MessageCircle, Settings, BookOpen } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useMessages } from "@/lib/hooks/use-messages"

export const UserAvatarMenu = memo(function UserAvatarMenu() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { unreadCount } = useMessages()

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-10 w-10 rounded-full bg-red-600 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.profileImage} alt={user.name || user.email} />
            <AvatarFallback className="bg-red-600 text-white font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-blue-500 ring-2 ring-white" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{fullName || "Användare"}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push(dashboardUrl)}
          className="cursor-pointer"
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>Din sida</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/meddelande")}
          className="cursor-pointer"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          <span>Meddelanden</span>
          {unreadCount > 0 && (
            <span className="ml-auto text-xs font-semibold text-white bg-blue-500 rounded-full px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </DropdownMenuItem>
        {user.role === "student" && (
          <DropdownMenuItem
              onClick={() => router.push("/dashboard/utbildningskort")} 
              className="cursor-pointer"
          >
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Utbildningskort</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/settings")}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Inställningar</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logout()
            router.push("/")
          }}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logga ut</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
