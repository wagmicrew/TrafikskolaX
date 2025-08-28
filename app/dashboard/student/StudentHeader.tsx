"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Calendar,
  MessageSquare,
  Package,
  HelpCircle,
  Settings,
  FileText,
  BookOpen,
  Receipt
} from 'lucide-react'
import { Badge } from 'flowbite-react'

interface StudentNavigationProps {
  title?: string
  icon?: React.ReactNode
  rightSlot?: React.ReactNode
  userName?: string
  notificationCount?: number
}

export default function StudentHeader({
  title = "Elevdashboard",
  icon,
  rightSlot,
  userName,
  notificationCount = 0
}: StudentNavigationProps) {
  const pathname = usePathname()

  const navigationItems = [
    {
      href: "/dashboard/student",
      label: "Översikt",
      icon: <BookOpen className="w-4 h-4" />,
      active: pathname === '/dashboard/student'
    },
    {
      href: "/dashboard/student/bokningar",
      label: "Bokningar",
      icon: <Calendar className="w-4 h-4" />,
      active: pathname.startsWith('/dashboard/student/bokningar')
    },
    {
      href: "/dashboard/student/feedback",
      label: "Feedback",
      icon: <MessageSquare className="w-4 h-4" />,
      active: pathname.startsWith('/dashboard/student/feedback')
    },
    {
      href: "/dashboard/student/fakturor",
      label: "Fakturor",
      icon: <Receipt className="w-4 h-4" />,
      active: pathname.startsWith('/dashboard/student/fakturor')
    },
    {
      href: "/paketbutik",
      label: "Paketbutik",
      icon: <Package className="w-4 h-4" />,
      active: pathname === '/paketbutik'
    },
    {
      href: "/dashboard/student/help",
      label: "Hjälp & Info",
      icon: <HelpCircle className="w-4 h-4" />,
      active: pathname.startsWith('/dashboard/student/help')
    },
    {
      href: "/dashboard/settings",
      label: "Inställningar",
      icon: <Settings className="w-4 h-4" />,
      active: pathname.startsWith('/dashboard/settings')
    }
  ]

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Trafikskola Hässleholm
                </h1>
                <p className="text-sm text-gray-600">
                  Välkommen{userName ? `, ${userName}` : ''}!
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {notificationCount > 0 && (
              <Badge color="red" className="relative">
                <MessageSquare className="w-3 h-3 mr-1" />
                {notificationCount}
              </Badge>
            )}
            {rightSlot}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1 pb-4 overflow-x-auto">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={item.active ? "default" : "ghost"}
                size="sm"
                className={`whitespace-nowrap ${
                  item.active
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>

        {/* Page Title Section */}
        {(title || icon) && (
          <div className="pb-6">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {icon && <div className="text-blue-600">{icon}</div>}
                  <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

