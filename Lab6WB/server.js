const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;
    
let tasks = [
    { id: 1, title: 'Завершити лабораторну роботу', description: 'Розробити API та фронтенд', status: 'active' },
    { id: 2, title: 'Купити продукти', description: 'Молоко, хліб, яйця', status: 'active' },
    { id: 3, title: 'Перевірити пошту', description: 'Відповісти на важливі листи', status: 'done' }
];
let nextId = tasks.length > 0 ? tasks[tasks.length - 1].id + 1 : 1;
const loggerMiddleware = (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
};

app.use(loggerMiddleware);
app.use(bodyParser.json()); 
app.use(express.static(path.join(__dirname, 'public'))); 

app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

app.get('/api/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find(t => t.id === id);

    if (task) {
        res.json(task);
    } else {
        res.status(404).json({ error: 'Завдання не знайдено' });
    }
});
app.post('/api/tasks', (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({ error: 'Потрібні поля title та description' });
    }

    const newTask = {
        id: nextId++,
        title,
        description,
        status: 'active'
    };

    tasks.push(newTask);
    res.status(201).json(newTask); 
});

app.put('/api/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { title, description, status } = req.body;
    let task = tasks.find(t => t.id === id);

    if (!task) {
        return res.status(404).json({ error: 'Завдання не знайдено' });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined && (status === 'active' || status === 'done')) {
        task.status = status;
    }

    res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const initialLength = tasks.length;
    
    tasks = tasks.filter(t => t.id !== id);

    if (tasks.length < initialLength) {
        res.status(204).send(); 
    } else {
        res.status(404).json({ error: 'Завдання не знайдено' });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
});