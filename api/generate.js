// api/generate.js
// Vercel serverless function — proxies image generation requests
// API keys live here in Vercel env vars, never in the browser

import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client using SERVICE ROLE key (can bypass RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── 1. Authenticate the user via their Supabase JWT ──────
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token. Please sign in again.' })
  }

  // ── 2. Check user has enough credits ─────────────────────
  const { data: credits, error: creditsError } = await supabase
    .from('credits')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  if (creditsError || !credits) {
    return res.status(400).json({ error: 'Could not retrieve your credit balance.' })
  }

  if (credits.balance < 1) {
    return res.status(402).json({
      error: 'INSUFFICIENT_CREDITS',
      message: 'You have no credits remaining. Please top up to continue generating.',
    })
  }

  // ── 3. Parse request body ─────────────────────────────────
  const { prompt, model, provider, size } = req.body

  if (!prompt || !model || !provider || !size) {
    return res.status(400).json({ error: 'Missing required fields: prompt, model, provider, size' })
  }

  // ── 4. Call the AI provider ───────────────────────────────
  let imageUrls = []

  try {
    if (provider === 'openai') {
      imageUrls = await generateOpenAI(prompt, model, size)
    } else if (provider === 'stability') {
      imageUrls = await generateStability(prompt, model, size)
    } else if (provider === 'hf') {
      imageUrls = await generateHuggingFace(prompt, model)
    } else {
      return res.status(400).json({ error: `Unknown provider: ${provider}` })
    }
  } catch (err) {
    console.error('AI generation error:', err)
    return res.status(500).json({ error: err.message || 'Image generation failed.' })
  }

  // ── 5. Deduct 1 credit ────────────────────────────────────
  const { error: deductError } = await supabase.rpc('deduct_credit', {
    p_user_id: user.id,
  })

  if (deductError) {
    console.error('Credit deduction error:', deductError)
    // Still return images — don't punish user for DB error
  }

  // ── 6. Save generation to history ────────────────────────
  await supabase.from('generations').insert({
    user_id:      user.id,
    prompt,
    model,
    provider,
    size,
    image_url:    imageUrls[0] ?? null,
    credits_used: 1,
  })

  // ── 7. Return images ──────────────────────────────────────
  return res.status(200).json({ images: imageUrls })
}

// ── OpenAI DALL-E ─────────────────────────────────────────
async function generateOpenAI(prompt, model, size) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API key not configured on server.')

  const n = model === 'dall-e-3' ? 1 : 1 // DALL-E 3 only supports n=1

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, prompt, n, size, response_format: 'url' }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `OpenAI error ${res.status}`)
  return data.data.map(d => d.url)
}

// ── Stability AI ──────────────────────────────────────────
async function generateStability(prompt, engineId, size) {
  const apiKey = process.env.STABILITY_API_KEY
  if (!apiKey) throw new Error('Stability AI API key not configured on server.')

  const [width, height] = size.split('x').map(Number)

  const res = await fetch(
    `https://api.stability.ai/v1/generation/${engineId}/text-to-image`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt, weight: 1 }],
        cfg_scale: 7,
        width,
        height,
        samples: 1,
        steps: 30,
      }),
    }
  )

  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `Stability AI error ${res.status}`)
  return data.artifacts.map(a => `data:image/png;base64,${a.base64}`)
}

// ── Hugging Face ──────────────────────────────────────────
async function generateHuggingFace(prompt, model) {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) throw new Error('Hugging Face API key not configured on server.')

  const res = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err.error || `Hugging Face error ${res.status}`
    throw new Error(
      res.status === 503
        ? `${msg} — Model is loading, please wait 20 seconds and try again.`
        : msg
    )
  }

  // HF returns raw image bytes
  const buffer = await res.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  return [`data:image/png;base64,${base64}`]
}
