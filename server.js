require('dotenv').config();  // Załaduj zmienne środowiskowe

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Twój klucz tajny Stripe

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// Obsługa plików statycznych (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));  // Upewnij się, że pliki HTML są w folderze 'public'

app.use(cors({
    origin: 'https://acc-sell.vercel.app',  // Możesz to zmienić na konkretną domenę
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Konfiguracja sesji
app.use(session({
    secret: process.env.SESSION_SECRET || 'twojSuperSekretnyKlucz',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Tylko w produkcji
        httpOnly: true,  // Zabezpiecza ciasteczka przed dostępem z JS
        maxAge: 24 * 60 * 60 * 1000  // Czas życia ciasteczka: 1 dzień
    }
}));
app.post('/api/create-checkout-session', async (req, res) => {
    const { product } = req.body;  // Otrzymujesz nazwę produktu, np. "Facebook 2009"
    
    try {
        // Tworzenie sesji Stripe Checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'pln', // Waluta
                        product_data: {
                            name: product, // Nazwa produktu
                        },
                        unit_amount: 4000, // Cena w groszach (4000 groszy = 40 zł)
                    },
                    quantity: 1, // Ilość produktu
                },
            ],
            mode: 'payment', // Typ sesji (płatność)
            success_url: `${process.env.BASE_URL}/success.html`,  // URL, gdzie użytkownik trafia po pomyślnym zakończeniu transakcji
            cancel_url: `${process.env.BASE_URL}/cancel.html`,    // URL, gdzie użytkownik trafia po anulowaniu transakcji
        });

        // Zwracamy ID sesji Stripe
        res.status(200).json({ id: session.id });
    } catch (error) {
        console.error('Błąd podczas tworzenia sesji Stripe:', error.message);
        res.status(500).json({ error: error.message });
    }
});

const port = process.env.PORT || 3020;

// Zmienna środowiskowa z URI
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => {
        console.log('Połączenie z MongoDB Atlas powiodło się');
    })
    .catch((err) => {
        console.error('Błąd połączenia z MongoDB Atlas:', err);
    });

// Schemat użytkownika
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
});

const Users = mongoose.model('Dane', userSchema);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Główna strona logowania
});

app.post('/register', async (req, res) => {
    const { username, email, password, confirm_password } = req.body;

    if (password !== confirm_password) {
        return res.send('Hasła nie są takie same!');
    }

    const existingUser = await Users.findOne({ username });
    if (existingUser) {
        return res.send('Użytkownik o tej nazwie już istnieje!');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new Users({
        username,
        email,
        password: hashedPassword,
    });

    try {
        await user.save();
        console.log('Użytkownik zapisany:', user);
        res.redirect('/welcome.html');  // Zmieniono na .html
    } catch (err) {
        console.error(err);
        res.send('Wystąpił błąd podczas zapisywania użytkownika');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await Users.findOne({ username });

    if (!user) {
        return res.status(400).json({ message: 'Nieprawidłowa nazwa użytkownika' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Nieprawidłowe hasło' });
    }

    // Ustawienie sesji
    req.session.user = {
        id: user._id,
        username: user.username,
        email: user.email
    };

    console.log('Zalogowany użytkownik:', req.session.user);  // Sprawdź, czy sesja została prawidłowo ustawiona

    res.status(200).json({ message: 'Zalogowano pomyślnie' });
});

// Sprawdzanie, czy użytkownik jest zalogowany
function isLoggedIn(req, res, next) {
    if (req.session.user) {
        return next();  // Kontynuuj, jeśli użytkownik jest zalogowany
    }
    console.log('Brak sesji użytkownika, przekierowanie na index.html');
    res.redirect('/index.html');  // Zmieniono na index.html
}

app.get('/is_logged_in', (req, res) => {
    if (req.session && req.session.user) {
        console.log('Zalogowany użytkownik:', req.session.user); // Sprawdź, czy sesja jest poprawna
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        console.log('Brak aktywnej sesji');  // Sprawdź, dlaczego sesja jest pusta
        res.json({ loggedIn: false });
    }
});

app.get('/welcome.html', isLoggedIn, (req, res) => {
    console.log('Sesja użytkownika:', req.session);  // Dodaj logowanie sesji
    res.sendFile(path.join(__dirname, 'public', 'welcome.html'));  // Strona powitalna
});

// Wylogowanie
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Błąd podczas wylogowywania' });
        }
        res.clearCookie('connect.sid');  // Usuwanie ciasteczka sesji
        res.json({ message: 'Wylogowano pomyślnie' });
    });
});

// Strony powitalne, home, settings itp.
app.get('/home.html', isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));  // Strona główna
});

app.get('/setting_profile.html', isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'setting_profile.html'));  // Ustawienia profilu
});

// Strona logowania
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));  // Strona logowania
});

app.get('/konto_fb.html', isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'konto_fb.html'));  // Strona logowania
});

app.get('/konto_ig.html', isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'konto_ig.html'));  // Strona logowania
});

app.get('/success.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'success.html')); // Strona sukcesu po płatności
});

app.get('/cancel.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cancel.html')); // Strona anulowania płatności
});

app.get('/konto_steam.html', isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'konto_steam.html'));  // Strona logowania
});

app.get('/kup.html', isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'kup.html'));  // Strona logowania
});

// Strona rejestracji
app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));  // Strona rejestracji
});

// Ustawienia profilu
app.post('/update_profile', isLoggedIn, async (req, res) => {
    const { newUsername, newEmail, newPassword } = req.body;
    const userId = req.session.user.id;

    try {
        const user = await Users.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
        }

        if (newUsername) user.username = newUsername;
        if (newEmail) user.email = newEmail;
        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
        }

        await user.save();

        // Zaktualizowanie danych w sesji
        req.session.user.username = user.username;
        req.session.user.email = user.email;

        res.status(200).json({ message: 'Dane zostały zaktualizowane', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Wystąpił błąd podczas aktualizacji danych' });
    }
});

// Uruchomienie serwera
app.listen(port, () => {
    console.log(`Serwer działa na porcie ${port}`);
});
