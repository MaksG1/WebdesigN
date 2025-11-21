const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const STUDENT_DATA_PATH = path.join(__dirname, 'student.json');

const initialStudentData = {
    name: "Ім'я Студента",
    group: "Група Студента",
    message: "Дані успішно ініціалізовано."
};

async function initializeData() {
    try {
        await fs.access(STUDENT_DATA_PATH);
        console.log('Файл student.json знайдено. Ініціалізація не потрібна.');
    } catch (error) {
        console.log('Файл student.json не знайдено. Створення...');
        await fs.writeFile(
            STUDENT_DATA_PATH,
            JSON.stringify(initialStudentData, null, 4),
            'utf-8'
        );
        console.log('Файл student.json успішно ініціалізовано.');
    }
}

initializeData().catch(console.error);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/student', async (req, res) => {
    try {
        const data = await fs.readFile(STUDENT_DATA_PATH, 'utf-8');
        const student = JSON.parse(data);
        
        res.send(`
            <!DOCTYPE html>
            <html lang="uk">
            <head>
                <meta charset="UTF-8">
                <title>Інформація про Студента</title>
                <link rel="stylesheet" href="style.css">
            </head>
            <body>
                <div class="container">
                    <h1>🎓 Дані про Студента</h1>
                    <p><strong>Ім'я:</strong> ${student.name}</p>
                    <p><strong>Група:</strong> ${student.group}</p>
                    <p><strong>Повідомлення:</strong> ${student.message}</p>
                    <hr>
                    <a href="/">Назад на головну</a>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send('Помилка читання даних студента.');
    }
});

app.get('/json', async (req, res) => {
    try {
        const data = await fs.readFile(STUDENT_DATA_PATH, 'utf-8');
        const student = JSON.parse(data);
        res.json(student); 
    } catch (error) {
        res.status(500).json({ error: 'Помилка читання даних студента.' });
    }
});

app.post('/update', async (req, res) => {
    const { name, group, message } = req.body;

    if (!name || !group || !message) {
        return res.status(400).send('Потрібно заповнити всі поля.');
    }

    const updatedData = { name, group, message };

    try {
        await fs.writeFile(
            STUDENT_DATA_PATH,
            JSON.stringify(updatedData, null, 4),
            'utf-8'
        );
        console.log('Дані студента оновлено:', updatedData);
        res.redirect('/student');
    } catch (error) {
        res.status(500).send('Помилка запису даних.');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});