const express = require('express');
const router = express.Router();
const Review = require('./models/Review');

// Pobierz wszystkie opinie dla danego produktu
router.get('/:productId', async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId });
        res.json(reviews);
    } catch (error) {
        console.error('Błąd podczas pobierania opinii:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Dodaj nową opinię
router.post('/', async (req, res) => {
    try {
        const { productId, rating } = req.body;

        if (!productId || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Nieprawidłowe dane opinii' });
        }

        const review = new Review({
            productId,
            rating
        });

        await review.save();
        res.status(201).json(review);
    } catch (error) {
        console.error('Błąd podczas dodawania opinii:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Usuń wszystkie opinie dla danego produktu
router.delete('/:productId', async (req, res) => {
    try {
        await Review.deleteMany({ productId: req.params.productId });
        res.status(200).json({ message: 'Wszystkie opinie dla produktu zostały usunięte' });
    } catch (error) {
        console.error('Błąd podczas usuwania opinii:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

module.exports = router; 