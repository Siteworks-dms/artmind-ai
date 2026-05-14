// api/generate.js
// Proxies image generation + saves to Supabase Storage for gallery

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // ── 1. Auth ───────────────────────────────────────────
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  // ── 2. Check credits ──────────────────────────────────
  const { data: credits } = await supabase
    .from('credits')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  if (!credits || credits.balance < 1) {
    return res.status(402).json({
      error: 'INSUFFICIENT_CREDITS',
      message: 'No credits remaining. Please top up.',
    })
  }

  // ── 3. Parse body ─────────────────────────────────────
  const { prompt, model, provider, size } = req.body
  if (!prompt || !model || !provider || !size) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // ── 4. Generate image ─────────────────────────────────
  let imageUrls = []
  try {
    if (provider === 'openai')    imageUrls = await generateOpenAI(prompt, model, size)
    else if (provider === 'stability') imageUrls = await generateStability(prompt, model, size)
    else if (provider === 'hf')   imageUrls = await generateHuggingFace(prompt, model)
    else return res.status(400).json({ error: `Unknown provider: ${provider}` })
  } catch (err) {
    console.error('Generation error:', err)
    return res.status(500).json({ error: err.message || 'Generation failed' })
  }

  // ── 5. Save to Supabase Storage ───────────────────────
  const savedUrls = []
  for (const url of imageUrls) {
    try {
      const storedUrl = await saveToStorage(url, user.id)
      savedUrls.push(storedUrl ?? url)
    } catch {
      savedUrls.push(url) // fallback to original URL
    }
  }

  // ── 6. Deduct credit ──────────────────────────────────
  await supabase.rpc('deduct_credit', { p_user_id: user.id })

  // ── 7. Save to generations table ─────────────────────
  await supabase.from('generations').insert({
    user_id:      user.id,
    prompt,
    model,
    provider,
    size,
    image_url:    savedUrls[0] ?? null,
    credits_used: 1,
  })

  return res.status(200).json({ images: savedUrls })
}

// ── Save image URL to Supabase Storage ───────────────────
async function saveToStorage(imageUrl, userId) {
  // Fetch the image
  let imageBuffer
  let contentType = 'image/png'

  if (imageUrl.startsWith('data:')) {
    // Base64 data URL
    const [meta, data] = imageUrl.split(',')
    contentType = meta.split(':')[1].split(';')[0]
    imageBuffer = Buffer.from(data, 'base64')
  } else {
    // Remote URL — fetch it
    const response = await fetch(imageUrl)
    if (!response.ok) throw new Error('Failed to fetch image')
    contentType = response.headers.get('content-type') || 'image/png'
    imageBuffer = Buffer.from(await response.arrayBuffer())
  }

  const filename = `${userId}/${Date.now()}.png`
  const { data, error } = await supabase.storage
    .from('generations')
    .upload(filename, imageBuffer, {
      contentType,
      upsert: false,
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('generations')
    .getPublicUrl(filename)

  return publicUrl
}

// ── OpenAI ────────────────────────────────────────────────
async function generateOpenAI(prompt, model, size) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API key not configured')
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, prompt, n: 1, size, response_format: 'url' }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `OpenAI error ${res.status}`)
  return data.data.map(d => d.url)
}

// ── Stability AI ──────────────────────────────────────────
async function generateStability(prompt, engineId, size) {
  const apiKey = process.env.STABILITY_API_KEY
  if (!apiKey) throw new Error('Stability AI API key not configured')
  const [width, height] = size.split('x').map(Number)
  const res = await fetch(`https://api.stability.ai/v1/generation/${engineId}/text-to-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    body: JSON.stringify({ text_prompts: [{ text: prompt, weight: 1 }], cfg_scale: 7, width, height, samples: 1, steps: 30 }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `Stability AI error ${res.status}`)
  return data.artifacts.map(a => `data:image/png;base64,${a.base64}`)
}

// ── Hugging Face ──────────────────────────────────────────
async function generateHuggingFace(prompt, model) {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) throw new Error('Hugging Face API key not configured')
  const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: prompt }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HuggingFace error ${res.status}${res.status === 503 ? ' — model loading, retry in 20s' : ''}`)
  }
  const buffer = await res.arrayBuffer()
  return [`data:image/png;base64,${Buffer.from(buffer).toString('base64')}`]
}
