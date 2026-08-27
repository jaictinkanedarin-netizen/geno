export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items, totalAmount } = req.body;

  try {
    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ error: 'PayMongo secret key is missing in environment variables.' });
    }

    // Auth header for PayMongo (Secret Key encoded in base64)
    const authHeader = 'Basic ' + Buffer.from(secretKey + ':').toString('base64');

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: items.map(item => ({
              currency: 'PHP',
              amount: Math.round(parseFloat(item.price) * 100), // convert PHP to centavos
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

    if (!response.ok) {
      return res.status(response.status).json({ error: data.errors?.[0]?.detail || 'PayMongo API Error' });
    }

    return res.status(200).json({ checkoutUrl: data.data.attributes.checkout_url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
