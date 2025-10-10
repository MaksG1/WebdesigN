const fs = require('fs').promises;
const path = require('path');

// --- ЗАДАЙТЕ СВОЇ ДАНІ ТУТ ---
const INPUT_FILE_NAME = 'mydata.txt'; // Файл, який ми створили раніше
const OUTPUT_FILE_NAME = 'result.txt';
const STUDENT_INFO = 'Непарний варіант — додано студентом [Грицаюк Максим]'; // Змініть на своє Прізвище та Ім'я

async function processFileAndSave() {
    try {
        // 1. Формування шляхів
        const inputPath = path.join(__dirname, INPUT_FILE_NAME);
        const outputPath = path.join(__dirname, OUTPUT_FILE_NAME);

        // 2. Зчитування даних з вхідного файлу
        // Використовуємо 'utf8' для отримання тексту, а не бінарних даних (Buffer)
        const originalContent = await fs.readFile(inputPath, 'utf8');

        // 3. Додавання нового рядка
        // Додаємо символ нового рядка (\n) перед новим текстом, щоб він починався з нового рядка
        const newContent = originalContent + '\n' + STUDENT_INFO;
        
        console.log(`✅ Дані з файлу '${INPUT_FILE_NAME}' зчитано.`);
        console.log(`✅ Додано рядок: "${STUDENT_INFO}"`);

        // 4. Збереження результату у новий файл
        await fs.writeFile(outputPath, newContent, 'utf8');

        console.log(`\n🎉 Результат успішно збережено у файл '${OUTPUT_FILE_NAME}'`);

    } catch (error) {
        // Обробка помилок (наприклад, якщо вхідний файл не існує)
        console.error('❌ Виникла помилка під час обробки файлу:', error.message);
        console.error('Перевірте, чи існує вхідний файл:', INPUT_FILE_NAME);
    }
}

processFileAndSave();