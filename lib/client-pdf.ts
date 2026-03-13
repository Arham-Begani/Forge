// lib/client-pdf.ts
// Client-side PDF generation using jsPDF — direct download, no print dialog

import { jsPDF } from 'jspdf'

interface PDFSection {
  title: string
  content: string
}

/**
 * Generate a well-formatted PDF from plain text content and trigger a download.
 * Works entirely client-side — no print dialog, no new window.
 */
export function downloadPDF(title: string, sections: PDFSection[], filename?: string) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = 0

  // ─── Cover Page ─────────────────────────────────────────────────────────────
  doc.setFillColor(17, 17, 16) // Dark background
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Accent line
  doc.setFillColor(192, 122, 58) // Forge accent
  doc.rect(margin, 70, 40, 3, 'F')

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(32)
  const titleLines = doc.splitTextToSize(title, contentWidth)
  doc.text(titleLines, margin, 90)

  // Subtitle
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(160, 160, 160)
  doc.text('Forge — Autonomous Venture Orchestrator', margin, 90 + titleLines.length * 14 + 12)

  // Date
  doc.setFontSize(11)
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, pageHeight - 30)

  // ─── Content Pages ──────────────────────────────────────────────────────────

  function newPage() {
    doc.addPage()
    y = margin + 10
    // Subtle header line
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(0.3)
    doc.line(margin, margin, pageWidth - margin, margin)
  }

  function checkPageBreak(neededHeight: number) {
    if (y + neededHeight > pageHeight - margin - 10) {
      newPage()
    }
  }

  function addSectionTitle(text: string) {
    checkPageBreak(20)
    // Accent bar
    doc.setFillColor(192, 122, 58)
    doc.rect(margin, y - 3, 3, 14, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.setTextColor(30, 30, 30)
    doc.text(text, margin + 8, y + 8)
    y += 20
  }

  function addParagraph(text: string, size = 10.5) {
    if (!text || !text.trim()) return
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(size)
    doc.setTextColor(60, 60, 60)
    const lines = doc.splitTextToSize(text.trim(), contentWidth)
    const lineHeight = size * 0.5
    checkPageBreak(lines.length * lineHeight + 4)
    doc.text(lines, margin, y)
    y += lines.length * lineHeight + 6
  }

  function addKeyValue(label: string, value: string) {
    if (!value || !value.trim()) return
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(130, 130, 130)
    checkPageBreak(14)
    doc.text(label.toUpperCase(), margin, y)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor(50, 50, 50)
    const valLines = doc.splitTextToSize(value.trim(), contentWidth - 4)
    doc.text(valLines, margin, y + 5)
    y += 5 + valLines.length * 5.5 + 4
  }

  function addBullet(text: string) {
    if (!text || !text.trim()) return
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor(60, 60, 60)
    const lines = doc.splitTextToSize(text.trim(), contentWidth - 10)
    checkPageBreak(lines.length * 5.5 + 3)
    doc.setFillColor(192, 122, 58)
    doc.circle(margin + 2, y - 1.5, 1.2, 'F')
    doc.text(lines, margin + 8, y)
    y += lines.length * 5.5 + 3
  }

  // Parse and render sections
  for (const section of sections) {
    newPage()
    addSectionTitle(section.title)

    // Split content into paragraphs and render intelligently
    const lines = section.content.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        y += 3 // blank line spacing
        continue
      }

      // Markdown-style headings
      if (trimmed.startsWith('### ')) {
        checkPageBreak(14)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11.5)
        doc.setTextColor(40, 40, 40)
        doc.text(trimmed.replace(/^###\s+/, ''), margin, y)
        y += 8
      } else if (trimmed.startsWith('## ')) {
        checkPageBreak(16)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(13)
        doc.setTextColor(30, 30, 30)
        doc.text(trimmed.replace(/^##\s+/, ''), margin, y)
        y += 10
      } else if (trimmed.startsWith('# ')) {
        checkPageBreak(18)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(15)
        doc.setTextColor(20, 20, 20)
        doc.text(trimmed.replace(/^#\s+/, ''), margin, y)
        y += 12
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.match(/^\d+\.\s/)) {
        const bulletText = trimmed.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '')
        addBullet(bulletText)
      } else if (trimmed.includes(': ') && trimmed.split(': ')[0].length < 30 && !trimmed.startsWith('"')) {
        // Key-value pair
        const [k, ...vParts] = trimmed.split(': ')
        addKeyValue(k.replace(/\*\*/g, ''), vParts.join(': ').replace(/\*\*/g, ''))
      } else {
        addParagraph(trimmed.replace(/\*\*/g, '').replace(/\*/g, ''))
      }
    }
  }

  // ─── Footer on each page ────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(180, 180, 180)
    doc.text(`${title} — Forge`, margin, pageHeight - 10)
    doc.text(`${i - 1}/${totalPages - 1}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
  }

  // ─── Download ───────────────────────────────────────────────────────────────
  const safeName = (filename || title).replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')
  doc.save(`${safeName}.pdf`)
}

/**
 * Generate PDF from the reading panel's structured result data.
 * Extracts text from the DOM element for simplicity.
 */
export function downloadPDFFromElement(title: string, element: HTMLElement, filename?: string) {
  const text = element.innerText || ''
  const sections: PDFSection[] = []

  // Split by section headers (the DocSection titles)
  const parts = text.split(/\n(?=[A-Z][A-Z\s&()]+\n)/)

  if (parts.length <= 1) {
    // Single section — treat the whole thing as one
    sections.push({ title, content: text })
  } else {
    for (const part of parts) {
      const lines = part.trim().split('\n')
      const sectionTitle = lines[0] || title
      const sectionContent = lines.slice(1).join('\n')
      if (sectionContent.trim()) {
        sections.push({ title: sectionTitle, content: sectionContent })
      }
    }
  }

  downloadPDF(title, sections, filename)
}

/**
 * Generate PDF from a JSON result object.
 * Formats the result into readable sections.
 */
export function downloadPDFFromResult(title: string, result: Record<string, any>, filename?: string) {
  const sections: PDFSection[] = []

  function flattenToText(obj: any, prefix = ''): string {
    if (!obj) return ''
    if (typeof obj === 'string') return obj
    if (Array.isArray(obj)) {
      return obj.map((item, i) => {
        if (typeof item === 'string') return `- ${item}`
        if (typeof item === 'object') return flattenToText(item, `${i + 1}. `)
        return `- ${String(item)}`
      }).join('\n')
    }
    if (typeof obj === 'object') {
      return Object.entries(obj)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => {
          const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()
          if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
            return `${prefix}${label}: ${v}`
          }
          return `${prefix}${label}:\n${flattenToText(v)}`
        }).join('\n\n')
    }
    return String(obj)
  }

  // Build sections from top-level keys
  for (const [key, value] of Object.entries(result)) {
    if (value === null || value === undefined) continue
    const sectionTitle = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()
    const content = flattenToText(value)
    if (content.trim()) {
      sections.push({ title: sectionTitle, content })
    }
  }

  if (sections.length === 0) {
    sections.push({ title, content: JSON.stringify(result, null, 2) })
  }

  downloadPDF(title, sections, filename)
}
