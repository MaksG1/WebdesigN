const express = require('express');
const { body, validationResult } = require('express-validator');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

const loggerMiddleware = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
};
app.use(loggerMiddleware);

app.use(express.urlencoded({ extended: true }));

const recipeValidationRules = [
    body('name')
        .notEmpty().withMessage('Назва рецепту є обов’язковою.')
        .isLength({ min: 3, max: 50 }).withMessage('Назва має містити від 3 до 50 символів.'),

    body('ingredients')
        .optional()
        .isLength({ max: 100 }).withMessage('Список інгредієнтів має бути до 100 символів.'),

    body('cookingTime')
        .notEmpty().withMessage('Час приготування є обов’язковим.')
        .isInt({ min: 5, max: 300 }).withMessage('Час приготування має бути числом від 5 до 300 хвилин.'),

    body('difficulty')
        .notEmpty().withMessage('Складність є обов’язковою.')
        .isIn(['easy', 'medium', 'hard']).withMessage('Складність має бути: easy, medium або hard.')
];

async function renderForm(req, res, data = {}, successMessage = null) {
    try {
        let html = await fs.readFile(path.join(__dirname, 'views', 'form.html'), 'utf-8');
        
        const eq = (a, b) => a === b;
        
        let formHTML = html
            .replace(/\{\{formData\.name\}\}/g, data.name || '')
            .replace(/\{\{formData\.ingredients\}\}/g, data.ingredients || '')
            .replace(/\{\{formData\.cookingTime\}\}/g, data.cookingTime || '');
            
        formHTML = formHTML
            .replace(/\{\{#if \(eq formData\.difficulty 'easy'\)\}\}/g, eq(data.difficulty, 'easy') ? 'selected' : '')
            .replace(/\{\{#if \(eq formData\.difficulty 'medium'\)\}\}/g, eq(data.difficulty, 'medium') ? 'selected' : '')
            .replace(/\{\{#if \(eq formData\.difficulty 'hard'\)\}\}/g, eq(data.difficulty, 'hard') ? 'selected' : '')
            .replace(/\{\{#unless formData\.difficulty\}\}/g, !data.difficulty ? 'selected' : '');

        formHTML = formHTML
            .replace(/\{\{#if successMessage\}\}/g, successMessage ? '' : ''); 

        const replaceError = (field, errors) => {
            const error = errors.find(err => err.path === field);
            if (error) {
                return `<p class="error">${error.msg}</p>`;
            }
            return '';
        };

        const errorData = data.errors || [];
        formHTML = formHTML
            .replace(/\{\{#if errors\.name\}\}[\s\S]*?\{\{\/if\}\}/g, replaceError('name', errorData))
            .replace(/\{\{#if errors\.ingredients\}\}[\s\S]*?\{\{\/if\}\}/g, replaceError('ingredients', errorData))
            .replace(/\{\{#if errors\.cookingTime\}\}[\s\S]*?\{\{\/if\}\}/g, replaceError('cookingTime', errorData))
            .replace(/\{\{#if errors\.difficulty\}\}[\s\S]*?\{\{\/if\}\}/g, replaceError('difficulty', errorData));

        formHTML = formHTML.replace(/\{\{[^}]+\}\}/g, '');
        
        res.send(formHTML);
    } catch (e) {
        console.error('Error rendering form:', e);
        res.status(500).send('Помилка сервера при завантаженні форми.');
    }
}

app.get('/', (req, res) => {
    renderForm(req, res, {});
});

app.post('/add-recipe', recipeValidationRules, async (req, res) => {
    const errors = validationResult(req);
    const formData = req.body;

    if (!errors.isEmpty()) {
        const errorMap = errors.array();
        
        return renderForm(req, res, { 
            ...formData, 
            errors: errorMap 
        });
    }

    try {
        const dataJson = await fs.readFile(DATA_FILE, 'utf-8');
        const recipes = JSON.parse(dataJson);
        
        const newRecipe = {
            id: Date.now(),
            name: formData.name,
            ingredients: formData.ingredients,
            cookingTime: parseInt(formData.cookingTime, 10),
            difficulty: formData.difficulty,
            createdAt: new Date().toISOString()
        };

        recipes.push(newRecipe);

        await fs.writeFile(DATA_FILE, JSON.stringify(recipes, null, 2), 'utf-8');
        renderForm(req, res, {}, `✅ Рецепт "${newRecipe.name}" успішно додано!`);
        
    } catch (error) {
        console.error('Помилка при збереженні даних:', error);
        renderForm(req, res, formData, 'Помилка сервера: Не вдалося зберегти дані у файл data.json.');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});