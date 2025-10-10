const http = require('http'); // Для створення сервера
const fs = require('fs');     // Для роботи з файловою системою

const hostname = '127.0.0.1';
const port = 3000;

// --- Дані Студента та Файлова Система ---
const studentData = {
    "name": "Максим",
    "group": "КН-31",
    "message": "Я вчуся працювати з Node.js!"
};
const jsonFilePath = 'student.json';
// Перетворюємо об'єкт на JSON-рядок для відповіді та запису
const studentJsonString = JSON.stringify(studentData, null, 2);

// Функція для запису даних у файл при першому запуску
function initializeStudentFile() {
    if (!fs.existsSync(jsonFilePath)) {
        try {
            // Використовуємо синхронний запис, оскільки це відбувається лише під час запуску
            fs.writeFileSync(jsonFilePath, studentJsonString, 'utf8');
            console.log(`✅ Дані студента записано у файл: ${jsonFilePath}`);
        } catch (err) {
            console.error(`❌ Помилка запису файлу ${jsonFilePath}:`, err);
            process.exit(1); // Аварійне завершення, якщо не вдалося записати критичний файл
        }
    } else {
        console.log(`ℹ️ Файл ${jsonFilePath} вже існує. Використовуємо існуючі дані.`);
    }
}

// Функція-генератор HTML для маршруту /student/html
function generateStudentHtml(data) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Інформація про Студента</title>
            <meta charset="utf-8">
            <style>
                body { font-family: sans-serif; padding: 20px; }
                table { border-collapse: collapse; width: 60%; margin-top: 20px; }
                th, td { border: 1px solid #999; padding: 10px; text-align: left; }
                th { background-color: #f0f0f0; }
            </style>
        </head>
        <body>
            <h1>🧑‍💻 Дані Студента</h1>
            <table>
                <tr>
                    <th>Параметр</th>
                    <th>Значення</th>
                </tr>
                <tr>
                    <td>Ім'я</td>
                    <td>${data.name}</td>
                </tr>
                <tr>
                    <td>Група</td>
                    <td>${data.group}</td>
                </tr>
                <tr>
                    <td>Повідомлення</td>
                    <td>${data.message}</td>
                </tr>
            </table>
            <p><a href="/">← На Головну</a></p>
        </body>
        </html>
    `;
}
// --- Кінець функцій ---

const server = http.createServer((req, res) => {
    // Обробка маршрутів
    if (req.url === '/') {
        // Маршрут: / (головна сторінка)
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`
            <html>
            <head><title>Головна</title><meta charset="utf-8"></head>
            <body>
                <h1>👋 Головна Сторінка</h1>
                <p>Перелік маршрутів:</p>
                <ul>
                    <li><a href="/about">/about</a></li>
                    <li><a href="/student">/student</a> (JSON)</li>
                    <li><a href="/student/html">/student/html</a> (HTML)</li>
                </ul>
            </body>
            </html>
        `);
    } else if (req.url === '/about') {
        // Маршрут: /about
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`
            <html>
            <head><title>Про Нас</title><meta charset="utf-8"></head>
            <body>
                <h1>ℹ️ Про нас</h1>
                <p>Цей сервер створено за допомогою Node.js.</p>
                <p><a href="/">На Головну</a></p>
            </body>
            </html>
        `);
    } else if (req.url === '/student') {
        // 1. НОВИЙ МАРШРУТ: /student (виводить JSON)
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(studentJsonString);
    } else if (req.url === '/student/html') {
        // 2. НОВИЙ МАРШРУТ: /student/html (виводить HTML)
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(generateStudentHtml(studentData));
    } else {
        // Інші маршрути (404 Not Found)
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`
            <html>
            <head><title>404</title><meta charset="utf-8"></head>
            <body>
                <h1>❌ 404 - Сторінку не знайдено</h1>
                <p>Маршрут ${req.url} не існує.</p>
                <p><a href="/">На Головну</a></p>
            </body>
            </html>
        `);
    }
});

// 1. Запис даних у файл при першому запуску
initializeStudentFile();

// 2. Запуск сервера
server.listen(port, hostname, () => {
    console.log(`Сервер запущено: http://${hostname}:${port}/`);
});