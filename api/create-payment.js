import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { productId, buyerId, amount } = req.body;

  try {
    // 1. Create PayMongo Payment Intent (GCash supported)
    const response = await fetch('https://api.paymongo.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY).toString('base64')}`
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.round(amount * 100), // Convert PHP to centavos
            payment_method_allowed: ['gcash', 'card'],
            currency: 'PHP',
            description: `Order for Product ID: ${productId}`
          }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.errors[0].detail);

    const paymentIntentId = data.data.id;
    const clientKey = data.data.attributes.client_key;

    // 2. Insert Pending Order in Supabase
    const { data: order, error } = await supabase.from('orders').insert([
      {
        buyer_id: buyerId,
        product_id: productId,
        amount: amount,
        paymongo_payment_intent_id: paymentIntentId,
        status: 'pending'
      }
    ]).select().single();

    if (error) throw error;

    return res.status(200).json({ clientKey, paymentIntentId, orderId: order.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
