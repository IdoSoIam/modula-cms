import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'

function hexToRgb(value: string | null | undefined) {
  const normalized = String(value || '').trim().replace(/^#/, '')
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return { r: 0.294, g: 0.337, b: 0.824 }
  }
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16) / 255,
    g: Number.parseInt(normalized.slice(2, 4), 16) / 255,
    b: Number.parseInt(normalized.slice(4, 6), 16) / 255,
  }
}

function wrapText(value: string, maxLength = 92) {
  const normalized = String(value || '').replace(/\r/g, '')
  const lines: string[] = []
  for (const sourceLine of normalized.split('\n')) {
    const words = sourceLine.split(/\s+/).filter(Boolean)
    if (!words.length) {
      lines.push('')
      continue
    }
    let current = ''
    for (const word of words) {
      const next = current ? `${current} ${word}` : word
      if (next.length <= maxLength) {
        current = next
        continue
      }
      if (current) lines.push(current)
      current = word
    }
    if (current) lines.push(current)
  }
  return lines
}

interface PdfOptions {
  title: string
  brandName: string
  accentColor?: string | null
  subtitle?: string | null
  lines: string[]
  footer?: string | null
  logoLabel?: string | null
}

export function buildSimplePdf(options: PdfOptions) {
  const pages: string[][] = []
  const firstPageLines = [
    options.brandName,
    options.logoLabel ? `Logo : ${options.logoLabel}` : '',
    options.title,
    options.subtitle || '',
    '',
    ...options.lines,
    '',
    options.footer || '',
  ].filter((line, index, array) => !(line === '' && array[index - 1] === ''))

  let currentPage: string[] = []
  for (const line of firstPageLines.flatMap((entry) => wrapText(entry))) {
    if (currentPage.length >= 42) {
      pages.push(currentPage)
      currentPage = []
    }
    currentPage.push(line)
  }
  if (currentPage.length) pages.push(currentPage)
  if (!pages.length) pages.push([''])

  const color = hexToRgb(options.accentColor)
  const objects: Buffer[] = []
  const pushObject = (content: string | Buffer) => {
    objects.push(Buffer.isBuffer(content) ? content : Buffer.from(content, 'latin1'))
    return objects.length
  }

  const catalogId = pushObject('')
  const pagesId = pushObject('')
  const fontId = pushObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  const pageObjectIds: number[] = []

  for (const pageLines of pages) {
    const commands: string[] = [
      `${color.r.toFixed(3)} ${color.g.toFixed(3)} ${color.b.toFixed(3)} rg`,
      '50 790 495 2 re f',
      '0 0 0 rg',
      'BT',
      '/F1 20 Tf',
      '50 760 Td',
      `(${Buffer.from(String(pageLines[0] || ''), 'latin1').toString('latin1').replace(/[()\\]/g, '\\$&')}) Tj`,
      'ET',
    ]

    let cursorY = 734
    pageLines.slice(1).forEach((line, index) => {
      const fontSize = index === 1 ? 15 : 11
      commands.push(
        'BT',
        `/F1 ${fontSize} Tf`,
        `50 ${cursorY} Td`,
        `(${Buffer.from(String(line || ''), 'latin1').toString('latin1').replace(/[()\\]/g, '\\$&')}) Tj`,
        'ET',
      )
      cursorY -= fontSize === 15 ? 24 : 16
    })

    const stream = commands.join('\n')
    const contentId = pushObject(`<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`)
    const pageId = pushObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    )
    pageObjectIds.push(pageId)
  }

  objects[catalogId - 1] = Buffer.from(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`, 'latin1')
  objects[pagesId - 1] = Buffer.from(
    `<< /Type /Pages /Count ${pageObjectIds.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] >>`,
    'latin1',
  )

  const chunks: Buffer[] = [Buffer.from('%PDF-1.4\n', 'latin1')]
  const offsets: number[] = [0]
  let position = chunks[0].length

  objects.forEach((object, index) => {
    offsets.push(position)
    const chunk = Buffer.concat([
      Buffer.from(`${index + 1} 0 obj\n`, 'latin1'),
      object,
      Buffer.from('\nendobj\n', 'latin1'),
    ])
    chunks.push(chunk)
    position += chunk.length
  })

  const xrefOffset = position
  const xrefEntries = offsets
    .map((offset, index) => (
      index === 0
        ? '0000000000 65535 f '
        : `${String(offset).padStart(10, '0')} 00000 n `
    ))
    .join('\n')
  chunks.push(Buffer.from(`xref\n0 ${offsets.length}\n${xrefEntries}\n`, 'latin1'))
  chunks.push(
    Buffer.from(
      `trailer\n<< /Size ${offsets.length} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
      'latin1',
    ),
  )

  return Buffer.concat(chunks)
}

export interface InvoicePdfLine {
  title: string
  description?: string | null
  quantity: number
  unitPriceLabel: string
  totalPriceLabel: string
  vatRateLabel?: string | null
}

export interface InvoicePdfTaxGroup {
  label: string
  baseLabel: string
  taxLabel: string
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
  sellerLines: string[]
  customerTitle?: string | null
  customerLines: string[]
  metaLines?: string[]
  lines: InvoicePdfLine[]
  subtotalLabel: string
  totalLabel: string
  taxGroups?: InvoicePdfTaxGroup[]
  footer?: string | null
  notes?: string | null
  logoBytes?: Uint8Array | null
  logoMimeType?: string | null
}

interface PdfLayoutContext {
  pdf: PDFDocument
  page: PDFPage
  fontRegular: PDFFont
  fontBold: PDFFont
  accentColor: ReturnType<typeof rgb>
  textColor: ReturnType<typeof rgb>
  mutedColor: ReturnType<typeof rgb>
  lightBorder: ReturnType<typeof rgb>
  softFill: ReturnType<typeof rgb>
  pageWidth: number
  pageHeight: number
  marginX: number
  topY: number
  bottomMargin: number
  cursorY: number
}

function drawWrappedText(options: {
  page: PDFPage
  font: PDFFont
  text: string
  x: number
  y: number
  size: number
  color?: ReturnType<typeof rgb>
  maxWidth: number
  lineHeight?: number
}) {
  const { page, font, x, size, maxWidth } = options
  const lineHeight = options.lineHeight || (size + 4)
  const words = String(options.text || '').split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next
      continue
    }
    if (current) lines.push(current)
    current = word
  }
  if (current) lines.push(current)
  if (!lines.length) lines.push('')

  let y = options.y
  for (const line of lines) {
    page.drawText(line, { x, y, size, font, color: options.color })
    y -= lineHeight
  }

  return {
    y,
    height: lines.length * lineHeight,
  }
}

function buildPdfLayoutContext(pdf: PDFDocument, accentColorValue?: string | null): PdfLayoutContext {
  const accent = hexToRgb(accentColorValue)
  return {
    pdf,
    page: pdf.addPage([595.28, 841.89]),
    fontRegular: undefined as unknown as PDFFont,
    fontBold: undefined as unknown as PDFFont,
    accentColor: rgb(accent.r, accent.g, accent.b),
    textColor: rgb(0.11, 0.13, 0.16),
    mutedColor: rgb(0.43, 0.46, 0.52),
    lightBorder: rgb(0.88, 0.89, 0.92),
    softFill: rgb(0.96, 0.97, 0.99),
    pageWidth: 595.28,
    pageHeight: 841.89,
    marginX: 44,
    topY: 794,
    bottomMargin: 56,
    cursorY: 794,
  }
}

function bindPdfFonts(context: PdfLayoutContext, fontRegular: PDFFont, fontBold: PDFFont) {
  context.fontRegular = fontRegular
  context.fontBold = fontBold
}

function drawPageHeader(context: PdfLayoutContext) {
  context.page.drawRectangle({
    x: context.marginX,
    y: 804,
    width: context.pageWidth - context.marginX * 2,
    height: 3,
    color: context.accentColor,
  })
}

function ensurePageSpace(context: PdfLayoutContext, required: number) {
  if (context.cursorY - required >= context.bottomMargin) return
  context.page = context.pdf.addPage([context.pageWidth, context.pageHeight])
  context.cursorY = context.topY
  drawPageHeader(context)
}

async function embedPdfLogo(
  pdf: PDFDocument,
  logoBytes?: Uint8Array | null,
  logoMimeType?: string | null,
) {
  if (!logoBytes?.length || !logoMimeType) return null
  try {
    if (logoMimeType.includes('png')) {
      return await pdf.embedPng(logoBytes)
    }
    if (logoMimeType.includes('jpeg') || logoMimeType.includes('jpg')) {
      return await pdf.embedJpg(logoBytes)
    }
  } catch {
    return null
  }
  return null
}

function drawTopIdentityBlock(
  context: PdfLayoutContext,
  options: {
    brandName: string
    title: string
    identityLine?: string | null
    logo?: Awaited<ReturnType<typeof embedPdfLogo>>
  },
) {
  const leftWidth = 310
  const rightX = context.marginX + leftWidth
  let brandX = context.marginX

  if (options.logo) {
    const scale = Math.min(92 / options.logo.width, 54 / options.logo.height, 1)
    const width = options.logo.width * scale
    const height = options.logo.height * scale
    context.page.drawImage(options.logo, {
      x: context.marginX,
      y: context.cursorY - height + 4,
      width,
      height,
    })
    brandX += width + 14
  }

  const brandResult = drawWrappedText({
    page: context.page,
    font: context.fontBold,
    text: options.brandName,
    x: brandX,
    y: context.cursorY,
    size: 22,
    color: context.textColor,
    maxWidth: rightX - brandX - 16,
    lineHeight: 24,
  })

  const titleResult = drawWrappedText({
    page: context.page,
    font: context.fontBold,
    text: options.title,
    x: rightX,
    y: context.cursorY,
    size: 18,
    color: context.accentColor,
    maxWidth: context.pageWidth - context.marginX - rightX,
    lineHeight: 22,
  })

  let identityBottom = titleResult.y
  if (options.identityLine?.trim()) {
    const identityResult = drawWrappedText({
      page: context.page,
      font: context.fontRegular,
      text: options.identityLine,
      x: rightX,
      y: titleResult.y - 4,
      size: 10,
      color: context.mutedColor,
      maxWidth: context.pageWidth - context.marginX - rightX,
      lineHeight: 14,
    })
    identityBottom = identityResult.y
  }

  context.cursorY = Math.min(brandResult.y, identityBottom) - 14
}

function drawInfoBlocks(
  context: PdfLayoutContext,
  options: {
    sellerTitle?: string | null
    sellerLines?: string[]
    customerTitle?: string | null
    customerLines?: string[]
  },
) {
  const sellerLines = options.sellerLines?.filter(Boolean) || []
  const customerLines = options.customerLines?.filter(Boolean) || []
  if (!sellerLines.length && !customerLines.length) return

  const sellerBlockX = context.marginX
  const customerBlockX = context.pageWidth / 2 + 10

  if (sellerLines.length) {
    context.page.drawText(options.sellerTitle || 'Emetteur', {
      x: sellerBlockX,
      y: context.cursorY,
      size: 11,
      font: context.fontBold,
      color: context.mutedColor,
    })
  }

  if (customerLines.length) {
    context.page.drawText(options.customerTitle || 'Client', {
      x: customerBlockX,
      y: context.cursorY,
      size: 11,
      font: context.fontBold,
      color: context.mutedColor,
    })
  }

  const drawBlock = (lines: string[], x: number, startY: number) => {
    let y = startY - 18
    for (const line of lines) {
      const result = drawWrappedText({
        page: context.page,
        font: context.fontRegular,
        text: line,
        x,
        y,
        size: 11,
        color: context.textColor,
        maxWidth: 220,
        lineHeight: 15,
      })
      y = result.y
    }
    return y
  }

  const sellerY = sellerLines.length ? drawBlock(sellerLines, sellerBlockX, context.cursorY) : context.cursorY
  const customerY = customerLines.length ? drawBlock(customerLines, customerBlockX, context.cursorY) : context.cursorY
  context.cursorY = Math.min(sellerY, customerY) - 14
}

function drawMetaLines(context: PdfLayoutContext, lines?: string[]) {
  const filtered = lines?.filter(Boolean) || []
  if (!filtered.length) return
  for (const line of filtered) {
    ensurePageSpace(context, 18)
    const result = drawWrappedText({
      page: context.page,
      font: context.fontRegular,
      text: line,
      x: context.marginX,
      y: context.cursorY,
      size: 10,
      color: context.mutedColor,
      maxWidth: context.pageWidth - context.marginX * 2,
      lineHeight: 14,
    })
    context.cursorY = result.y - 2
  }
  context.cursorY -= 8
}

function drawDocumentSections(context: PdfLayoutContext, sections: BrandedDocumentPdfSection[]) {
  for (const section of sections) {
    const lines = section.lines.filter((line) => String(line || '').trim())
    if (!section.title?.trim() && !lines.length) continue
    ensurePageSpace(context, 42)

    context.page.drawRectangle({
      x: context.marginX,
      y: context.cursorY - 10,
      width: context.pageWidth - context.marginX * 2,
      height: 26,
      color: context.softFill,
      borderColor: context.lightBorder,
      borderWidth: 1,
    })
    context.page.drawText(section.title?.trim() || 'Contenu', {
      x: context.marginX + 10,
      y: context.cursorY,
      size: 11,
      font: context.fontBold,
      color: context.textColor,
    })
    context.cursorY -= 22

    for (const line of lines) {
      ensurePageSpace(context, 18)
      const result = drawWrappedText({
        page: context.page,
        font: context.fontRegular,
        text: line,
        x: context.marginX,
        y: context.cursorY,
        size: 10.5,
        color: context.textColor,
        maxWidth: context.pageWidth - context.marginX * 2,
        lineHeight: 15,
      })
      context.cursorY = result.y - 2
    }

    context.cursorY -= 10
  }
}

function drawDocumentFooter(context: PdfLayoutContext, footer?: string | null) {
  if (!footer?.trim()) return
  const footerLines = wrapText(footer, 100)
  const footerHeight = footerLines.length * 12 + 14
  if (context.cursorY < context.bottomMargin + footerHeight) {
    context.page = context.pdf.addPage([context.pageWidth, context.pageHeight])
    context.cursorY = context.topY
    drawPageHeader(context)
  }
  context.page.drawLine({
    start: { x: context.marginX, y: context.bottomMargin + footerHeight - 6 },
    end: { x: context.pageWidth - context.marginX, y: context.bottomMargin + footerHeight - 6 },
    thickness: 1,
    color: context.lightBorder,
  })
  let footerY = context.bottomMargin + footerHeight - 20
  for (const line of footerLines) {
    context.page.drawText(line, {
      x: context.marginX,
      y: footerY,
      size: 9,
      font: context.fontRegular,
      color: context.mutedColor,
    })
    footerY -= 12
  }
}

export async function buildBrandedDocumentPdf(options: BrandedDocumentPdfOptions) {
  const pdf = await PDFDocument.create()
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const context = buildPdfLayoutContext(pdf, options.accentColor)
  bindPdfFonts(context, fontRegular, fontBold)
  drawPageHeader(context)

  const identityLine = [
    options.documentNumber?.trim() || '',
    options.documentDateLabel?.trim() || '',
    options.statusLabel?.trim() || '',
  ].filter(Boolean).join(' · ')

  drawTopIdentityBlock(context, {
    brandName: options.brandName,
    title: options.title,
    identityLine,
    logo: await embedPdfLogo(pdf, options.logoBytes, options.logoMimeType),
  })
  drawInfoBlocks(context, {
    sellerTitle: options.sellerTitle,
    sellerLines: options.sellerLines,
    customerTitle: options.customerTitle,
    customerLines: options.customerLines,
  })
  drawMetaLines(context, options.metaLines)
  drawDocumentSections(context, options.sections)
  drawDocumentFooter(context, options.footer)

  return Buffer.from(await pdf.save())
}

export async function buildInvoicePdf(options: InvoicePdfOptions) {
  const pdf = await PDFDocument.create()
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const context = buildPdfLayoutContext(pdf, options.accentColor)
  bindPdfFonts(context, fontRegular, fontBold)
  drawPageHeader(context)

  const identityLine = `${options.invoiceNumber} · ${options.invoiceDateLabel}${options.paymentStatusLabel ? ` · ${options.paymentStatusLabel}` : ''}`
  drawTopIdentityBlock(context, {
    brandName: options.brandName,
    title: options.title,
    identityLine,
    logo: await embedPdfLogo(pdf, options.logoBytes, options.logoMimeType),
  })
  drawInfoBlocks(context, {
    sellerTitle: 'Emetteur',
    sellerLines: options.sellerLines,
    customerTitle: options.customerTitle || 'Client',
    customerLines: options.customerLines,
  })
  drawMetaLines(context, options.metaLines)

  ensurePageSpace(context, 46)
  const columns = {
    designation: context.marginX,
    qty: 330,
    unit: 385,
    vat: 455,
    total: 510,
  }
  context.page.drawRectangle({
    x: context.marginX,
    y: context.cursorY - 8,
    width: context.pageWidth - context.marginX * 2,
    height: 26,
    color: context.softFill,
    borderColor: context.lightBorder,
    borderWidth: 1,
  })
  context.page.drawText('Article', { x: columns.designation + 8, y: context.cursorY, size: 10, font: fontBold, color: context.textColor })
  context.page.drawText('Qte', { x: columns.qty, y: context.cursorY, size: 10, font: fontBold, color: context.textColor })
  context.page.drawText('PU', { x: columns.unit, y: context.cursorY, size: 10, font: fontBold, color: context.textColor })
  context.page.drawText('TVA', { x: columns.vat, y: context.cursorY, size: 10, font: fontBold, color: context.textColor })
  context.page.drawText('Total', { x: columns.total, y: context.cursorY, size: 10, font: fontBold, color: context.textColor })
  context.cursorY -= 20

  for (const line of options.lines) {
    const titleLines = [line.title, ...(line.description ? wrapText(line.description, 70) : [])]
    const lineHeight = Math.max(28, 16 + titleLines.length * 13)
    ensurePageSpace(context, lineHeight + 12)
    context.page.drawLine({
      start: { x: context.marginX, y: context.cursorY + 4 },
      end: { x: context.pageWidth - context.marginX, y: context.cursorY + 4 },
      thickness: 1,
      color: context.lightBorder,
    })

    context.page.drawText(titleLines[0] || '', {
      x: columns.designation + 8,
      y: context.cursorY - 8,
      size: 10.5,
      font: fontBold,
      color: context.textColor,
      maxWidth: columns.qty - columns.designation - 20,
    })

    let subY = context.cursorY - 21
    for (const descLine of titleLines.slice(1)) {
      context.page.drawText(descLine, {
        x: columns.designation + 8,
        y: subY,
        size: 9.5,
        font: fontRegular,
        color: context.mutedColor,
        maxWidth: columns.qty - columns.designation - 20,
      })
      subY -= 12
    }

    context.page.drawText(String(line.quantity), {
      x: columns.qty,
      y: context.cursorY - 8,
      size: 10,
      font: fontRegular,
      color: context.textColor,
    })
    context.page.drawText(line.unitPriceLabel, {
      x: columns.unit,
      y: context.cursorY - 8,
      size: 10,
      font: fontRegular,
      color: context.textColor,
    })
    context.page.drawText(line.vatRateLabel || '-', {
      x: columns.vat,
      y: context.cursorY - 8,
      size: 10,
      font: fontRegular,
      color: context.textColor,
    })
    context.page.drawText(line.totalPriceLabel, {
      x: columns.total,
      y: context.cursorY - 8,
      size: 10,
      font: fontBold,
      color: context.textColor,
    })

    context.cursorY -= lineHeight
  }

  context.cursorY -= 8
  const summaryX = 340
  const summaryWidth = context.pageWidth - summaryX - context.marginX
  const drawSummaryRow = (label: string, value: string, bold = false) => {
    ensurePageSpace(context, 18)
    context.page.drawText(label, {
      x: summaryX,
      y: context.cursorY,
      size: 10.5,
      font: bold ? fontBold : fontRegular,
      color: context.textColor,
    })
    context.page.drawText(value, {
      x: summaryX + summaryWidth - (bold ? fontBold : fontRegular).widthOfTextAtSize(value, 10.5),
      y: context.cursorY,
      size: 10.5,
      font: bold ? fontBold : fontRegular,
      color: context.textColor,
    })
    context.cursorY -= 16
  }

  drawSummaryRow('Sous-total TTC', options.subtotalLabel)
  for (const group of options.taxGroups || []) {
    drawSummaryRow(group.label, `${group.baseLabel} / ${group.taxLabel}`)
  }
  context.page.drawLine({
    start: { x: summaryX, y: context.cursorY + 8 },
    end: { x: context.pageWidth - context.marginX, y: context.cursorY + 8 },
    thickness: 1,
    color: context.lightBorder,
  })
  drawSummaryRow('Total TTC', options.totalLabel, true)

  if (options.notes?.trim()) {
    context.cursorY -= 8
    drawDocumentSections(context, [{
      title: 'Notes',
      lines: wrapText(options.notes, 100),
    }])
  }

  drawDocumentFooter(context, options.footer)
  return Buffer.from(await pdf.save())
}
