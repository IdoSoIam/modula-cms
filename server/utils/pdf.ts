import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  getCurrentCmsRuntimeTarget,
  getStoredPdfRendererMode,
  type PdfRendererMode,
} from '#modula/server/utils/settings'

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
  vatNote?: string | null
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
    title?: string
    name?: string
    email?: string
    phone?: string
    address?: string
  }
  metaLines?: string[]
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
  vatNote?: string | null
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

function getExternalPdfServiceApiKey() {
  return process.env.CMS_PDF_SERVICE_API_KEY?.trim() || ''
}

function canUseLocalBrowserPdf() {
  return getCurrentCmsRuntimeTarget() === 'server' && Boolean(resolveChromiumExecutablePath())
}

async function resolvePdfRendererMode(): Promise<PdfRendererMode> {
  if (getCurrentCmsRuntimeTarget() === 'cloudflare') {
    return 'external'
  }

  const storedMode = await getStoredPdfRendererMode()
  if (storedMode) {
    return storedMode
  }

  return canUseLocalBrowserPdf() ? 'local' : 'external'
}

async function renderExternalPdf(payload: ExternalInvoicePdfPayload | ExternalBrandedDocumentPdfPayload) {
  const baseUrl = getExternalPdfServiceUrl()
  if (!baseUrl) return null
  const apiKey = getExternalPdfServiceApiKey()

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/render`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(apiKey ? { 'x-modula-pdf-key': apiKey } : {}),
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

function buildBrowserFooterTemplate(options: {
  documentNumber?: string | null
  footer?: string | null
  pageLabel?: string | null
}) {
  const documentNumber = escapeHtml(String(options.documentNumber || '').trim())
  const footer = escapeHtml(String(options.footer || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
  const pageLabel = escapeHtml(String(options.pageLabel || '').trim() || 'Page')

  return `
    <div style="width:100%; font-family: Inter, 'Segoe UI', Arial, sans-serif; font-size:8px; color:#627086; padding:0 24px 0; box-sizing:border-box;">
      <div style="border-top:1px solid #d9deea; padding-top:8px; width:100%; display:grid; grid-template-columns:30% 40% 30%; align-items:start;">
        <div style="text-align:left; line-height:1.25;">
          ${documentNumber ? `<div style="font-size:8px; font-weight:700; color:#18212f;">${documentNumber}</div>` : ''}
          <div>${pageLabel} <span class="pageNumber"></span>/<span class="totalPages"></span></div>
        </div>
        <div style="text-align:center; line-height:1.25;">${footer}</div>
        <div></div>
      </div>
    </div>
  `
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
      font-family: Arial, Helvetica, sans-serif;
      color: var(--text);
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @page {
      size: A4;
      margin: 8mm 8mm 15mm 8mm;
    }

    body {
      padding: 2px 3px 0;
      font-size: 11px;
      line-height: 1.45;
    }

    .document {
      width: 100%;
    }

    .document-main { width: 100%; }

    .document-topbar {
      height: 4px;
      background: var(--accent);
      margin-bottom: 10px;
    }

    .header-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 0; }
    .brand-block { width: 72%; vertical-align: top; }
    .meta-block-head { width: 28%; vertical-align: top; text-align: right; }
    .brand-row { width: 100%; border-collapse: collapse; }
    .logo-cell { width: 126px; vertical-align: top; }
    .copy-cell { vertical-align: top; padding-left: 4px; }
    .logo {
      width: 118px;
      max-width: 118px;
      max-height: 92px;
      object-fit: contain;
      object-position: left center;
      display: block;
    }

    .brand-copy { min-width: 0; }

    .brand-name {
      margin: 0;
      font-size: 14pt;
      line-height: 1.04;
      font-weight: 500;
      letter-spacing: -0.005em;
      white-space: nowrap;
    }

    .document-title {
      margin: 4px 0 0;
      font-size: 8.6pt;
      color: var(--muted);
      font-weight: 400;
      white-space: nowrap;
    }

    .identity-title {
      margin: 0;
      font-size: 10pt;
      font-weight: 500;
      color: var(--accent);
      line-height: 1.1;
      white-space: nowrap;
    }

    .identity-meta {
      margin-top: 3px;
      color: var(--muted);
      font-size: 8.3pt;
      line-height: 1.25;
      white-space: nowrap;
    }

    .identity-status {
      display: block;
      width: 100%;
      padding: 4px 8px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 8pt;
      font-weight: 500;
      margin-top: 8px;
      text-align: right;
      white-space: nowrap;
    }

    .party-table { width: 100%; border-collapse: separate; border-spacing: 0; table-layout: fixed; margin-top: 12px; margin-bottom: 12px; }
    .party-gap { width: 1%; }
    .party-card {
      width: 49.5%;
      vertical-align: top;
      border: 1px solid var(--border);
      padding: 10px 12px;
      background: #f7f9fc;
      min-height: 78px;
      overflow: hidden;
    }

    .party-title {
      font-size: 7.2pt;
      text-transform: uppercase;
      letter-spacing: 0.035em;
      color: var(--muted);
      font-weight: 500;
      margin-bottom: 8px;
      white-space: nowrap;
    }

    .party-line {
      margin: 0 0 3px;
      font-size: 8.4pt;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .meta-block {
      border: 1px solid var(--border);
      padding: 9px 12px;
      background: var(--panel);
      margin-bottom: 10px;
    }

    .meta-line {
      margin: 0 0 4px;
      color: var(--muted);
    }

    .invoice-table { overflow: hidden; margin-top: 10px; margin-bottom: 4px; }

    .invoice-table table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .invoice-table col.col-line-number { width: 4%; }
    .invoice-table col.col-designation { width: 27%; }
    .invoice-table col.col-reference { width: 7%; }
    .invoice-table col.col-quantity { width: 5%; }
    .invoice-table col.col-unit-ht { width: 11%; }
    .invoice-table col.col-total-ht { width: 11%; }
    .invoice-table col.col-vat-rate { width: 12%; }
    .invoice-table col.col-vat-amount { width: 11%; }
    .invoice-table col.col-total-ttc { width: 12%; }

    .invoice-table thead th {
      background: var(--panel);
      color: var(--muted);
      text-align: right;
      font-size: 7.2pt;
      font-weight: 400;
      padding: 7px 5px;
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
      padding-left: 3px;
      padding-right: 3px;
    }

    .invoice-table tbody td {
      padding: 8px 5px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
      overflow-wrap: anywhere;
      word-break: break-word;
      font-size: 9pt;
      line-height: 1.25;
    }

    .invoice-table tbody tr:last-child td {
      border-bottom: none;
    }

    .line-title {
      font-size: 9.4pt;
      font-weight: 400;
      margin: 0;
    }

    .line-description {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 8.5pt;
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

    .col-lineNumber { text-align: center !important; padding-left: 1px !important; padding-right: 1px !important; }
    .col-designation { text-align: left !important; }
    .col-vatRate { color: var(--muted); font-size: 8.1pt; line-height: 1.15; }
    .total-cell { font-weight: 400; }
    .invoice-vat-note {
      margin: 0 0 12px;
      text-align: right;
      font-size: 8.2pt;
      color: var(--muted);
    }

    .summary-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .notes-cell { width: 55%; vertical-align: top; }
    .summary-gap { width: 5%; }
    .totals-cell { width: 40%; vertical-align: top; }

    .section-card,
    .summary-card {
      border: 1px solid var(--border);
      background: white;
      overflow: hidden;
    }

    .section-heading {
      padding: 10px 12px;
      background: var(--panel);
      border-bottom: 1px solid var(--border);
      color: var(--text);
      font-size: 9px;
      font-weight: 400;
    }

    .section-body {
      padding: 12px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 7px 0;
      border-bottom: 1px solid var(--border);
    }

    .summary-row:last-child {
      border-bottom: none;
    }

    .summary-row.total {
      font-size: 11pt;
      font-weight: 400;
      color: var(--accent);
    }

    .section {
      margin-bottom: 12px;
    }

    .section:last-child {
      margin-bottom: 0;
    }

    .section-card + .section-card {
      margin-top: 10px;
    }

    .section-paragraph {
      margin: 0 0 8px;
      white-space: pre-wrap;
    }

    .section-paragraph:last-child {
      margin-bottom: 0;
    }

    .notes-title {
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
      font-weight: 400;
      margin-bottom: 8px;
    }

    .notes-plain { min-height: 24px; }

    .totals-box { width: 100%; border: 1px solid var(--border); background: white; }
    .totals-heading {
      padding: 10px 12px;
      background: var(--panel);
      border-bottom: 1px solid var(--border);
      color: var(--text);
      font-size: 9px;
      font-weight: 400;
    }
    .totals-inner { width: 100%; border-collapse: collapse; }
    .totals-inner td { padding: 7px 12px; border-bottom: 1px solid var(--border); }
    .totals-inner tr:last-child td { border-bottom: none; }
    .total-label { color: var(--text); }
    .total-value { text-align: right; font-weight: 400; }
    .grand-total td { color: var(--accent); font-size: 11pt; font-weight: 400; }
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
    <table class="header-table" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td class="brand-block">
          <table class="brand-row" border="0" cellspacing="0" cellpadding="0">
            <tr>
              ${options.logoDataUri ? `<td class="logo-cell"><img class="logo" src="${options.logoDataUri}" alt="${escapeHtml(options.brandName)}"></td>` : ''}
              <td class="copy-cell">
                <div class="brand-name">${escapeHtml(options.brandName)}</div>
                <div class="document-title">${escapeHtml(options.title)}</div>
              </td>
            </tr>
          </table>
        </td>
        <td class="meta-block-head">
          <div class="identity-title">${escapeHtml(options.metaTitle)}</div>
          <div class="identity-meta">${metaHtml}</div>
          ${options.statusLabel ? `<div class="identity-status">${escapeHtml(options.statusLabel)}</div>` : ''}
        </td>
      </tr>
    </table>
  `
}

function renderPartyCard(title: string, lines: string[]) {
  const content = (lines || [])
    .filter(Boolean)
    .map(line => `<p class="party-line">${escapeHtml(line)}</p>`)
    .join('')

  return `
    <td class="party-card">
      <div class="party-title">${escapeHtml(title)}</div>
      ${content}
    </td>
  `
}

function renderPartyGrid(options: {
  sellerTitle?: string | null
  sellerLines?: string[]
  customerTitle?: string | null
  customerLines?: string[]
}) {
  return `
    <table class="party-table" border="0" cellspacing="0" cellpadding="0">
      <tr>
        ${renderPartyCard(options.sellerTitle || 'Emetteur', options.sellerLines || [])}
        <td class="party-gap"></td>
        ${renderPartyCard(options.customerTitle || 'Client', options.customerLines || [])}
      </tr>
    </table>
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

function invoiceColumnCssClass(key: string, header: boolean) {
  const align = key === 'designation' ? 'designation' : (key === 'lineNumber' ? 'lineNumber' : 'numeric')
  const vat = key === 'vatRate' ? ' col-vatRate' : ''
  const total = key === 'totalTtc' && !header ? ' total-cell' : ''
  if (header) {
    return `${align}${vat}`.trim()
  }
  return `cell col-${key} ${align}${vat}${total}`.trim()
}

const RAW_INVOICE_COLUMN_WIDTHS: Record<string, number> = {
  lineNumber: 4,
  designation: 27,
  reference: 7,
  quantity: 5,
  unitPriceHt: 11,
  totalHt: 11,
  vatRate: 12,
  vatAmount: 11,
  totalTtc: 12,
}

function resolveInvoiceColumnWidths(columns: InvoicePdfColumn[]) {
  const total = columns.reduce((sum, column) => sum + (RAW_INVOICE_COLUMN_WIDTHS[column.key] || 10), 0) || 1
  return Object.fromEntries(columns.map((column) => {
    const raw = RAW_INVOICE_COLUMN_WIDTHS[column.key] || 10
    return [column.key, `${((raw / total) * 100).toFixed(4)}%`]
  }))
}

function renderInvoiceTable(lines: InvoicePdfLine[], columns?: InvoicePdfColumn[], vatNote?: string | null) {
  const effectiveColumns = columns?.length
    ? columns
    : [
        { key: 'lineNumber', label: 'N°' },
        { key: 'designation', label: 'Désignation' },
        { key: 'reference', label: 'Réf.' },
        { key: 'quantity', label: 'Qté' },
        { key: 'unitPriceHt', label: 'PU HT' },
        { key: 'totalHt', label: 'Total HT' },
        { key: 'vatAmount', label: 'TVA Montant' },
        { key: 'vatRate', label: 'TVA' },
        { key: 'totalTtc', label: 'Total TTC' },
      ]
  const widths = resolveInvoiceColumnWidths(effectiveColumns)
  const colgroup = effectiveColumns.map(column => `<col style="width:${widths[column.key] || 'auto'}">`).join('')
  const rows = lines.map(line => `
      <tr>
        ${effectiveColumns.map((column, index) => {
          if (column.key === 'designation') {
            return `<td class="${invoiceColumnCssClass(column.key, false)}"><div class="line-title">${escapeHtml(line.title)}</div>${line.description ? `<div class="line-description">${escapeHtml(line.description)}</div>` : ''}</td>`
          }
          const fallbackValue = (
            column.key === 'lineNumber' ? line.lineNumberLabel :
            column.key === 'reference' ? line.referenceLabel :
            column.key === 'quantity' ? String(line.quantity) :
            column.key === 'unitPriceHt' ? line.unitPriceExclTaxLabel :
            column.key === 'totalHt' ? line.totalPriceExclTaxLabel :
            column.key === 'vatAmount' ? line.vatAmountLabel :
            column.key === 'vatRate' ? (line.vatRateLabel || '-') :
            line.totalPriceInclTaxLabel
          )
          const value = line.values?.[column.key] || fallbackValue || (index ? '-' : '-')
          return `<td class="${invoiceColumnCssClass(column.key, false)}">${escapeHtml(value)}</td>`
        }).join('')}
      </tr>
    `).join('')

  return `
    <section class="invoice-table">
      <table>
        <colgroup>${colgroup}</colgroup>
        <thead>
          <tr>
            ${effectiveColumns.map((column) => {
              const headerClass = invoiceColumnCssClass(column.key, true)
              return `<th class="${headerClass}">${escapeHtml(column.label)}</th>`
            }).join('')}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
    ${vatNote ? `<p class="invoice-vat-note">${escapeHtml(vatNote)}</p>` : ''}
  `
}

function renderSummaryCard(options: {
  subtotalExclTaxLabel: string
  totalVatLabel: string
  totalInclTaxLabel: string
  taxRows?: Array<{ label: string, amountLabel: string }>
  vatNote?: string | null
  labels?: InvoicePdfOptions['labels']
}) {
  const totalsTitle = options.labels?.totalsTitle || 'Totaux'
  const totalHt = options.labels?.totalHt || 'Total HT'
  const totalVat = options.labels?.totalVat || 'Total TVA'
  const totalTtc = options.labels?.totalTtc || 'Total TTC'
  const taxRows = (options.taxRows || []).map(group => `
      <div class="summary-row">
        <span>${escapeHtml(group.label)}</span>
        <span>${escapeHtml(group.amountLabel)}</span>
      </div>
    `).join('')
  const totalVatRow = options.vatNote ? '' : `
        <div class="summary-row">
          <span>${escapeHtml(totalVat)}</span>
          <span>${escapeHtml(options.totalVatLabel)}</span>
        </div>
      `

  return `
    <section class="summary-card">
      <div class="totals-heading">${escapeHtml(totalsTitle)}</div>
      <div class="section-body">
        <div class="summary-row">
          <span>${escapeHtml(totalHt)}</span>
          <span>${escapeHtml(options.subtotalExclTaxLabel)}</span>
        </div>
        ${taxRows}
        ${totalVatRow}
        <div class="summary-row total">
          <span>${escapeHtml(totalTtc)}</span>
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

function renderNotesCardWithLabels(notes: string | null | undefined, labels?: InvoicePdfOptions['labels']) {
  const paragraphs = textToParagraphs(notes)
  const notesTitle = labels?.notesTitle || 'Notes'
  const noNotes = labels?.noNotes || 'No notes'

  return `
    <section>
      <div class="notes-title">${escapeHtml(notesTitle)}</div>
      <div class="notes-plain">
        ${paragraphs.length
          ? paragraphs.map(line => `<p class="section-paragraph">${escapeHtml(line)}</p>`).join('')
          : `<p class="section-paragraph">${escapeHtml(noNotes)}</p>`}
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

async function renderHtmlToPdf(html: string, options?: { footerTemplate?: string | null }) {
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
        displayHeaderFooter: Boolean(options?.footerTemplate),
        headerTemplate: '<div></div>',
        footerTemplate: options?.footerTemplate || '<div></div>',
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: options?.footerTemplate ? '20mm' : '12mm',
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

async function renderPreferredPdf(
  html: string,
  payload: ExternalInvoicePdfPayload | ExternalBrandedDocumentPdfPayload,
  failureMessage: string,
  options?: { footerTemplate?: string | null },
) {
  const preferredMode = await resolvePdfRendererMode()
  const localBrowserAvailable = canUseLocalBrowserPdf()
  const externalServiceConfigured = Boolean(getExternalPdfServiceUrl())

  if (preferredMode === 'local' && localBrowserAvailable) {
    try {
      return Buffer.from(await renderHtmlToPdf(html, options))
    } catch (error) {
      if (externalServiceConfigured) {
        const externalPdf = await renderExternalPdf(payload)
        if (externalPdf) {
          return externalPdf
        }
      }
      throw error
    }
  }

  if (preferredMode === 'external') {
    const externalPdf = await renderExternalPdf(payload)
    if (externalPdf) {
      return externalPdf
    }

    if (localBrowserAvailable && getCurrentCmsRuntimeTarget() === 'server') {
      return Buffer.from(await renderHtmlToPdf(html, options))
    }

    throw createError({
      statusCode: 503,
      statusMessage: failureMessage,
      message: getCurrentCmsRuntimeTarget() === 'cloudflare'
        ? 'Le runtime Cloudflare doit utiliser un service PDF externe configure via CMS_PDF_SERVICE_URL.'
        : 'Le mode PDF externe est sélectionné mais aucun service PDF externe n est configure.',
    })
  }

  if (localBrowserAvailable) {
    try {
      return Buffer.from(await renderHtmlToPdf(html, options))
    } catch (error) {
      if (externalServiceConfigured) {
        const externalPdf = await renderExternalPdf(payload)
        if (externalPdf) {
          return externalPdf
        }
      }
      throw error
    }
  }

  const externalPdf = await renderExternalPdf(payload)
  if (externalPdf) {
    return externalPdf
  }

  throw createError({
    statusCode: 503,
    statusMessage: failureMessage,
    message: getCurrentCmsRuntimeTarget() === 'cloudflare'
      ? 'Le runtime Cloudflare doit utiliser un service PDF externe configure via CMS_PDF_SERVICE_URL.'
      : 'Aucun navigateur Chromium local n est disponible et aucun service PDF externe n est configure.',
  })
}

export async function getPdfRuntimeDiagnostics() {
  const runtimeTarget = getCurrentCmsRuntimeTarget()
  const localBrowserAvailable = canUseLocalBrowserPdf()
  const externalServiceConfigured = Boolean(getExternalPdfServiceUrl())
  const preferredMode = await resolvePdfRendererMode()

  return {
    runtimeTarget,
    localBrowserAvailable,
    externalServiceConfigured,
    executablePath: resolveChromiumExecutablePath(),
    hostPlatform: process.platform,
    hostArch: os.arch(),
    preferredMode,
    effectiveMode: runtimeTarget === 'cloudflare'
      ? 'external'
      : preferredMode === 'external'
        ? 'external'
        : localBrowserAvailable
          ? 'local'
          : externalServiceConfigured
            ? 'external'
            : 'local',
    canSelectLocal: runtimeTarget !== 'cloudflare' && localBrowserAvailable,
    canSelectExternal: externalServiceConfigured,
    forcedExternal: runtimeTarget === 'cloudflare',
  }
}

export async function buildBrandedDocumentPdf(options: BrandedDocumentPdfOptions) {
  const payload: ExternalBrandedDocumentPdfPayload = {
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
  }

  if (getCurrentCmsRuntimeTarget() === 'cloudflare') {
    const externalPdf = await renderExternalPdf(payload)
    if (externalPdf) return externalPdf
    throw createError({
      statusCode: 503,
      statusMessage: 'PDF document rendering unavailable',
      message: 'Le runtime Cloudflare doit utiliser un service PDF externe configure via CMS_PDF_SERVICE_URL.',
    })
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

  return await renderPreferredPdf(
    wrapHtmlDocument(options.title, body, accentColor),
    payload,
    'PDF document rendering unavailable',
    {
      footerTemplate: buildBrowserFooterTemplate({
        documentNumber: options.documentNumber || options.title,
        footer: options.footer,
        pageLabel: 'Page',
      }),
    },
  )
}

export async function buildInvoicePdf(options: InvoicePdfOptions) {
  const payload: ExternalInvoicePdfPayload = {
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
      title: options.customerTitle || 'Client',
      name: options.customerLines[0] || '',
      email: options.customerLines[1] || '',
      phone: options.customerLines[2] || '',
      address: options.customerLines.slice(3).join('\n'),
    },
    metaLines: options.metaLines || [],
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
    vatNote: options.vatNote,
    notes: options.notes,
    footer: options.footer,
    labels: options.labels,
  }

  if (getCurrentCmsRuntimeTarget() === 'cloudflare') {
    const externalPdf = await renderExternalPdf(payload)
    if (externalPdf) return externalPdf
    throw createError({
      statusCode: 503,
      statusMessage: 'PDF invoice rendering unavailable',
      message: 'Le runtime Cloudflare doit utiliser un service PDF externe configure via CMS_PDF_SERVICE_URL.',
    })
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
      ${renderInvoiceTable(options.lines, options.columns, options.vatNote)}
      <table class="summary-table" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td class="notes-cell">
          ${renderNotesCardWithLabels(options.notes, options.labels)}
          </td>
          <td class="summary-gap"></td>
          <td class="totals-cell">
            ${renderSummaryCard({
              subtotalExclTaxLabel: options.subtotalExclTaxLabel,
              totalVatLabel: options.totalVatLabel,
              totalInclTaxLabel: options.totalInclTaxLabel,
              taxRows: options.taxRows,
              vatNote: options.vatNote,
              labels: options.labels,
            })}
          </td>
        </tr>
      </table>
    </div>
  `

  return await renderPreferredPdf(
    wrapHtmlDocument(options.title, body, accentColor),
    payload,
    'PDF invoice rendering unavailable',
    {
      footerTemplate: buildBrowserFooterTemplate({
        documentNumber: options.invoiceNumber,
        footer: options.footer,
        pageLabel: options.labels?.page || 'Page',
      }),
    },
  )
}
