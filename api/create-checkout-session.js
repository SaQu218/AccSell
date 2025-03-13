
// Używamy require do zaimportowania Stripe
const stripe = require('stripe')('sk_test_51R2HeHDFinv4XW4HiOmJ9xDiLsit5j9GS31hAgOZk7II5KlzaSFW1hnB2U0NWcnjNzwZHtwSXzbPgvIjCqATN9SE00RjiI8n5r'); // Wklej swój klucz tajny Stripe

// Obsługa zapytań do API
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Zdejmujemy produkt z ciała żądania
      const { product } = req.body;

      // Tworzymy sesję Stripe checkout
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'], // Metody płatności
        line_items: [
          {
            price_data: {
              currency: 'pln', // Waluta
              product_data: {
                name: product, // Nazwa produktu
              },
              unit_amount: 4000, // Cena w groszach (40 zł = 4000 groszy)
            },
            quantity: 1, // Ilość
          },
        ],
        mode: 'payment', // Tryb płatności
        success_url: `${process.env.BASE_URL}/success`, // URL po sukcesie
        cancel_url: `${process.env.BASE_URL}/cancel`,   // URL po anulowaniu
      });

      // Zwracamy ID sesji do klienta
      res.status(200).json({ id: session.id });
    } catch (error) {
      // W przypadku błędu zwracamy 500 i komunikat
      res.status(500).json({ error: error.message });
    }
  } else {
    // Jeśli nie jest to metoda POST, zwróć błąd 405
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
