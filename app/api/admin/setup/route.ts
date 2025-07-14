import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'

// This endpoint is for development/setup purposes only
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // If user exists, update their role to ADMIN
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' }
      })

      return NextResponse.json({
        message: 'User role updated to ADMIN',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role
        }
      })
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(password, 12)
    
    const adminUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
        verified: true
      }
    })

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      }
    })
  } catch (error) {
    console.error('Admin setup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to setup admin user' },
      { status: 500 }
    )
  }
}