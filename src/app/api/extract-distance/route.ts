import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json()

    if (!imageBase64) {
      return Response.json({ error: 'No image provided' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' })

    const prompt = `This is a screenshot from a running app (like Garmin, Nike Run Club, Strava, Samsung Health, Runkeeper, Apple Fitness, or similar).

Extract two values and return ONLY a JSON object with no markdown, no code block:

1. "distance": total running distance in km (number). If shown in miles, multiply by 1.60934. If not found, use null.
2. "date": the run date in YYYY-MM-DD format. If a time like "20:20" is shown with a date, use that date. If only relative ("today", "오늘") infer from context. If not found, use null.

Example output: {"distance":8.14,"date":"2026-06-26"}
Return ONLY the JSON, nothing else.`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: imageBase64,
        },
      },
    ])

    const text = result.response.text().trim()

    let parsed: { distance?: number | null; date?: string | null } = {}
    try {
      parsed = JSON.parse(text)
    } catch {
      // fallback: try to extract just a number (old behavior)
      const num = parseFloat(text)
      if (!isNaN(num)) parsed = { distance: num }
    }

    if (!parsed.distance) {
      return Response.json({ error: 'Could not detect distance in image' })
    }

    return Response.json({
      distance: Math.round(parsed.distance * 100) / 100,
      date: parsed.date ?? null,
    })
  } catch (err) {
    console.error('Gemini error:', err)
    return Response.json({ error: 'AI extraction failed' }, { status: 500 })
  }
}
