"use client"

import { useState, useEffect } from "react"
import { CheckCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { OrbSpinner } from "@/components/ui/orb-loader"
import { TrueFocusText } from "@/components/ui/true-focus-text"

interface SessionType {
  id: string
  type: 'lesson' | 'handledar' | 'teori';
  name: string
  description: string | null
  durationMinutes: number
  price: number
  priceStudent?: number
  salePrice?: number
  isActive: boolean
  allowsSupervisors?: boolean
  pricePerSupervisor?: number
  maxParticipants?: number
}
