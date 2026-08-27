// File location: /api/paymongo.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { items, totalAmount } = req.body;

  try {
    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: items.map(item => ({
              currency: 'PHP',
              amount: Math.round(item.price * 100), // Cents conversion
              description: item.description || 'Marketplace Item',
              name: item.title,
              quantity: 1
            })),
            payment_method_types: ['card', 'gcash', 'paymaya', 'grab_pay'],
            success_url: 'https://geno-three.vercel.app/',
            cancel_url: 'https://geno-three.vercel.app/'
          }
        }
      })
    });

    const data = await response.json();
    return res.status(200).json({ checkoutUrl: data.data.attributes.checkout_url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
