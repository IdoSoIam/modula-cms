import type { HomePageContent } from '~/shared/homePage'
import { requireAdmin } from '~/server/utils/requireAdmin'
import { getHomePageContent, saveHomePageContent } from '~/server/utils/homePage'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const content = await getHomePageContent()

  // Réinitialiser les couleurs de fond des sections en alternance (base-100, base-200)
  // et supprimer les couleurs personnalisées
  const resetContent: HomePageContent = {
    ...content,
    sections: content.sections.map((section, index) => ({
      ...section,
      // Alternance base-100 / base-200 selon l'index
      tone: index % 2 === 0 ? 'base-100' : 'base-200',
      // Supprimer les couleurs personnalisées de fond
      backgroundColor: null,
      // Supprimer les couleurs personnalisées des colonnes
      ...(section.type === 'two-columns' ? {
        columns: section.columns.map(col => {
          if (col.type === 'content') {
            return {
              ...col,
              textColor: null
            }
          }
          return col
        }) as [typeof section.columns[0], typeof section.columns[1]]
      } : {
        column: section.column.type === 'content' ? {
          ...section.column,
          textColor: null
        } : section.column
      })
    }))
  }

  await saveHomePageContent(resetContent)

  return { ok: true, message: 'Couleurs réinitialisées avec succès' }
})
