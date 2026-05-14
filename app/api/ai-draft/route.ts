import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const { fieldName, currentValue, documentType, documentTitle } = await request.json()

  if (!fieldName || !documentType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const systemPrompt = `You are an editorial assistant for a Berlin art guide. Write concise, engaging, and authoritative art editorial copy in English. Keep descriptions precise and evocative — this is for a sophisticated Berlin art audience. Never use clichés. Maximum 150 words unless asked for more.`

  const userPrompt = `Write editorial copy for the "${fieldName}" field of a ${documentType} document titled "${documentTitle}".${currentValue ? `\n\nExisting draft to improve:\n${currentValue}` : '\n\nWrite a fresh draft.'}`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ draft: text })
  } catch {
    return NextResponse.json({ error: 'AI generation failed' }, { status: 502 })
  }
}
