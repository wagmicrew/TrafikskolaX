'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Trash2, Edit2, Plus, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface Credit {
  id: number
  userId: string
  lessonTypeId: number | null
  handledarSessionId: number | null
  creditType: 'lesson' | 'handledar'
  creditsRemaining: number
  creditsTotal: number
  packageId: number | null
  createdAt: string
  updatedAt: string
  lessonTypeName?: string
  handledarSessionTitle?: string
}

interface LessonType {
  id: number
  name: string
  price: number
}

interface HandledarSession {
  id: number
  title: string
}

interface CreditsClientProps {
  userId: string
}

export default function CreditsClient({ userId }: CreditsClientProps) {
  const [credits, setCredits] = useState<Credit[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCredits, setTotalCredits] = useState(0)

  useEffect(() => {
    fetchCredits()
  }, [userId])

  const fetchCredits = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/credits`)
      if (!response.ok) throw new Error('Failed to fetch credits')
      const data = await response.json()
      setCredits(data.credits || [])
      setTotalCredits(data.totalCredits || 0)
    } catch (error) {
      console.error('Error fetching credits:', error)
      toast.error('Failed to load credits')
    } finally {
      setLoading(false)
    }
  }

  const [newCreditAmount, setNewCreditAmount] = useState(0)
  const [editCreditId, setEditCreditId] = useState<null | number>(null)
  const [editCreditAmount, setEditCreditAmount] = useState(0)

  const handleRefresh = () => {
    setLoading(true)
    fetchCredits()
  }

  const handleAddCredit = async () => {
    if (newCreditAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    try {
      const response = await fetch(`/api/admin/users/${userId}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: newCreditAmount, creditType: 'generic' }),
      })
      if (!response.ok) throw new Error('Failed to add credits')
      toast.success('Credits added successfully')
      setNewCreditAmount(0)
      fetchCredits()
    } catch (error) {
      console.error('Error adding credit:', error)
      toast.error('Failed to add credit')
    }
  }

  const handleUpdateCredit = async (id: number) => {
    if (editCreditAmount < 0) {
      toast.error('Please enter a valid amount')
      return
    }
    try {
      const response = await fetch(`/api/admin/users/${userId}/credits`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ creditsId: id, creditsRemaining: editCreditAmount }),
      })
      if (!response.ok) throw new Error('Failed to update credits')
      toast.success('Credits updated successfully')
      setEditCreditId(null)
      fetchCredits()
    } catch (error) {
      console.error('Error updating credit:', error)
      toast.error('Failed to update credit')
    }
  }

  const handleDeleteCredit = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/credits?creditsId=${id}&all=true`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete credits')
      toast.success('Credits deleted successfully')
      fetchCredits()
    } catch (error) {
      console.error('Error deleting credit:', error)
      toast.error('Failed to delete credit')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Credits Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Total Credits:</span>
              <span className="text-2xl font-bold">{totalCredits}</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={newCreditAmount}
                onChange={(e) => setNewCreditAmount(Number(e.target.value))}
                placeholder="Amount"
                className="input"
              />
              <Button onClick={handleAddCredit} variant="primary">
                Add Credit
              </Button>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credit History</CardTitle>
        </CardHeader>
        <CardContent>
          {credits.length === 0 ? (
            <p className="text-muted-foreground">No credits found.</p>
          ) : (
            <div className="space-y-2">
              {credits.map((credit) => (
                <div key={credit.id} className="flex items-center justify-between p-2 border rounded">
                  {editCreditId === credit.id ? (
                    <>
                      <input
                        type="number"
                        value={editCreditAmount}
                        onChange={(e) => setEditCreditAmount(Number(e.target.value))}
                        className="input"
                      />
                      <Button onClick={() => handleUpdateCredit(credit.id)} variant="success">
                        Save
                      </Button>
                      <Button onClick={() => setEditCreditId(null)} variant="secondary">
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <span>Amount: {credit.amount}</span>
                      <Button onClick={() => {
                        setEditCreditId(credit.id)
                        setEditCreditAmount(credit.creditsRemaining)
                      }} variant="warning">
                        Edit
                      </Button>
                      <Button onClick={() => handleDeleteCredit(credit.id)} variant="danger">
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
