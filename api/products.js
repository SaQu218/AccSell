const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');

// Upewnij się, że plik products.json istnieje
async function ensureProductsFile() {
    try {
        await fs.access(PRODUCTS_FILE);
    } catch {
        await fs.mkdir(path.dirname(PRODUCTS_FILE), { recursive: true });
        await fs.writeFile(PRODUCTS_FILE, '[]');
    }
}

// Pobierz wszystkie produkty
router.get('/', async (req, res) => {
    try {
        await ensureProductsFile();
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        const products = JSON.parse(data);
        res.json(products);
    } catch (error) {
        console.error('Błąd podczas pobierania produktów:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Dodaj nowy produkt
router.post('/', async (req, res) => {
    try {
        await ensureProductsFile();
        const { type, name, description, price } = req.body;

        if (!type || !name || !description || !price) {
            return res.status(400).json({ error: 'Wszystkie pola są wymagane' });
        }

        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        const products = JSON.parse(data);
        
        const newProduct = {
            id: Date.now().toString(),
            type,
            name,
            description,
            price: parseFloat(price)
        };

        products.push(newProduct);
        await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
        
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Błąd podczas dodawania produktu:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

module.exports = router; 