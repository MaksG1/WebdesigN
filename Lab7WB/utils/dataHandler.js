const fs = require('fs/promises');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'schedule.json');

/**
 * @returns {Promise<Array>}
 */
async function readData() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        console.error('Помилка читання JSON-файлу:', error);
        throw new Error('Не вдалося прочитати дані з бази даних.');
    }
}

/**
 * @param {Array} data 
 */
async function writeData(data) {
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Помилка запису JSON-файлу:', error);
        throw new Error('Не вдалося зберегти дані у базу даних.');
    }
}

/**
 * @param {Array} currentData 
 * @returns {number}
 */
function getNextId(currentData) {
    if (currentData.length === 0) return 1;
    const maxId = currentData.reduce((max, item) => Math.max(max, item.id || 0), 0);
    return maxId + 1;
}

module.exports = {
    readData,
    writeData,
    getNextId
};