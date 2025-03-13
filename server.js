require('dotenv').config();  // Załaduj zmienne środowiskowe

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cookieParser = require('cookie-parser');

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
        secure: process.env.NODE_ENV === 'production', // Ustawienie secure na true tylko w produkcji
        httpOnly: true,  // Zabezpiecza ciasteczka przed dostępem z JS
        maxAge: 24 * 60 * 60 * 1000  // Opcjonalnie ustaw datę wygaśnięcia ciasteczka na 1 dzień
    }
}));

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
        res.redirect('/welcome');
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
    res.redirect('/index');  // Przekierowanie na stronę logowania, jeśli użytkownik nie jest zalogowany
}
app.get('/is_logged_in', (req, res) => {
    if (req.session.user) {
        return res.json({
            loggedIn: true,
            username: req.session.user.username
        });
    }
    res.json({ loggedIn: false });
});

app.get('/welcome', isLoggedIn, (req, res) => {
    console.log('Sesja użytkownika:', req.session);  // Dodaj logowanie sesji
    res.sendFile(path.join(__dirname, 'public', 'welcome.html'));  // Strona powitalna
});
// Wylogowanie
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Błąd podczas wylogowywania' });
        }
        res.clearCookie('connect.sid'); // Usuwanie ciasteczka sesji
        res.json({ message: 'Wylogowano pomyślnie' });
    });
});


// Strony powitalne, home, settings itp.
app.get('/home', isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));  // Strona główna
});

app.get('/setting_profile', isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'setting_profile.html'));  // Ustawienia profilu
});

// Strona logowania
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));  // Strona logowania
});

app.get('/konto_fb', isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'konto_fb.html'));  // Strona logowania
});

app.get('/konto_ig', isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'konto_ig.html'));  // Strona logowania
});

app.get('/konto_steam', isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'konto_steam.html'));  // Strona logowania
});

app.get('/kup', isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'kup.html'));  // Strona logowania
});

// Strona rejestracji
app.get('/register', (req, res) => {
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
