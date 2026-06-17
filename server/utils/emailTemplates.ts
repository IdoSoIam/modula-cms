function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderInlineText(value: string) {
  const parts = value.split(/(https?:\/\/[^\s<]+)/g)

  return parts.map((part) => {
    if (/^https?:\/\//.test(part)) {
      const safeUrl = escapeHtml(part)
      return `<a href="${safeUrl}" style="color:#2563eb;text-decoration:underline;word-break:break-all;">${safeUrl}</a>`
    }

    return escapeHtml(part)
  }).join('')
}

function formatBodyToHtml(body: string) {
  const blocks = body.trim().split(/\n\s*\n/)

  return blocks.map((block) => {
    const lines = block.split('\n').map((line) => line.trimEnd())
    const listItems = lines.filter((line) => /^-\s+/.test(line))

    if (listItems.length === lines.length) {
      return `<ul style="margin:0;padding-left:20px;color:#374151;">${listItems
        .map((line) => `<li style="margin:0 0 6px 0;">${renderInlineText(line.replace(/^-\s+/, ''))}</li>`)
        .join('')}</ul>`
    }

    return `<p style="margin:0 0 16px 0;color:#374151;line-height:1.7;">${lines.map(renderInlineText).join('<br>')}</p>`
  }).join('')
}

export function buildEmailHtml(options: {
  title: string
  preheader?: string
  body: string
  accent?: string
  logoUrl?: string | null
  brandName?: string
  footer?: string
  lang?: string
  statusLabel?: string
  statusColor?: string
}) {
  const accent = options.accent ?? '#5d7c2f'
  const brandName = options.brandName?.trim() || 'Modula CMS'
  const footer = options.footer ?? brandName
  const preheader = options.preheader ?? options.title
  const lang = options.lang ?? 'fr'
  const statusPill = options.statusLabel
    ? `<div style="display:inline-block;margin:0 0 16px 0;padding:6px 10px;border-radius:999px;background:${escapeHtml(options.statusColor || '#e5e7eb')};color:#111827;font-size:12px;font-weight:700;line-height:1;">${escapeHtml(options.statusLabel)}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(options.title)}</title>
  </head>
  <body style="margin:0;padding:24px;background:#f6f3ea;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;">
      <tr>
        <td style="padding:0;">
          <div style="background:linear-gradient(135deg, ${accent}, #1f2937);border-radius:24px 24px 0 0;padding:28px 32px;color:#fff;">
            ${options.logoUrl ? `<img src="${escapeHtml(options.logoUrl)}" alt="${escapeHtml(brandName)}" style="display:block;height:56px;max-width:160px;object-fit:contain;margin-bottom:18px;" />` : ''}
            <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.8;">${escapeHtml(brandName)}</div>
            <h1 style="margin:10px 0 0 0;font-size:28px;line-height:1.2;font-weight:700;">${escapeHtml(options.title)}</h1>
          </div>
          <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 24px 24px;padding:32px;">
            ${statusPill}
            ${formatBodyToHtml(options.body)}
            <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:13px;line-height:1.6;">
              ${escapeHtml(footer)}
            </div>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
