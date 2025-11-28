const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const db = require('./utils/db');
const path = require ('path');

const app = express();
const PORT = 5000;
const SALT_ROUNDS = 10;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(session({
    secret: 'todo_app_super_secret_key_lab10',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ message: "У Вас немає доступу. Сесія недійсна, спробуйте увійти знову." });
}

app.post('/api/register', [
    body('name').isLength({ min: 3 }).withMessage('ПІБ має бути мінімум 3 символи.'),
    body('email').isEmail().withMessage('Введіть коректний Email.'),
    body('password').isLength({ min: 6 }).withMessage('Пароль має бути не менше 6 символів.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array().map(e => e.msg) });
    }

    const { name, email, password } = req.body;

    try {
        const users = await db.read('users.json');
        
        if (users.find(user => user.email === email)) {
            return res.status(409).json({ message: "Вибачте, цей Email вже зайнятий іншим користувачем." });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password: hashedPassword
        };

        users.push(newUser);
        await db.write('users.json', users);

        res.status(201).json({ message: "✅ Реєстрація пройшла успішно! Ласкаво просимо до нашої команди." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Помилка сервера. Спробуйте повторити запит." });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: "Email та пароль обов'язкові." });
    }

    try {
        const users = await db.read('users.json');
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(404).json({ message: "Користувач з таким Email не знайдений." });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            req.session.userId = user.id;
            req.session.userName = user.name; 
            res.json({ message: "🎉 Вхід виконано успішно!", name: user.name });
        } else {
            res.status(401).json({ message: "На жаль, пароль невірний. Спробуйте ще раз." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Помилка сервера під час входу." });
    }
});

app.get('/api/me', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ 
            loggedIn: true, 
            userId: req.session.userId, 
            userName: req.session.userName
        });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Помилка виходу з системи. Не вдалося знищити сесію." });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "👋 Ви успішно вийшли з системи. До зустрічі!" });
    });
});

app.get('/api/tasks', isAuthenticated, async (req, res) => {
    try {
        const tasks = await db.read('tasks.json');
        const userTasks = tasks.filter(task => task.userId === req.session.userId);
        res.json(userTasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Помилка отримання завдань. Зверніться до адміністратора." });
    }
});

app.post('/api/tasks', isAuthenticated, [
    body('title').isLength({ min: 1, max: 255 }).withMessage('Заголовок має бути не порожнім.'),
    body('priority').isIn(['Висока', 'Середня', 'Низька']).withMessage('Некоректний пріоритет.') // Додаткове поле
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array().map(e => e.msg) });
    }
    
    const { title, priority } = req.body;
    
    const newTask = {
        id: Date.now().toString(),
        userId: req.session.userId, 
        title,
        completed: false,
        createdAt: new Date().toISOString(),
        priority 
    };

    try {
        const tasks = await db.read('tasks.json');
        tasks.push(newTask);
        await db.write('tasks.json', tasks);
        res.status(201).json(newTask);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Помилка додавання завдання. Спробуйте пізніше, будь ласка." });
    }
});

app.put('/api/tasks/:id', isAuthenticated, async (req, res) => {
    const taskId = req.params.id;
    const { title, completed, priority } = req.body;

    try {
        let tasks = await db.read('tasks.json');
        const taskIndex = tasks.findIndex(t => t.id === taskId);

        if (taskIndex === -1) {
            return res.status(404).json({ message: "Завдання не знайдено." });
        }

        const task = tasks[taskIndex];
        
        if (task.userId !== req.session.userId) {
            return res.status(403).json({ message: "✋ Доступ заборонено. Ви не є власником цього завдання." });
        }

        if (title !== undefined) task.title = title;
        if (completed !== undefined) task.completed = completed;
        if (priority !== undefined) task.priority = priority; // Оновлення пріоритету
        
        tasks[taskIndex] = task;

        await db.write('tasks.json', tasks);
        res.json(task);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Помилка оновлення завдання. Перевірте дані." });
    }
});

app.delete('/api/tasks/:id', isAuthenticated, async (req, res) => {
    const taskId = req.params.id;

    try {
        let tasks = await db.read('tasks.json');
        const taskToDelete = tasks.find(t => t.id === taskId);
        
        if (!taskToDelete) {
            return res.status(404).json({ message: "Завдання не знайдено." });
        }
        
        if (taskToDelete.userId !== req.session.userId) {
            return res.status(403).json({ message: "✋ Доступ заборонено. Ви не є власником цього завдання." });
        }

        tasks = tasks.filter(t => t.id !== taskId);
        await db.write('tasks.json', tasks);
        
        res.json({ message: "🗑️ Завдання успішно видалено. Так тримати!" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Помилка видалення завдання." });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});