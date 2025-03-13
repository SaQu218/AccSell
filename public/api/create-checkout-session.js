const stripe = require('stripe')('sk_test_51R2HeHDFinv4XW4HiOmJ9xDiLsit5j9GS31hAgOZk7II5KlzaSFW1hnB2U0NWcnjNzwZHtwSXzbPgvIjCqATN9SE00RjiI8n5r'); // Wklej swój klucz tajny Stripe

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        const { product } = req.body;

        try {
            // Tworzymy sesję Stripe Checkout
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'pln',
                            product_data: {
                                name: product,  // Produkt z parametru 'product'
                            },
                            unit_amount: 5000, // Cena w groszach (np. 50 PLN = 5000 groszy)
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${req.headers.origin}/success.html`, // Adres po udanej płatności
                cancel_url: `${req.headers.origin}/cancel.html`,  // Adres po anulowanej płatności
            });

            // Zwracamy identyfikator sesji do frontendu
            res.status(200).json({ id: session.id });
        } catch (err) {
            console.error(err);
            res.status(500).send('Błąd podczas tworzenia sesji płatności');
        }
    } else {
        // Obsługuje tylko metodę POST
        res.status(405).send('Method Not Allowed');
    }
};