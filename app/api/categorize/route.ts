import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const requestSchema = z.object({
  tickets: z.array(z.object({
    id: z.string().min(1).max(100),
    message: z.string().max(4000).default(''),
    note: z.string().max(4000).default(''),
    sourceTag: z.string().max(200).optional(),
  })).min(1).max(10),
})

const resultSchema = z.object({
  results: z.array(z.object({
    id: z.string(),
    category: z.string().min(1).max(120),
    subcategory: z.string().min(1).max(160),
    confidence: z.number().min(0).max(1),
    rationale: z.string().max(500),
  })),
})

const instructions = `You classify customer support tickets. Use BOTH the customer message and the agent closing note. Build a sensible taxonomy from the supplied batch; do not invent categories unrelated to the messages. Prefer concise categories such as Delivery & logistics, Returns & refunds, Billing & payments, Warranty & replacement, Product performance, or Other / uncertain. Return JSON only with this shape: {"results":[{"id":"...","category":"...","subcategory":"...","confidence":0.0,"rationale":"..."}]}. Confidence must reflect evidence: under 0.8 when the text is ambiguous or contradictory. Preserve every input id exactly.`

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json())
    const input = payload.tickets.map((ticket) => ({
      id: ticket.id,
      customer_message: ticket.message,
      agent_closing_note: ticket.note,
      existing_source_tag: ticket.sourceTag ?? null,
    }))
    const response = await generateText({
      model: google('gemini-3.5-flash-lite'),
      system: instructions,
      prompt: JSON.stringify(input),
      temperature: 0,
      maxOutputTokens: 1800,
    })
    const cleanedResponse = response.text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    const parsed = resultSchema.safeParse(JSON.parse(cleanedResponse))
    if (!parsed.success) return NextResponse.json({ error: 'Gemini returned an invalid classification payload.' }, { status: 502 })
    const requestedIds = new Set(payload.tickets.map((ticket) => ticket.id))
    const results = parsed.data.results.filter((result) => requestedIds.has(result.id))
    if (results.length !== payload.tickets.length) return NextResponse.json({ error: 'Gemini did not classify every requested ticket.' }, { status: 502 })
    return NextResponse.json({ model: 'google/gemini-3.5-flash-lite', results, requestSize: payload.tickets.length })
  } catch (error) {
    const message = error instanceof z.ZodError ? 'Request must contain between 1 and 10 tickets.' : 'Categorization is temporarily unavailable.'
    console.error('[v0] categorization request failed', error)
    return NextResponse.json({ error: message }, { status: error instanceof z.ZodError ? 400 : 500 })
  }
}

export const maxDuration = 30
