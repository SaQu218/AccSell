require('dotenv').config();  // Załaduj zmienne środowiskowe


const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Twój klucz tajny Stripe
const jwt = require('jsonwebtoken');
const productsRouter = require('./api/products');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// Obsługa plików statycznych (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));  // Upewnij się, że pliki HTML są w folderze 'public'

app.use(cors({
    origin: ['https://acc-sell.vercel.app', 'http://localhost:3020'], // dodaj oba adresy
    methods: ['GET', 'POST'],
    credentials: true, // dodaj to
    allowedHeaders: ['Content-Type']
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Konfiguracja sesji
app.use(session({
    secret: process.env.SESSION_SECRET || 'twojSuperSekretnyKlucz',
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true w produkcji
        httpOnly: true,
        sameSite: 'none', // dodaj to dla cross-site
        maxAge: 24 * 60 * 60 * 1000,
        domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : 'localhost'
    },
    proxy: true // dodaj to dla Vercel
}));

// Middleware do ustawienia nagłówków CORS dla każdego żądania
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.post('/api/create-checkout-session', async (req, res) => {
    const { product } = req.body;
    
    // Słownik cen dla różnych produktów
    const prices = {
        'Konto Facebook 2009': 4000, // 40 zł w groszach
        'Konto Facebook 2012': 4500, // 45 zł w groszach
        'Konto Instagram 50k Follow': 4000, // 40 zł w groszach
        'Konto Instagram 195K Follow': 18000, // 180 zł w groszach
        'Konto Steam 2009': 12000, // 120 zł w groszach
        'Konto Steam 2019': 5000, // 50 zł w groszach
        'Konto Steam 2023 prime cs2': 9000 // 90 zł w groszach
    };

    const price = prices[product];
    if (!price) {
        return res.status(400).json({ error: 'Nieprawidłowy produkt' });
    }
    
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'pln',
                        product_data: {
                            name: product,
                        },
                        unit_amount: price,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.BASE_URL}/success.html`,
            cancel_url: `${process.env.BASE_URL}/cancel.html`,
        });

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
        // Sprawdź, czy możemy pobrać użytkowników
        return Users.find().limit(1);
    })
    .then(users => {
        console.log('Połączenie z kolekcją użytkowników działa');
        if (users.length > 0) {
            console.log('Znaleziono użytkowników w bazie');
        } else {
            console.log('Baza jest pusta');
        }
    })
    .catch((err) => {
        console.error('Błąd połączenia z MongoDB Atlas:', err);
        console.error('URI (ukryty):', mongoURI ? 'URI istnieje' : 'URI nie istnieje');
    });

// Dodaj obsługę błędów połączenia
mongoose.connection.on('error', (err) => {
    console.error('Błąd połączenia MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB rozłączone');
});

// Schemat użytkownika
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    ip: String,
    lastLoginIp: String
});

const Users = mongoose.model('Dane', userSchema);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Główna strona logowania
});

// Funkcja do pobierania rzeczywistego IP użytkownika
const getClientIp = (req) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        // Pobierz pierwszy adres IP z listy (najbardziej zaufany)
        return forwardedFor.split(',')[0].trim();
    }
    return req.ip || req.connection.remoteAddress;
};

app.post('/register', async (req, res) => {
    const { username, email, password, confirm_password } = req.body;
    const userIp = getClientIp(req);

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
        ip: userIp,
        lastLoginIp: userIp
    });

    try {
        await user.save();
        console.log('Użytkownik zapisany:', user);
        res.redirect('/welcome.html');
    } catch (err) {
        console.error(err);
        res.send('Wystąpił błąd podczas zapisywania użytkownika');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const userIp = getClientIp(req);

    try {
        const user = await Users.findOne({ username });

        if (!user) {
            return res.status(400).json({ message: 'Nieprawidłowa nazwa użytkownika' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Nieprawidłowe hasło' });
        }

        // Aktualizuj IP użytkownika
        user.lastLoginIp = userIp;
        await user.save();

        // Generujemy token JWT
        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email },
            process.env.JWT_SECRET || 'twojTajnyKlucz',
            { expiresIn: '24h' }
        );

        res.status(200).json({ 
            message: 'Zalogowano pomyślnie',
            token,
            user: {
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Błąd podczas logowania:', error);
        res.status(500).json({ message: 'Wystąpił błąd podczas logowania' });
    }
});

// Nowy middleware do weryfikacji tokenu
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Brak autoryzacji' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'twojTajnyKlucz');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Nieprawidłowy token' });
    }
};

// Endpoint sprawdzania zalogowania z użyciem tokenu
app.get('/is_logged_in', verifyToken, (req, res) => {
    res.json({ 
        loggedIn: true, 
        user: {
            username: req.user.username,
            email: req.user.email
        }
    });
});

app.get('/welcome.html', verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'welcome.html'));  // Strona powitalna
});

// Endpoint wylogowania
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Błąd podczas wylogowywania' });
        }
        res.clearCookie('connect.sid', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none'
        });
        res.json({ message: 'Wylogowano pomyślnie' });
    });
});

// Strony powitalne, home, settings itp.
app.get('/home.html', verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));  // Strona główna
});

app.get('/setting_profile.html', verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'setting_profile.html'));  // Ustawienia profilu
});

// Strona logowania
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));  // Strona logowania
});

app.get('/konto_fb.html', verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'konto_fb.html'));  // Strona logowania
});

app.get('/konto_ig.html', verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'konto_ig.html'));  // Strona logowania
});

app.get('/success.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'success.html')); // Strona sukcesu po płatności
});

app.get('/cancel.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cancel.html')); // Strona anulowania płatności
});

app.get('/konto_steam.html', verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'konto_steam.html'));  // Strona logowania
});

app.get('/kup.html', verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'kup.html'));  // Strona logowania
});

// Strona rejestracji
app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));  // Strona rejestracji
});

// Endpoint aktualizacji profilu z użyciem tokenu
app.post('/update_profile', verifyToken, async (req, res) => {
    const { newUsername, newEmail, newPassword } = req.body;
    try {
        const user = await Users.findById(req.user.id);

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
        res.status(200).json({ message: 'Dane zostały zaktualizowane', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Wystąpił błąd podczas aktualizacji danych' });
    }
});

// Dodaj router produktów
app.use('/api/products', verifyToken, productsRouter);

// Uruchomienie serwera
app.listen(port, () => {
    console.log(`Serwer działa na porcie ${port}`);
});
