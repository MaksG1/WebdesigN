const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { readData, writeData, getNextId } = require('./utils/dataHandler');

const app = express();
const PORT = 3000;
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/schedule', async (req, res) => {
    try {
        let schedule = await readData();
        const filter = req.query.day; 
        
        if (filter) {
            schedule = schedule.filter(item => 
                item.day.toLowerCase().includes(filter.toLowerCase())
            );
        }
        
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ error: 'Помилка отримання даних.' });
    }
});
app.get('/api/schedule/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const schedule = await readData();
        const item = schedule.find(i => i.id === id);

        if (item) {
            res.json(item);
        } else {
            res.status(404).json({ error: 'Запис не знайдено.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Помилка отримання даних.' });
    }
});

app.post('/api/schedule', async (req, res) => {
    const { day, subject, time, room } = req.body;

    if (!day || !subject || !time || !room) {
        return res.status(400).json({ error: 'Потрібні всі поля: day, subject, time, room.' });
    }

    try {
        const schedule = await readData();
        const newId = getNextId(schedule);
        
        const newItem = {
            id: newId,
            day,
            subject,
            time,
            room
        };

        schedule.push(newItem);
        await writeData(schedule);
        
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ error: 'Помилка додавання запису.' });
    }
});

app.put('/api/schedule/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const updatedFields = req.body;

    try {
        const schedule = await readData();
        const itemIndex = schedule.findIndex(i => i.id === id);

        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Запис для оновлення не знайдено.' });
        }
        schedule[itemIndex] = { ...schedule[itemIndex], ...updatedFields, id };
        
        await writeData(schedule);
        res.json(schedule[itemIndex]);

    } catch (error) {
        res.status(500).json({ error: 'Помилка оновлення запису.' });
    }
});
app.delete('/api/schedule/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        let schedule = await readData();
        const initialLength = schedule.length;
        schedule = schedule.filter(i => i.id !== id);

        if (schedule.length < initialLength) {
            await writeData(schedule);
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Запис для видалення не знайдено.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Помилка видалення запису.' });
    }
});
app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
    console.log(`API доступно за маршрутом: http://localhost:${PORT}/api/schedule`);
});