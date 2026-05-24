import { H3Event } from 'h3'
import bcrypt from 'bcryptjs'
import { getSessionConfig } from '../../utils/session'
import { prisma } from '../../../prisma/client'
import { buildUserAccessPayload, ensureDefaultRoles } from '~/server/utils/permissions'
import type { UserAccessPayload, UserMemberRolePayload } from '~/shared/access'

export interface AuthenticatedUser {
  id: number
  email: string
  firstName?: string
  lastName?: string
  role: string
  roleId?: number | null
  roleSlug?: string
  isActive: boolean
  access: UserAccessPayload
  memberRoles: UserMemberRolePayload[]
  memberRoleIds: number[]
  shippingAddress?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
}

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  roleId: true,
  isActive: true,
  password: true,
  street: true,
  city: true,
  postalCode: true,
  country: true,
  managedRole: {
    include: {
      permissions: true
    }
  },
  memberRoles: {
    include: {
      memberRole: true
    }
  }
} as const

function mapUser(user: {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  roleId: number | null
  isActive: boolean
  street: string | null
  city: string | null
  postalCode: string | null
  country: string | null
  managedRole: {
    slug: string
    specialPermissionsJson: string
    permissions: Array<{
      module: string
      canRead: boolean
      canCreate: boolean
      canUpdate: boolean
      canDelete: boolean
    }>
  } | null
  memberRoles: Array<{
    memberRole: {
      id: number
      slug: string
      name: string
      color: string | null
    }
  }>
}): AuthenticatedUser {
  const memberRoles = user.memberRoles.map((entry) => ({
    id: entry.memberRole.id,
    slug: entry.memberRole.slug,
    name: entry.memberRole.name,
    color: entry.memberRole.color
  }))
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? undefined,
    lastName: user.lastName ?? undefined,
    role: user.role,
    roleId: user.roleId,
    roleSlug: user.managedRole?.slug || user.role,
    isActive: user.isActive,
    access: buildUserAccessPayload(user as any),
    memberRoles,
    memberRoleIds: memberRoles.map((entry) => entry.id),
    shippingAddress: user.street && user.city && user.postalCode && user.country ? {
      street: user.street,
      city: user.city,
      postalCode: user.postalCode,
      country: user.country
    } : undefined
  }
}

export class AuthService {
  private static SALT_ROUNDS = 10
  async createUser(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    birthDate?: Date,
    role: string = 'user'
  ): Promise<AuthenticatedUser> {
    try {
      await ensureDefaultRoles()
      const normalizedEmail = email.trim().toLowerCase()
      const hashedPassword = await bcrypt.hash(password, AuthService.SALT_ROUNDS)
      const roleRow = await prisma.role.findFirst({
        where: {
          OR: [
            { slug: role },
            { slug: role === 'user' ? 'utilisateur_public' : role }
          ]
        }
      })
      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          firstName,
          lastName,
          birthDate,
          role,
          roleId: roleRow?.id ?? null
        },
        select: userSelect
      })
      return mapUser(user)
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }
  async validateUser(email: string, password: string): Promise<AuthenticatedUser | null> {
    try {
      await ensureDefaultRoles()
      const normalizedEmail = email.trim().toLowerCase()
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: userSelect
      })

      if (!user) {
        return null
      }

      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) {
        return null
      }

      if (!user.isActive) return null

      return mapUser(user)
    } catch (error) {
      console.error('Error validating user:', error)
      throw error
    }
  }

  async getUserFromSession(event: H3Event): Promise<AuthenticatedUser | null> {
    const session = await useSession(event, getSessionConfig())
    const userId = session.data.userId

    if (!userId) {
      return null
    }

    try {
      await ensureDefaultRoles()
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: userSelect
      })

      if (!user || !user.isActive) {
        return null
      }

      return mapUser(user)
    } catch (error) {
      console.error('Error getting user from session:', error)
      return null
    }
  }

  async isAdmin(event: H3Event): Promise<boolean> {
    const user = await this.getUserFromSession(event)
    return user?.access.isAdmin === true
  }

  async updateProfile(userId: number, data: {
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<AuthenticatedUser> {
    try {
      const normalizedEmail = data.email.trim().toLowerCase()
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: normalizedEmail
        },
        select: userSelect
      })

      return mapUser(user)
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
  }): Promise<AuthenticatedUser> {
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
        select: userSelect
      })

      return mapUser(user)
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
