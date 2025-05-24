import { PrismaClient } from '@prisma/client'
import { H3Event } from 'h3'
import * as bcrypt from 'bcrypt'
import { getSessionConfig } from '../../utils/session'

const prisma = new PrismaClient()

export class AuthService {
  private static SALT_ROUNDS = 10
  async createUser(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    birthDate?: Date,
    role: string = 'user'
  ): Promise<{ id: number; email: string; firstName?: string; lastName?: string; role: string }> {
    try {
      const hashedPassword = await bcrypt.hash(password, AuthService.SALT_ROUNDS)
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          birthDate,
          role
        },        
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          street: true,
          city: true,
          postalCode: true,
          country: true
        }
      })
      return {
        ...user,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined
      }
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }
  async validateUser(email: string, password: string): Promise<{ 
    id: number; 
    email: string; 
    firstName?: string; 
    lastName?: string; 
    role: string;
    shippingAddress?: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    }
  } | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          password: true,
          street: true,
          city: true,
          postalCode: true,
          country: true
        }
      })

      if (!user) {
        return null
      }

      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) {
        return null
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        role: user.role,
        shippingAddress: user.street && user.city && user.postalCode && user.country ? {
          street: user.street,
          city: user.city,
          postalCode: user.postalCode,
          country: user.country
        } : undefined
      }
    } catch (error) {
      console.error('Error validating user:', error)
      throw error
    }
  }async getUserFromSession(event: H3Event): Promise<{ 
    id: number; 
    email: string; 
    firstName?: string; 
    lastName?: string; 
    role: string;
    shippingAddress?: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    }
  } | null> {
    const session = await useSession(event, getSessionConfig())
    const userId = session.data.userId

    if (!userId) {
      return null
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          street: true,
          city: true,
          postalCode: true,
          country: true
        }
      })
      
      if (!user) {
        return null
      }

      // Format the response to match the expected structure
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        role: user.role,
        shippingAddress: user.street && user.city && user.postalCode && user.country ? {
          street: user.street,
          city: user.city,
          postalCode: user.postalCode,
          country: user.country
        } : undefined
      }
    } catch (error) {
      console.error('Error getting user from session:', error)
      return null
    }
  }

  async isAdmin(event: H3Event): Promise<boolean> {
    const user = await this.getUserFromSession(event)
    return user?.role === 'admin'
  }
  async updateProfile(userId: number, data: {
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<{ 
    id: number; 
    email: string; 
    firstName?: string; 
    lastName?: string; 
    role: string;
    shippingAddress?: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    }
  }> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          street: true,
          city: true,
          postalCode: true,
          country: true
        }
      })

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        role: user.role,
        shippingAddress: user.street && user.city && user.postalCode && user.country ? {
          street: user.street,
          city: user.city,
          postalCode: user.postalCode,
          country: user.country
        } : undefined
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  async updateShippingAddress(userId: number, data: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postalCode: string;
    country: string;
  }): Promise<{ 
    id: number; 
    email: string; 
    firstName?: string; 
    lastName?: string; 
    role: string;
    shippingAddress?: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    }
  }> {
    try {
      const street = data.addressLine2 
        ? `${data.addressLine1}, ${data.addressLine2}`
        : data.addressLine1

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          street,
          city: data.city,
          postalCode: data.postalCode,
          country: data.country
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          street: true,
          city: true,
          postalCode: true,
          country: true
        }
      })

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        role: user.role,
        shippingAddress: user.street && user.city && user.postalCode && user.country ? {
          street: user.street,
          city: user.city,
          postalCode: user.postalCode,
          country: user.country
        } : undefined
      }
    } catch (error) {
      console.error('Error updating shipping address:', error)
      throw error
    }
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
      })

      if (!user) {
        throw createError({
          statusCode: 404,
          statusMessage: 'User not found'
        })
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
      if (!isCurrentPasswordValid) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Current password is incorrect'
        })
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, AuthService.SALT_ROUNDS)
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      })
    } catch (error) {
      console.error('Error changing password:', error)
      throw error
    }
  }

  async deleteAccount(userId: number, password: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
      })

      if (!user) {
        throw createError({
          statusCode: 404,
          statusMessage: 'User not found'
        })
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Password is incorrect'
        })
      }

      // In a real implementation, you might want to:
      // 1. Cancel all pending orders
      // 2. Archive user data instead of deleting
      // 3. Send confirmation email
      
      await prisma.user.delete({
        where: { id: userId }
      })
    } catch (error) {
      console.error('Error deleting account:', error)
      throw error
    }
  }
}
