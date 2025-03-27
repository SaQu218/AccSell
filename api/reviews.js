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
        const { productId, rating, content } = req.body;

        if (!productId || !rating || !content || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Nieprawidłowe dane opinii' });
        }

        const review = new Review({
            productId,
            rating,
            content,
            author: 'Anonimowy' // Domyślna wartość
        });

        await review.save();
        res.status(201).json(review);
    } catch (error) {
        console.error('Błąd podczas dodawania opinii:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Usuń pojedynczą opinię po ID
router.delete('/single/:reviewId', async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.reviewId);
        res.status(200).json({ message: 'Opinia została usunięta' });
    } catch (error) {
        console.error('Błąd podczas usuwania opinii:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Usuń wszystkie opinie dla danego produktu
router.delete('/product/:productId', async (req, res) => {
    try {
        await Review.deleteMany({ productId: req.params.productId });
        res.status(200).json({ message: 'Wszystkie opinie dla produktu zostały usunięte' });
    } catch (error) {
        console.error('Błąd podczas usuwania opinii:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

module.exports = router; 