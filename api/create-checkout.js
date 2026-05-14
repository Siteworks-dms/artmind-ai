// api/create-checkout.js
// Creates a Stripe Checkout session and returns the URL

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// How many credits each price ID grants
const CREDIT_MAP = {
  [process.env.STRIPE_PRICE_STARTER]:  100,
  [process.env.STRIPE_PRICE_CREATOR]:  250,
  [process.env.STRIPE_PRICE_STUDIO]:   600,
  [process.env.STRIPE_PRICE_PRO]:      500, // monthly
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // ── Auth ────────────────────────────────────────────────
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  const { priceId } = req.body
  if (!priceId) return res.status(400).json({ error: 'Missing priceId' })

  // ── Get or create Stripe customer ───────────────────────
  let customerId
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.stripe_customer_id) {
    customerId = profile.stripe_customer_id
  } else {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email,
      name:  profile?.full_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    // Save customer ID to profile
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  // ── Determine if subscription or one-time ───────────────
  const isSubscription = priceId === process.env.STRIPE_PRICE_PRO
  const credits = CREDIT_MAP[priceId] ?? 0

  // ── Create Checkout Session ─────────────────────────────
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: isSubscription ? 'subscription' : 'payment',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
    metadata: {
      supabase_user_id: user.id,
      credits_to_add:   String(credits),
    },
    subscription_data: isSubscription ? {
      metadata: {
        supabase_user_id: user.id,
        credits_to_add:   String(credits),
      },
    } : undefined,
  })

  return res.status(200).json({ url: session.url })
}
