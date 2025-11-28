const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

async function read(filename) {
    const filePath = path.join(DATA_DIR, filename);
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        console.error(`Помилка читання ${filename}:`, error.message);
        return [];
    }
}

async function write(filename, data) {
    const filePath = path.join(DATA_DIR, filename);
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Помилка запису ${filename}:`, error.message);
        throw new Error(`Неможливо записати дані у файл ${filename}`);
    }
}

module.exports = {
    read,
    write
};