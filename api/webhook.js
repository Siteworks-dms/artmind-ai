// api/webhook.js
// Stripe sends events here after payments
// Verifies signature, then adds credits to the user's account

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Disable body parsing — Stripe needs the raw body to verify signature
export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end',  () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await getRawBody(req)
  const sig     = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  // ── Handle events ────────────────────────────────────────
  try {
    switch (event.type) {

      // One-time payment completed
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.payment_status === 'paid') {
          await handleCreditsAdd(
            session.metadata?.supabase_user_id,
            parseInt(session.metadata?.credits_to_add ?? '0'),
            session.id,
            'one_time'
          )
        }
        break
      }

      // Subscription payment succeeded (monthly renewal)
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        if (invoice.billing_reason === 'subscription_cycle') {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
          await handleCreditsAdd(
            subscription.metadata?.supabase_user_id,
            parseInt(subscription.metadata?.credits_to_add ?? '0'),
            invoice.id,
            'subscription_renewal'
          )
        }
        break
      }

      // Subscription cancelled
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const userId = subscription.metadata?.supabase_user_id
        if (userId) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'cancelled' })
            .eq('id', userId)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error('Error processing webhook:', err)
    return res.status(500).json({ error: 'Internal error processing webhook' })
  }

  return res.status(200).json({ received: true })
}

// ── Add credits + log payment ─────────────────────────────
async function handleCreditsAdd(userId, creditsToAdd, stripeRef, type) {
  if (!userId || !creditsToAdd) return

  // Add credits via Supabase function
  const { error } = await supabase.rpc('add_credits', {
    p_user_id: userId,
    p_amount:  creditsToAdd,
  })
  if (error) console.error('add_credits error:', error)

  // Log the payment
  await supabase.from('payments').insert({
    user_id:       userId,
    stripe_ref:    stripeRef,
    credits_added: creditsToAdd,
    type,
    created_at:    new Date().toISOString(),
  })
}
