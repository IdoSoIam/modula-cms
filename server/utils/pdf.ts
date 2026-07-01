import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { getCurrentCmsRuntimeTarget } from '#modula/server/utils/settings'

export interface InvoicePdfLine {
  lineNumberLabel: string
  title: string
  referenceLabel: string
  description?: string | null
  quantity: number
  unitPriceExclTaxLabel: string
  totalPriceExclTaxLabel: string
  vatAmountLabel: string
  vatRateLabel?: string | null
  totalPriceInclTaxLabel: string
  values?: Record<string, string>
}

export interface InvoicePdfColumn {
  key: string
  label: string
}

export interface BrandedDocumentPdfSection {
  title?: string | null
  lines: string[]
}

export interface BrandedDocumentPdfOptions {
  title: string
  brandName: string
  accentColor?: string | null
  documentNumber?: string | null
  documentDateLabel?: string | null
  statusLabel?: string | null
  sellerTitle?: string | null
  sellerLines?: string[]
  customerTitle?: string | null
  customerLines?: string[]
  metaLines?: string[]
  sections: BrandedDocumentPdfSection[]
  footer?: string | null
  logoBytes?: Uint8Array | null
  logoMimeType?: string | null
}

export interface InvoicePdfOptions {
  title: string
  brandName: string
  accentColor?: string | null
  invoiceNumber: string
  invoiceDateLabel: string
  paymentStatusLabel?: string | null
  sellerTitle?: string | null
  sellerLines: string[]
  customerTitle?: string | null
  customerLines: string[]
  metaLines?: string[]
  columns?: InvoicePdfColumn[]
  lines: InvoicePdfLine[]
  subtotalExclTaxLabel: string
  totalVatLabel: string
  totalInclTaxLabel: string
  taxRows?: Array<{
    label: string
    amountLabel: string
  }>
  footer?: string | null
  notes?: string | null
  logoBytes?: Uint8Array | null
  logoMimeType?: string | null
  labels?: {
    notesTitle?: string | null
    noNotes?: string | null
    totalsTitle?: string | null
    totalHt?: string | null
    totalVat?: string | null
    totalTtc?: string | null
    emptyLines?: string | null
    page?: string | null
  }
}

type ChromiumModule = {
  chromium: {
    launch: (options: Record<string, any>) => Promise<{
      newPage: () => Promise<{
        setContent: (html: string, options?: Record<string, any>) => Promise<void>
        emulateMedia: (options: Record<string, any>) => Promise<void>
        pdf: (options?: Record<string, any>) => Promise<Buffer>
        close: () => Promise<void>
      }>
      close: () => Promise<void>
    }>
  }
}

interface ExternalPdfPartyPayload {
  title?: string
  lines: string[]
}

interface ExternalPdfSectionPayload {
  title?: string | null
  lines: string[]
}

interface ExternalInvoicePdfPayload {
  kind: 'invoice'
  title: string
  filename?: string
  documentTitle: string
  documentNumber: string
  issuedAt: string
  statusLabel?: string | null
  logoDataUri?: string
  seller: {
    title?: string
    name?: string
    email?: string
    address?: string
    city?: string
  }
  customer: {
    name?: string
    email?: string
    phone?: string
    address?: string
  }
  columns?: Array<{
    key: string
    label: string
  }>
  items: Array<{
    values?: Record<string, string>
    name: string
    description?: string | null
  }>
  totals: {
    subtotalHtLabel: string
    totalVatLabel: string
    grandTotalLabel: string
    taxRows?: Array<{
      label: string
      amountLabel: string
    }>
  }
  notes?: string | null
  footer?: string | null
  labels?: {
    notesTitle?: string | null
    noNotes?: string | null
    totalsTitle?: string | null
    totalHt?: string | null
    totalVat?: string | null
    totalTtc?: string | null
    emptyLines?: string | null
    page?: string | null
  }
}

interface ExternalBrandedDocumentPdfPayload {
  kind: 'document'
  title: string
  filename?: string
  documentTitle: string
  documentNumber: string
  issuedAt: string
  statusLabel?: string | null
  logoDataUri?: string
  seller: ExternalPdfPartyPayload
  customer: ExternalPdfPartyPayload
  metaLines?: string[]
  sections: ExternalPdfSectionPayload[]
  footer?: string | null
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeColor(value: string | null | undefined, fallback = '#4b56d2') {
  const normalized = String(value || '').trim()
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized : fallback
}

function textToParagraphs(value: string | null | undefined) {
  return String(value || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

function bytesToDataUri(bytes?: Uint8Array | null, mimeType?: string | null) {
  if (!bytes?.length || !mimeType?.trim()) return ''
  return `data:${mimeType};base64,${Buffer.from(bytes).toString('base64')}`
}

function getExternalPdfServiceUrl() {
  return process.env.CMS_PDF_SERVICE_URL?.trim() || ''
}

async function renderExternalPdf(payload: ExternalInvoicePdfPayload | ExternalBrandedDocumentPdfPayload) {
  const baseUrl = getExternalPdfServiceUrl()
  if (!baseUrl) return null

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/render`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw createError({
      statusCode: 503,
      statusMessage: 'External PDF service failed',
      message: await response.text(),
    })
  }

  return Buffer.from(await response.arrayBuffer())
}

async function importPlaywright() {
  const dynamicImporter = new Function('specifier', 'return import(specifier)')
  return await dynamicImporter('playwright-core') as ChromiumModule
}

function getChromiumExecutableCandidates() {
  const envPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim()
  const candidates = envPath ? [envPath] : []

  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || ''
    const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files'
    const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)'
    candidates.push(
      path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    )
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    )
  } else {
    candidates.push(
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/snap/bin/chromium',
      '/usr/bin/microsoft-edge',
    )
  }

  return Array.from(new Set(candidates.filter(Boolean)))
}

function resolveChromiumExecutablePath() {
  return getChromiumExecutableCandidates().find(candidate => existsSync(candidate)) || ''
}

function buildDocumentCss(accentColor: string) {
  return `
    :root {
      --accent: ${accentColor};
      --accent-soft: color-mix(in srgb, ${accentColor} 12%, white);
      --text: #18212f;
      --muted: #627086;
      --border: #d9deea;
      --panel: #f7f9fc;
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      font-family: Inter, "Segoe UI", Arial, sans-serif;
      color: var(--text);
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @page {
      size: A4;
      margin: 10mm 10mm 18mm 10mm;
    }

    body {
      padding: 24px 28px 68px;
      font-size: 12px;
      line-height: 1.45;
    }

    .document {
      width: 100%;
    }

    .document-main {
      width: 100%;
    }

    .document-topbar {
      height: 4px;
      border-radius: 2px;
      background: var(--accent);
      margin-bottom: 20px;
    }

    .header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 24px;
      align-items: start;
      margin-bottom: 22px;
    }

    .header-brand {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      min-width: 0;
    }

    .logo {
      width: 82px;
      max-height: 62px;
      object-fit: contain;
      object-position: left center;
      flex: 0 0 auto;
    }

    .brand-copy {
      min-width: 0;
    }

    .brand-name {
      margin: 0;
      font-size: 29px;
      line-height: 1.08;
      font-weight: 800;
    }

    .document-title {
      margin: 8px 0 0;
      font-size: 15px;
      color: var(--muted);
      font-weight: 600;
    }

    .identity {
      text-align: right;
      min-width: 220px;
    }

    .identity-title {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: var(--accent);
    }

    .identity-meta {
      margin-top: 8px;
      color: var(--muted);
      font-size: 11px;
      line-height: 1.5;
    }

    .identity-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 4px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 11px;
      font-weight: 700;
      margin-top: 10px;
    }

    .party-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
      margin-bottom: 18px;
    }

    .party-card {
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 16px 18px;
      background: white;
      min-height: 112px;
    }

    .party-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
      font-weight: 700;
      margin-bottom: 10px;
    }

    .party-line {
      margin: 0 0 4px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .meta-block {
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 12px 16px;
      background: var(--panel);
      margin-bottom: 18px;
    }

    .meta-line {
      margin: 0 0 4px;
      color: var(--muted);
    }

    .invoice-table {
      border: 1px solid var(--border);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 18px;
    }

    .invoice-table table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .invoice-table col.col-line-number { width: 5%; }
    .invoice-table col.col-designation { width: 27%; }
    .invoice-table col.col-reference { width: 8%; }
    .invoice-table col.col-quantity { width: 6%; }
    .invoice-table col.col-unit-ht { width: 10%; }
    .invoice-table col.col-total-ht { width: 10%; }
    .invoice-table col.col-vat-amount { width: 10%; }
    .invoice-table col.col-vat-rate { width: 11%; }
    .invoice-table col.col-total-ttc { width: 13%; }

    .invoice-table thead th {
      background: var(--panel);
      color: var(--muted);
      text-align: right;
      font-size: 10px;
      font-weight: 700;
      padding: 10px 8px;
      border-bottom: 1px solid var(--border);
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .invoice-table thead th.designation {
      text-align: left;
    }

    .invoice-table thead th:first-child,
    .invoice-table tbody td:first-child {
      padding-left: 6px;
      padding-right: 6px;
    }

    .invoice-table tbody td {
      padding: 10px 8px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .invoice-table tbody tr:last-child td {
      border-bottom: none;
    }

    .line-title {
      font-size: 13px;
      font-weight: 700;
      margin: 0;
    }

    .line-description {
      margin: 5px 0 0;
      color: var(--muted);
      font-size: 11px;
      white-space: pre-wrap;
    }

    .numeric {
      text-align: right;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .line-number,
    .line-reference {
      color: var(--muted);
      font-variant-numeric: tabular-nums;
    }

    .summary {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 280px;
      gap: 24px;
      align-items: start;
      margin-bottom: 18px;
    }

    .notes-card,
    .summary-card,
    .section-card {
      border: 1px solid var(--border);
      border-radius: 4px;
      background: white;
      overflow: hidden;
    }

    .section-heading {
      padding: 12px 16px;
      background: var(--panel);
      border-bottom: 1px solid var(--border);
      color: var(--text);
      font-size: 12px;
      font-weight: 700;
    }

    .section-body {
      padding: 16px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 9px 0;
      border-bottom: 1px solid var(--border);
    }

    .summary-row:last-child {
      border-bottom: none;
    }

    .summary-row.total {
      font-size: 15px;
      font-weight: 800;
      color: var(--accent);
    }

    .section {
      margin-bottom: 16px;
    }

    .section:last-child {
      margin-bottom: 0;
    }

    .section-card + .section-card {
      margin-top: 14px;
    }

    .section-paragraph {
      margin: 0 0 10px;
      white-space: pre-wrap;
    }

    .section-paragraph:last-child {
      margin-bottom: 0;
    }

    .footer {
      position: fixed;
      left: 28px;
      right: 28px;
      bottom: 14px;
      padding-top: 10px;
      border-top: 1px solid var(--border);
      color: var(--muted);
      font-size: 10px;
      white-space: pre-wrap;
      background: white;
    }
  `
}

function wrapHtmlDocument(title: string, body: string, accentColor: string) {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(title)}</title>
    <style>${buildDocumentCss(accentColor)}</style>
  </head>
  <body>
    <div class="document">${body}</div>
  </body>
</html>`
}

function renderHeader(options: {
  brandName: string
  title: string
  metaTitle: string
  metaLines: string[]
  statusLabel?: string | null
  logoDataUri?: string
}) {
  const metaHtml = options.metaLines
    .filter(Boolean)
    .map(line => `<div>${escapeHtml(line)}</div>`)
    .join('')

  return `
    <div class="document-topbar"></div>
    <header class="header">
      <div class="header-brand">
        ${options.logoDataUri ? `<img class="logo" src="${options.logoDataUri}" alt="${escapeHtml(options.brandName)}">` : ''}
        <div class="brand-copy">
          <h1 class="brand-name">${escapeHtml(options.brandName)}</h1>
          <div class="document-title">${escapeHtml(options.title)}</div>
        </div>
      </div>
      <div class="identity">
        <p class="identity-title">${escapeHtml(options.metaTitle)}</p>
        <div class="identity-meta">${metaHtml}</div>
        ${options.statusLabel ? `<div class="identity-status">${escapeHtml(options.statusLabel)}</div>` : ''}
      </div>
    </header>
  `
}

function renderPartyCard(title: string, lines: string[]) {
  const content = (lines || [])
    .filter(Boolean)
    .map(line => `<p class="party-line">${escapeHtml(line)}</p>`)
    .join('')

  return `
    <section class="party-card">
      <div class="party-title">${escapeHtml(title)}</div>
      ${content}
    </section>
  `
}

function renderPartyGrid(options: {
  sellerTitle?: string | null
  sellerLines?: string[]
  customerTitle?: string | null
  customerLines?: string[]
}) {
  return `
    <section class="party-grid">
      ${renderPartyCard(options.sellerTitle || 'Emetteur', options.sellerLines || [])}
      ${renderPartyCard(options.customerTitle || 'Client', options.customerLines || [])}
    </section>
  `
}

function renderMetaBlock(lines?: string[]) {
  const filtered = (lines || []).filter(Boolean)
  if (!filtered.length) return ''

  return `
    <section class="meta-block">
      ${filtered.map(line => `<p class="meta-line">${escapeHtml(line)}</p>`).join('')}
    </section>
  `
}

function renderInvoiceTable(lines: InvoicePdfLine[]) {
  const rows = lines.map(line => `
      <tr>
        <td class="numeric line-number">${escapeHtml(line.lineNumberLabel)}</td>
        <td>
          <p class="line-title">${escapeHtml(line.title)}</p>
          ${line.description ? `<p class="line-description">${escapeHtml(line.description)}</p>` : ''}
        </td>
        <td class="numeric line-reference">${escapeHtml(line.referenceLabel)}</td>
        <td class="numeric">${escapeHtml(line.quantity)}</td>
        <td class="numeric">${escapeHtml(line.unitPriceExclTaxLabel)}</td>
        <td class="numeric">${escapeHtml(line.totalPriceExclTaxLabel)}</td>
        <td class="numeric">${escapeHtml(line.vatAmountLabel)}</td>
        <td class="numeric">${escapeHtml(line.vatRateLabel || '-')}</td>
        <td class="numeric"><strong>${escapeHtml(line.totalPriceInclTaxLabel)}</strong></td>
      </tr>
    `).join('')

  return `
    <section class="invoice-table">
      <table>
        <colgroup>
          <col class="col-line-number">
          <col class="col-designation">
          <col class="col-reference">
          <col class="col-quantity">
          <col class="col-unit-ht">
          <col class="col-total-ht">
          <col class="col-vat-amount">
          <col class="col-vat-rate">
          <col class="col-total-ttc">
        </colgroup>
        <thead>
          <tr>
            <th class="numeric">N°</th>
            <th class="designation">Désignation</th>
            <th class="numeric">Réf.</th>
            <th class="numeric">Qté</th>
            <th class="numeric">PU HT</th>
            <th class="numeric">Total HT</th>
            <th class="numeric">TVA Montant</th>
            <th class="numeric">TVA</th>
            <th class="numeric">Total TTC</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `
}

function renderSummaryCard(options: {
  subtotalExclTaxLabel: string
  totalVatLabel: string
  totalInclTaxLabel: string
  taxRows?: Array<{ label: string, amountLabel: string }>
}) {
  const taxRows = (options.taxRows || []).map(group => `
      <div class="summary-row">
        <span>${escapeHtml(group.label)}</span>
        <span>${escapeHtml(group.amountLabel)}</span>
      </div>
    `).join('')

  return `
    <section class="summary-card">
      <div class="section-heading">Totaux</div>
      <div class="section-body">
        <div class="summary-row">
          <span>Total HT</span>
          <span>${escapeHtml(options.subtotalExclTaxLabel)}</span>
        </div>
        ${taxRows}
        <div class="summary-row">
          <span>Total TVA</span>
          <span>${escapeHtml(options.totalVatLabel)}</span>
        </div>
        <div class="summary-row total">
          <span>Total TTC</span>
          <span>${escapeHtml(options.totalInclTaxLabel)}</span>
        </div>
      </div>
    </section>
  `
}

function renderNotesCard(notes?: string | null) {
  const paragraphs = textToParagraphs(notes)
  if (!paragraphs.length) return ''

  return `
    <section class="notes-card">
      <div class="section-heading">Notes</div>
      <div class="section-body">
        ${paragraphs.map(line => `<p class="section-paragraph">${escapeHtml(line)}</p>`).join('')}
      </div>
    </section>
  `
}

function renderSectionCards(sections: BrandedDocumentPdfSection[]) {
  return sections
    .filter(section => section.title?.trim() || section.lines.some(line => String(line || '').trim()))
    .map(section => `
      <section class="section-card">
        <div class="section-heading">${escapeHtml(section.title?.trim() || 'Contenu')}</div>
        <div class="section-body">
          ${section.lines
            .filter(line => String(line || '').trim())
            .map(line => `<p class="section-paragraph">${escapeHtml(line)}</p>`)
            .join('')}
        </div>
      </section>
    `)
    .join('')
}

function renderFooter(footer?: string | null) {
  const text = String(footer || '').trim()
  if (!text) return ''
  return `<footer class="footer">${escapeHtml(text)}</footer>`
}

async function renderHtmlToPdf(html: string) {
  if (getCurrentCmsRuntimeTarget() !== 'server') {
    throw createError({
      statusCode: 503,
      statusMessage: 'PDF unavailable on Cloudflare runtime',
      message: 'La generation PDF HTML est disponible uniquement sur le runtime Node.'
    })
  }

  const playwright = await importPlaywright()
  const executablePath = resolveChromiumExecutablePath()

  if (!executablePath) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Chromium executable not found',
      message: process.platform === 'win32'
        ? 'Aucun navigateur Chromium n a ete detecte. Installez Chrome ou Edge, ou renseignez PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.'
        : 'Aucun navigateur Chromium n a ete detecte. Installez chromium ou google-chrome, ou renseignez PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.'
    })
  }

  const browser = await playwright.chromium.launch({
    executablePath,
    headless: true,
    args: ['--disable-dev-shm-usage', '--font-render-hinting=medium', '--no-sandbox']
  })

  try {
    const page = await browser.newPage()
    try {
      await page.setContent(html, { waitUntil: 'networkidle' })
      await page.emulateMedia({ media: 'screen' })
      return await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '12mm',
          left: '10mm'
        }
      })
    } finally {
      await page.close()
    }
  } finally {
    await browser.close()
  }
}

export async function buildBrandedDocumentPdf(options: BrandedDocumentPdfOptions) {
  const externalPdf = await renderExternalPdf({
    kind: 'document',
    title: options.title,
    filename: `${options.title || 'document'}.pdf`,
    documentTitle: options.title,
    documentNumber: options.documentNumber || options.title,
    issuedAt: options.documentDateLabel || '',
    statusLabel: options.statusLabel,
    logoDataUri: bytesToDataUri(options.logoBytes, options.logoMimeType),
    seller: {
      title: options.sellerTitle || 'Emetteur',
      lines: options.sellerLines || [],
    },
    customer: {
      title: options.customerTitle || 'Client',
      lines: options.customerLines || [],
    },
    metaLines: options.metaLines || [],
    sections: options.sections,
    footer: options.footer,
  })

  if (externalPdf) {
    return externalPdf
  }

  const accentColor = normalizeColor(options.accentColor)
  const logoDataUri = bytesToDataUri(options.logoBytes, options.logoMimeType)
  const body = `
    <div class="document-main">
      ${renderHeader({
        brandName: options.brandName,
        title: options.title,
        metaTitle: options.documentNumber || options.title,
        metaLines: [options.documentDateLabel || ''].filter(Boolean),
        statusLabel: options.statusLabel,
        logoDataUri
      })}
      ${renderPartyGrid({
        sellerTitle: options.sellerTitle,
        sellerLines: options.sellerLines,
        customerTitle: options.customerTitle,
        customerLines: options.customerLines
      })}
      ${renderMetaBlock(options.metaLines)}
      ${renderSectionCards(options.sections)}
    </div>
    ${renderFooter(options.footer)}
  `

  return Buffer.from(await renderHtmlToPdf(wrapHtmlDocument(options.title, body, accentColor)))
}

export async function buildInvoicePdf(options: InvoicePdfOptions) {
  const externalPdf = await renderExternalPdf({
    kind: 'invoice',
    title: options.title,
    filename: `${options.invoiceNumber || 'invoice'}.pdf`,
    documentTitle: options.title,
    documentNumber: options.invoiceNumber,
    issuedAt: options.invoiceDateLabel,
    statusLabel: options.paymentStatusLabel,
    logoDataUri: bytesToDataUri(options.logoBytes, options.logoMimeType),
    seller: {
      title: options.sellerTitle || 'Emetteur',
      name: options.sellerLines[0] || '',
      email: options.sellerLines[1] || '',
      address: options.sellerLines[2] || '',
      city: options.sellerLines.slice(3).join('\n'),
    },
    customer: {
      name: options.customerLines[0] || '',
      email: options.customerLines[1] || '',
      phone: options.customerLines[2] || '',
      address: options.customerLines.slice(3).join('\n'),
    },
    columns: options.columns,
    items: options.lines.map(line => ({
      values: line.values,
      name: line.title,
      description: line.description,
    })),
    totals: {
      subtotalHtLabel: options.subtotalExclTaxLabel,
      totalVatLabel: options.totalVatLabel,
      grandTotalLabel: options.totalInclTaxLabel,
      taxRows: options.taxRows,
    },
    notes: options.notes,
    footer: options.footer,
    labels: options.labels,
  })

  if (externalPdf) {
    return externalPdf
  }

  const accentColor = normalizeColor(options.accentColor)
  const logoDataUri = bytesToDataUri(options.logoBytes, options.logoMimeType)
  const body = `
    <div class="document-main">
      ${renderHeader({
        brandName: options.brandName,
        title: options.title,
        metaTitle: options.invoiceNumber,
        metaLines: [options.invoiceDateLabel].filter(Boolean),
        statusLabel: options.paymentStatusLabel,
        logoDataUri
      })}
      ${renderPartyGrid({
        sellerTitle: options.sellerTitle || 'Emetteur',
        sellerLines: options.sellerLines,
        customerTitle: options.customerTitle || 'Client',
        customerLines: options.customerLines
      })}
      ${renderMetaBlock(options.metaLines)}
      ${renderInvoiceTable(options.lines)}
      <section class="summary">
        <div>
          ${renderNotesCard(options.notes)}
        </div>
        <div>
          ${renderSummaryCard({
            subtotalExclTaxLabel: options.subtotalExclTaxLabel,
            totalVatLabel: options.totalVatLabel,
            totalInclTaxLabel: options.totalInclTaxLabel,
            taxRows: options.taxRows
          })}
        </div>
      </section>
    </div>
    ${renderFooter(options.footer)}
  `

  return Buffer.from(await renderHtmlToPdf(wrapHtmlDocument(options.title, body, accentColor)))
}

export function getPdfRuntimeDiagnostics() {
  return {
    runtimeTarget: getCurrentCmsRuntimeTarget(),
    executablePath: resolveChromiumExecutablePath(),
    hostPlatform: process.platform,
    hostArch: os.arch()
  }
}
