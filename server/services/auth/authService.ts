import { H3Event } from 'h3'
import bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'node:crypto'
import { getSessionConfig } from '../../utils/session'
import { db } from '#modula/server/data/client'
import { buildUserAccessPayload, ensureDefaultRoles } from '#modula/server/utils/permissions'
import type { UserAccessPayload, UserMemberRolePayload } from '#modula/shared/access'
import {
  getRuntimeRoleById,
  getRuntimeRolePermissions,
  getRuntimeUserByEmail,
  getRuntimeUserById,
  getRuntimeUserMemberRoles,
  isRuntimeD1Active
} from '#modula/server/platform/runtimeDb'

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

export interface PasswordSetupTokenValidation {
  email: string
  firstName?: string
  lastName?: string
  expiresAt: Date
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
  const memberRoles = user.memberRoles?.map((entry) => ({
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
    memberRoleIds: memberRoles?.map((entry) => entry.id),
    shippingAddress: user.street && user.city && user.postalCode && user.country ? {
      street: user.street,
      city: user.city,
      postalCode: user.postalCode,
      country: user.country
    } : undefined
  }
}

async function getRuntimeSessionUser(userId: number) {
  const user = await getRuntimeUserById(userId)
  if (!user) return null

  return await getRuntimeAuthenticatedUser(user)
}

async function getRuntimeAuthenticatedUser(user: {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  roleId: number | null
  isActive: number | boolean
  street: string | null
  city: string | null
  postalCode: string | null
  country: string | null
}) {

  const [managedRole, memberRoles] = await Promise.all([
    user.roleId ? getRuntimeRoleById(user.roleId) : Promise.resolve(null),
    getRuntimeUserMemberRoles(user.id)
  ])

  const permissions = managedRole
    ? await getRuntimeRolePermissions(managedRole.id)
    : []

  return {
    ...user,
    isActive: Boolean(user.isActive),
    managedRole: managedRole ? {
      slug: managedRole.slug,
      specialPermissionsJson: managedRole.specialPermissionsJson || '[]',
      permissions: permissions.map((permission) => ({
        module: permission.module,
        canRead: Boolean(permission.canRead),
        canCreate: Boolean(permission.canCreate),
        canUpdate: Boolean(permission.canUpdate),
        canDelete: Boolean(permission.canDelete)
      }))
    } : null,
    memberRoles: memberRoles.map((entry) => ({
      memberRole: {
        id: entry.id,
        slug: entry.slug,
        name: entry.name,
        color: entry.color
      }
    }))
  }
}

export class AuthService {
  private static SALT_ROUNDS = 10
  private static PASSWORD_SETUP_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

  private hashPasswordSetupToken(token: string) {
    return createHash('sha256').update(token).digest('hex')
  }

  private generateOpaquePassword() {
    return randomBytes(32).toString('hex')
  }

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
      const roleRow = await db.role.findFirst({
        where: {
          OR: [
            { slug: role },
            { slug: role === 'user' ? 'utilisateur_public' : role }
          ]
        }
      })
      const user = await db.user.create({
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

  async createInvitedUser(
    email: string,
    firstName?: string,
    lastName?: string,
    birthDate?: Date,
    role: string = 'user'
  ): Promise<{ user: AuthenticatedUser; setupToken: string; expiresAt: Date }> {
    try {
      await ensureDefaultRoles()
      const normalizedEmail = email.trim().toLowerCase()
      const hashedPassword = await bcrypt.hash(this.generateOpaquePassword(), AuthService.SALT_ROUNDS)
      const roleRow = await db.role.findFirst({
        where: {
          OR: [
            { slug: role },
            { slug: role === 'user' ? 'utilisateur_public' : role }
          ]
        }
      })
      const user = await db.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          firstName,
          lastName,
          birthDate,
          role,
          roleId: roleRow?.id ?? null,
          isActive: false
        },
        select: userSelect
      })
      const { token: setupToken, expiresAt } = await this.createPasswordSetupToken(user.id)
      return { user: mapUser(user), setupToken, expiresAt }
    } catch (error) {
      console.error('Error creating invited user:', error)
      throw error
    }
  }

  async createPasswordSetupToken(userId: number, ttlMs?: number): Promise<{ token: string; expiresAt: Date }> {
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + (ttlMs ?? AuthService.PASSWORD_SETUP_TOKEN_TTL_MS))

    await db.$transaction([
      db.passwordSetupToken.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: new Date() }
      }),
      db.passwordSetupToken.create({
        data: {
          userId,
          token: this.hashPasswordSetupToken(token),
          expiresAt
        }
      })
    ])

    return { token, expiresAt }
  }

  async validatePasswordSetupToken(token: string): Promise<PasswordSetupTokenValidation | null> {
    const row = await db.passwordSetupToken.findUnique({
      where: { token: this.hashPasswordSetupToken(token) },
      include: { user: true }
    })

    if (!row || row.usedAt || row.expiresAt <= new Date()) {
      return null
    }

    return {
      email: row.user.email,
      firstName: row.user.firstName ?? undefined,
      lastName: row.user.lastName ?? undefined,
      expiresAt: row.expiresAt
    }
  }

  async setPasswordFromSetupToken(token: string, password: string): Promise<AuthenticatedUser> {
    const normalizedPassword = password.trim()
    if (normalizedPassword.length < 8) {
      throw createError({ statusCode: 400, statusMessage: 'Le mot de passe doit contenir au moins 8 caractères' })
    }

    const row = await db.passwordSetupToken.findUnique({
      where: { token: this.hashPasswordSetupToken(token) },
      include: { user: true }
    })

    if (!row || row.usedAt || row.expiresAt <= new Date()) {
      throw createError({ statusCode: 404, statusMessage: 'Lien de configuration invalide ou expiré' })
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, AuthService.SALT_ROUNDS)
    const consumed = await db.passwordSetupToken.updateMany({
      where: {
        id: row.id,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      data: { usedAt: new Date() }
    })

    if (consumed.count !== 1) {
      throw createError({ statusCode: 404, statusMessage: 'Lien de configuration invalide ou expiré' })
    }

    await db.user.update({
      where: { id: row.userId },
      data: {
        password: hashedPassword,
        isActive: true
      }
    })

    const user = await db.user.findUniqueOrThrow({
      where: { id: row.userId },
      select: userSelect
    })

    return mapUser(user)
  }

  async validateUser(email: string, password: string): Promise<AuthenticatedUser | null> {
    try {
      await ensureDefaultRoles()
      const normalizedEmail = email.trim().toLowerCase()
      if (isRuntimeD1Active()) {
        const runtimeUser = await getRuntimeUserByEmail(normalizedEmail)
        if (!runtimeUser?.password) {
          return null
        }

        const isValid = await bcrypt.compare(password, runtimeUser.password)
        if (!isValid || !runtimeUser.isActive) {
          return null
        }

        return mapUser(await getRuntimeAuthenticatedUser(runtimeUser) as any)
      }

      const user = await db.user.findUnique({
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
    const session = await useSession(event, getSessionConfig(event))
    const userId = session.data.userId

    if (!userId) {
      return null
    }

    try {
      await ensureDefaultRoles()
      if (isRuntimeD1Active()) {
        const runtimeUser = await getRuntimeSessionUser(userId)
        if (!runtimeUser || !runtimeUser.isActive) {
          return null
        }

        return mapUser(runtimeUser as any)
      }

      const user = await db.user.findUnique({
        where: { id: userId },
        select: userSelect
      })

      if (!user || !user.isActive) {
        return null
      }

      return mapUser(user)
    } catch (error) {
      const code = (error as any)?.code
      const message = String((error as any)?.message || '')
      const isPreInstallSchemaMissing = code === 'P2021' || code === 'P2022' || /table\s+main\.(Role|RolePermission|User)\s+does not exist/i.test(message)
      if (!isPreInstallSchemaMissing) {
        console.error('Error getting user from session:', error)
      }
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
      const user = await db.user.update({
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

      const user = await db.user.update({
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
      const user = await db.user.findUnique({
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
      await db.user.update({
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
      const user = await db.user.findUnique({
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

      await db.user.delete({
        where: { id: userId }
      })
    } catch (error) {
      console.error('Error deleting account:', error)
      throw error
    }
  }
}
