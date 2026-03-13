import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

interface AgentResult {
  research?: any
  branding?: any
  marketing?: any
  landing?: any
  feasibility?: any
}

export async function generateUnifiedPDF(ventureName: string, results: AgentResult): Promise<Uint8Array> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPos = 40

  // --- Cover Page ---
  doc.setFillColor(15, 23, 42) // Slate 900
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(40)
  doc.text('FORGE', pageWidth / 2, 80, { align: 'center' })
  
  doc.setFontSize(20)
  doc.text('Venture Dossier', pageWidth / 2, 100, { align: 'center' })

  doc.setFontSize(32)
  doc.text(ventureName.toUpperCase(), pageWidth / 2, 150, { align: 'center' })

  doc.setFontSize(12)
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 250, { align: 'center' })

  // --- Table of Contents ---
  doc.addPage()
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(22)
  doc.text('Table of Contents', margin, 30)
  
  const sections = [
    { title: 'I. Market Intelligence', exists: !!results.research },
    { title: 'II. Brand Identity', exists: !!results.branding },
    { title: 'III. Marketing Strategy', exists: !!results.marketing },
    { title: 'IV. Product Pipeline', exists: !!results.landing },
    { title: 'V. Strategic Feasibility', exists: !!results.feasibility },
  ]

  let tocY = 50
  sections.filter(s => s.exists).forEach(s => {
    doc.setFontSize(14)
    doc.text(s.title, margin + 5, tocY)
    tocY += 10
  })

  // --- Section Helpers ---
  const addHeader = (title: string) => {
    doc.addPage()
    doc.setFontSize(22)
    doc.setTextColor(30, 64, 175) // Blue 800
    doc.text(title, margin, 30)
    yPos = 45
  }

  const addText = (text: string, size = 11) => {
    doc.setFontSize(size)
    doc.setTextColor(51, 65, 85) // Slate 700
    const lines = doc.splitTextToSize(text, pageWidth - (margin * 2))
    
    // Check for page overflow
    if (yPos + (lines.length * 7) > pageHeight - margin) {
        doc.addPage()
        yPos = margin
    }
    
    doc.text(lines, margin, yPos)
    yPos += (lines.length * 7) + 5
  }

  // --- I. Research ---
  if (results.research) {
    addHeader('I. Market Intelligence')
    addText(results.research.marketSummary || 'No summary available.')
    
    if (results.research.tam) {
        addText(`TAM: ${results.research.tam.value}`, 12)
        addText(`Source: ${results.research.tam.source}`, 9)
    }

    if (results.research.competitors) {
        addText('\nTop Competitors:', 14)
        results.research.competitors.forEach((c: any) => {
            addText(`• ${c.name}: ${c.positioning}`, 11)
        })
    }
  }

  // --- II. Branding ---
  if (results.branding) {
    addHeader('II. Brand Identity')
    addText(`Recommended Name: ${results.branding.brandName}`, 14)
    addText(`Tagline: ${results.branding.tagline}`, 12)
    addText(`\nMission:\n${results.branding.missionStatement}`)
    
    if (results.branding.colorPalette) {
        addText('\nColor Palette:', 12)
        results.branding.colorPalette.forEach((c: any) => {
            addText(`• ${c.name} (${c.hex}): ${c.role}`)
        })
    }
  }

  // --- III. Marketing ---
  if (results.marketing) {
    addHeader('III. Marketing Strategy')
    addText(results.marketing.strategySummary || 'Strategy breakdown coming soon...')
  }

  // --- IV. Landing Page ---
  if (results.landing) {
    addHeader('IV. Product Pipeline')
    addText(`Deployment URL: ${results.landing.deploymentUrl || 'Draft'}`)
    if (results.landing.landingPageCopy?.hero) {
        addText(`\nHero Headline: ${results.landing.landingPageCopy.hero.headline}`, 14)
        addText(`Subheadline: ${results.landing.landingPageCopy.hero.subheadline}`)
    }
  }

  // --- V. Feasibility ---
  if (results.feasibility) {
    addHeader('V. Strategic Feasibility')
    doc.setFontSize(24)
    doc.setTextColor(results.feasibility.verdict === 'GO' ? 22 : 185, 163, 74) // Custom green/red
    doc.text(`VERDICT: ${results.feasibility.verdict}`, margin, yPos + 10)
    yPos += 20
    
    addText(`\nRationale: ${results.feasibility.verdictRationale}`)
    
    if (results.feasibility.financialModel) {
        addText('\nFinancial Projections:', 14)
        addText(`Y1 Revenue: ${results.feasibility.financialModel.yearOne?.revenue}`)
        addText(`Y2 Revenue: ${results.feasibility.financialModel.yearTwo?.revenue}`)
        addText(`Y3 Revenue: ${results.feasibility.financialModel.yearThree?.revenue}`)
    }
  }

  return new Uint8Array(doc.output('arraybuffer') as ArrayBuffer)
}
