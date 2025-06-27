import { NextRequest, NextResponse } from "next/server"
import { bedrockClient } from "@/lib/bedrock-client"

export async function POST(request: NextRequest) {
  let body: any = null
  
  try {
    console.log("[AI INSIGHTS] Starting AI analysis...")
    
    body = await request.json()
    const { documentText, documentType, extractedData } = body

    if (!documentText || documentText.length < 10) {
      return NextResponse.json(
        { error: "Document text is required and must be substantial" },
        { status: 400 }
      )
    }

    console.log("[AI INSIGHTS] Analyzing document:", {
      textLength: documentText.length,
      documentType,
      hasExtractedData: !!extractedData
    })

    // Create a comprehensive prompt for document analysis
    const prompt = `You are a financial document analysis expert. Analyze this ${documentType || 'business'} document and provide insights.

Document Text:
${documentText.substring(0, 3000)}${documentText.length > 3000 ? '...' : ''}

${extractedData ? `
Extracted Data:
- Amount: ${extractedData.amount ? '$' + extractedData.amount.toLocaleString() : 'Not found'}
- Vendor: ${extractedData.vendor || 'Not found'}
- Date: ${extractedData.date || 'Not found'}
- Category: ${extractedData.category || 'Not found'}
` : ''}

Please provide a comprehensive analysis including:

## Document Summary
Brief overview of what this document is and its purpose.

## Key Financial Information
- Main amounts and what they represent
- Important dates and deadlines
- Vendor/merchant information
- Payment methods or account details

## Business Expense Analysis
- Is this a legitimate business expense?
- What tax category would this fall under?
- Potential deduction amount
- Required documentation status

## Action Items
- Any follow-up actions needed
- Missing information that should be obtained
- Compliance or record-keeping recommendations

## Risk Assessment
- Any red flags or concerns
- Compliance issues
- Documentation quality

Keep your analysis concise but thorough. Use bullet points and clear sections.`

    // Call Bedrock for AI analysis using the correct method
    const aiResponse = await bedrockClient.generateResponse(prompt)
    
    if (!aiResponse || !aiResponse.trim()) {
      console.log('[AI INSIGHTS] Empty AI response – using heuristic categorisation')
      const heuristic = buildHeuristicAnalysis(documentText, extractedData)
      return NextResponse.json(heuristic)
    }

    // If we have AI response, still attach heuristic summary for quick parsing
    const heuristic = buildHeuristicAnalysis(documentText, extractedData)

    return NextResponse.json({
      insights: aiResponse,
      heuristic,
      metadata: {
        documentType,
        textLength: documentText.length,
        analysisDate: new Date().toISOString(),
        model: "claude-3-sonnet"
      }
    })

  } catch (error) {
    console.error("[AI INSIGHTS] Error generating insights:", error)
    const heuristic = buildHeuristicAnalysis(body?.documentText || '', body?.extractedData)
    return NextResponse.json({
      insights: null,
      heuristic,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        model: "claude-3-sonnet",
        analysisDate: new Date().toISOString()
      }
    })
  }
}

function buildHeuristicAnalysis(text: string, extractedData: any) {
  const summary: any = {
    amount: extractedData?.amount || extractAmount(text),
    vendor: extractedData?.vendor || extractVendor(text),
    date: extractedData?.date || extractDate(text),
    category: guessCategory(text),
    businessExpense: true // Always business for now
  }
  return summary
}

function extractAmount(text: string): number | null {
  const match = text.match(/\$([\d,.]+)/)
  if (!match) return null
  const cleaned = match[1].replace(/,/g, '')
  return parseFloat(cleaned)
}

function extractVendor(text: string): string | null {
  const known = ['CHASE', 'AMAZON', 'APPLE', 'ADOBE', 'MICROSOFT']
  for (const vendor of known) {
    if (text.toUpperCase().includes(vendor)) return vendor
  }
  return null
}

function extractDate(text: string): string | null {
  const match = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/)
  return match ? match[1] : null
}

function guessCategory(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('aws') || lower.includes('amazon')) return 'cloud'
  if (lower.includes('adobe') || lower.includes('creative')) return 'software'
  if (lower.includes('uber') || lower.includes('lyft')) return 'transport'
  if (lower.includes('hotel') || lower.includes('inn')) return 'travel'
  if (lower.includes('restaurant') || lower.includes('dining')) return 'meals'
  return 'uncategorized'
}

export const dynamic = 'force-dynamic'
