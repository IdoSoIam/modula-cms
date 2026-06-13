import { BUNDLED_SYSTEM_SITE_TEMPLATES, type BundledSystemSiteTemplateKey } from '#modula/shared/siteTemplates'
import {
  canManageSystemRegistryTemplates,
  createRegistryTemplateFromSnapshot,
  getRegistryTemplate,
  publishRegistryTemplateVersion,
  updateRegistryTemplateFromSnapshot
} from '#modula/server/utils/cmsRegistry'
import { buildBundledSystemTemplateSnapshot } from '#modula/server/utils/siteTemplates'

function readBearerToken(value: string | undefined) {
  if (!value) return ''
  const match = value.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || ''
}

export default defineEventHandler(async (event) => {
  if (!canManageSystemRegistryTemplates()) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'La gestion des templates système n’est pas activée sur cette instance.'
    })
  }

  const providedToken = readBearerToken(getHeader(event, 'authorization'))
  const expectedTokens = [
    process.env.CMS_SYSTEM_TEMPLATES_REGISTRY_API_KEY?.trim(),
    process.env.CMS_REGISTRY_API_KEY?.trim()
  ].filter((value): value is string => Boolean(value))

  if (!providedToken || !expectedTokens.includes(providedToken)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentification requise.'
    })
  }

  const results: Array<{
    slug: string
    action: 'created' | 'updated'
    versionId: string | null
    versionNumber: number | null
  }> = []

  for (const definition of BUNDLED_SYSTEM_SITE_TEMPLATES) {
    const snapshot = await buildBundledSystemTemplateSnapshot(definition.key as BundledSystemSiteTemplateKey)
    const previewAsset = snapshot.assetManifest.find((asset) => asset.sourceUrl === definition.previewImage)
    const metadata = {
      slug: definition.key,
      label: definition.label,
      description: definition.description,
      icon: definition.icon,
      previewImage: previewAsset?.publicUrl || previewAsset?.downloadUrl || definition.previewImage,
      highlights: definition.highlights,
      themeNames: definition.themeNames
    }

    try {
      await getRegistryTemplate(definition.key, 'system')
      const updated = await updateRegistryTemplateFromSnapshot(definition.key, metadata, snapshot, 'system')
      const latestVersion = [...(updated.versions || [])].sort((a, b) => a.versionNumber - b.versionNumber).at(-1) || null
      if (!latestVersion) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Registry version error',
          message: `Impossible de déterminer la dernière version du template ${definition.key}.`
        })
      }
      await publishRegistryTemplateVersion(definition.key, latestVersion.id, 'system')
      results.push({
        slug: definition.key,
        action: 'updated',
        versionId: latestVersion.id,
        versionNumber: latestVersion.versionNumber
      })
    } catch (error: any) {
      if (error?.statusCode && error.statusCode !== 404) {
        throw error
      }
      const created = await createRegistryTemplateFromSnapshot(metadata, snapshot, 'system')
      results.push({
        slug: definition.key,
        action: 'created',
        versionId: created.currentVersionId,
        versionNumber: created.currentVersionNumber
      })
    }
  }

  return {
    ok: true,
    results
  }
})
