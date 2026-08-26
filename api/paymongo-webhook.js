import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const event = req.body;

  // Verify PayMongo Payment Intent Succeeded Event
  if (event.data.attributes.type === 'payment_intent.succeeded') {
    const paymentIntentId = event.data.attributes.data.id;

    // Update order status in Supabase
    const { error } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('paymongo_payment_intent_id', paymentIntentId);

    if (error) return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ received: true });
}
