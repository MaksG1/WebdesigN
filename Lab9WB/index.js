const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const flash = require('connect-flash');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = 3000;
const USERS_FILE = path.join(__dirname, 'users.json');

/**
 * @returns {Promise<Array>} 
 */
async function readUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        console.error("Помилка читання users.json:", error);
        return [];
    }
}

/**
 * @param {Array} users 
 * @returns {Promise<void>}
 */
async function writeUsers(users) {
    try {
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error("Помилка запису users.json:", error);
    }
}

function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    req.flash('error', 'Будь ласка, увійдіть, щоб отримати доступ до цієї сторінки.');
    res.redirect('/login');
}

function isNotAuthenticated(req, res, next) {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    next();
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'super_secret_key_change_me',
    resave: false,
    saveUninitialized: false, 
    cookie: { maxAge: 1000 * 60 * 60 * 24 } 
}));

app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success');
    res.locals.error_msg = req.flash('error');
    res.locals.isAuthenticated = !!req.session.userId;
    next();
});

const registrationValidation = [
    body('name')
        .isLength({ min: 3, max: 30 }).withMessage('ПІБ має бути від 3 до 30 символів.'),
    body('email')
        .isEmail().withMessage('Введіть коректний Email.'),
    body('password')
        .isLength({ min: 6 }).withMessage('Пароль має бути не менше 6 символів.'),
    body('confirm_password')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Паролі не збігаються.');
            }
            return true;
        }),
];

const loginValidation = [
    body('email')
        .isEmail().withMessage('Введіть коректний Email.'),
    body('password')
        .notEmpty().withMessage('Пароль обов\'язковий.'),
];

app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

app.get('/register', isNotAuthenticated, (req, res) => {
    res.render('register', {
        errors: req.flash('errors'),
        old: req.flash('old')[0] || {}
    });
});

app.post('/register', registrationValidation, async (req, res) => {
    const { name, email, password } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        req.flash('errors', errors.array().map(e => e.msg));
        req.flash('old', req.body);
        return res.redirect('/register');
    }

    const users = await readUsers();

    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        req.flash('errors', ['Користувач з цим Email вже зареєстрований.']);
        req.flash('old', req.body);
        return res.redirect('/register');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password: hashedPassword
        };

        users.push(newUser);
        await writeUsers(users); 

        req.flash('success', 'Реєстрація успішна! Тепер Ви можете увійти.');
        res.redirect('/login');
    } catch (err) {
        console.error("Помилка реєстрації:", err);
        req.flash('error', 'Виникла помилка при реєстрації.');
        res.redirect('/register');
    }
});

app.get('/login', isNotAuthenticated, (req, res) => {
    res.render('login', {
        errors: req.flash('errors'),
        old: req.flash('old')[0] || {}
    });
});

app.post('/login', loginValidation, async (req, res) => {
    const { email, password } = req.body;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        req.flash('errors', errors.array().map(e => e.msg));
        req.flash('old', { email });
        return res.redirect('/login');
    }

    const users = await readUsers();
    
    const user = users.find(u => u.email === email);

    if (!user) {
        req.flash('errors', ['Користувача з таким Email не знайдено.']);
        req.flash('old', { email });
        return res.redirect('/login');
    }

    try {
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            req.session.userId = user.id;
            req.session.userName = user.name; 
            req.flash('success', `Ласкаво просимо, ${user.name}!`);
            res.redirect('/dashboard');
        } else {
            req.flash('errors', ['Неправильний пароль.']);
            req.flash('old', { email });
            res.redirect('/login');
        }
    } catch (err) {
        console.error("Помилка входу:", err);
        req.flash('error', 'Виникла помилка при вході.');
        res.redirect('/login');
    }
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', {
        userName: req.session.userName || 'Користувач' 
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Помилка знищення сесії:', err);
            return res.redirect('/dashboard');
        }
        res.clearCookie('connect.sid'); // Очистити cookie сесії
        req.flash('success', 'Ви успішно вийшли з системи.');
        res.redirect('/login');
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});