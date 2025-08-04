import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user with this email exists
    const existingUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    const existingUser = existingUsers[0]

    if (existingUser) {
      return NextResponse.json({
        exists: true,
        userName: `${existingUser.firstName || ''} ${existingUser.lastName || ''}`.trim() || 'Okänd användare'
      })
    }

    return NextResponse.json({
      exists: false
    })

  } catch (error) {
    console.error('Error checking email:', error)
    return NextResponse.json(
      { error: 'Failed to check email' },
      { status: 500 }
    )
  }
}
