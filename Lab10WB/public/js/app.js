// public/js/app.js

const API_BASE = '/api';
let taskChart; 
let currentFilter = 'all';

// --- Функції CRUD ---

async function fetchTasks() {
    try {
        const response = await fetch(`${API_BASE}/tasks`);
        if (response.status === 401) {
            window.location.href = '/login.html';
            return [];
        }
        return response.json();
    } catch (error) {
        console.error('Помилка завантаження завдань:', error);
        return [];
    }
}

async function addTask(title, priority) {
    const response = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority })
    });
    const data = await response.json();
    if (response.ok) {
        // Унікальне повідомлення
        console.log("Додано нове завдання: " + title); 
        await loadTasksAndStats();
    } else {
        alert('Помилка: ' + (data.errors ? data.errors.join(', ') : data.message));
    }
}

async function updateTask(id, updates) {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    if (response.ok) {
        await loadTasksAndStats();
    } else {
        alert('Помилка оновлення завдання. Спробуйте пізніше.');
    }
}

async function deleteTask(id) {
    if (confirm('Ви точно бажаєте видалити це важливе завдання?')) { // Унікальне повідомлення
        const response = await fetch(`${API_BASE}/tasks/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            await loadTasksAndStats();
        } else {
            alert('Помилка видалення завдання.');
        }
    }
}

// --- Відображення та Фільтрація ---

function renderTasks(tasks) {
    const ul = document.getElementById('tasks-ul');
    if (!ul) return; 

    ul.innerHTML = '';
    
    // Фільтрація, включаючи унікальний фільтр "Високий пріоритет"
    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'completed') return task.completed;
        if (currentFilter === 'pending') return !task.completed;
        if (currentFilter === 'high-priority') return task.priority === 'Висока'; // Унікальний фільтр
        return true;
    });

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';
        li.dataset.id = task.id;

        li.innerHTML = `
            <span class="title" contenteditable="false">${task.title}</span>
            <span class="priority" style="color: ${getPriorityColor(task.priority)};">(${task.priority})</span>
            <div class="actions">
                <button class="toggle-btn">${task.completed ? '❌ Скасувати' : '✅ Виконати'}</button>
                <button class="edit-btn">✍️ Редагувати</button>
                <button class="delete-btn">🗑️ Видалити</button>
            </div>
        `;
        ul.appendChild(li);
    });
}

// --- Утиліта для кольорів пріоритету ---
function getPriorityColor(priority) {
    switch(priority) {
        case 'Висока': return '#e74c3c'; // Червоний
        case 'Середня': return '#f39c12'; // Помаранчевий
        case 'Низька': return '#2ecc71'; // Зелений
        default: return '#34495e';
    }
}

// --- Статистика (Chart.js) ---

function updateStats(tasks) {
    const completedCount = tasks.filter(t => t.completed).length;
    const totalCount = tasks.length;
    const pendingCount = totalCount - completedCount;

    const data = {
        labels: ['Виконано', 'Не виконано'],
        datasets: [{
            data: [completedCount, pendingCount],
            backgroundColor: ['#2ecc71', '#e74c3c'], // Унікальні кольори
            hoverOffset: 8
        }]
    };

    const config = {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: `Ваш прогрес: ${totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)}%` } // Унікальне повідомлення
            }
        }
    };

    const ctx = document.getElementById('taskChart');
    if (!ctx) return;
    
    if (taskChart) {
        taskChart.data = data;
        taskChart.update();
    } else {
        taskChart = new Chart(ctx.getContext('2d'), config);
    }
}

async function loadTasksAndStats() {
    const tasks = await fetchTasks();
    renderTasks(tasks);
    updateStats(tasks);
}

// --- Утиліта для повідомлень ---
function displayMessage(containerId, message, type = 'success') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `<p class="${type}">${message}</p>`;
    // Стилізовано у CSS
}

// --- Обробники подій (Головна логіка) ---

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- Логіка Аутентифікації ---
    
    // 1. Обробник форми РЕЄСТРАЦІЇ
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const response = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                displayMessage('message-container', data.message, 'success'); // Унікальне повідомлення
                registerForm.reset(); 
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000); 

            } else {
                let errorMessage = data.message || 'Невідома помилка реєстрації.';
                if (data.errors && data.errors.length > 0) {
                    errorMessage = data.errors.join('<br>');
                }
                displayMessage('message-container', `❌ ${errorMessage}`, 'error');
            }
        });
    }

    // 2. Обробник форми ВХОДУ
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                window.location.href = '/dashboard.html';
            } else {
                const errorMessage = data.message || 'Помилка входу. Невірні дані.'; // Унікальне повідомлення
                displayMessage('message-container', `⚠️ ${errorMessage}`, 'error');
            }
        });
    }

    // --- Логіка Дашборду ---
    
    const dashboardElement = document.getElementById('welcome-message');
    if (dashboardElement) {
        // Захист та Вітання
        const meResponse = await fetch(`${API_BASE}/me`);
        const meData = await meResponse.json();

        if (!meData.loggedIn) {
            window.location.href = '/login.html';
            return;
        }

        // Відображення ПІБ (Унікальний елемент)
        dashboardElement.textContent = `Вітаємо, ${meData.userName}! 👋`;

        // Завантаження завдань
        await loadTasksAndStats();

        // Обробник форми додавання
        const addTaskForm = document.getElementById('add-task-form');
        if (addTaskForm) {
            addTaskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const title = document.getElementById('task-title').value.trim();
                const priority = document.getElementById('task-priority').value;
                if (title) {
                    addTask(title, priority);
                    document.getElementById('task-title').value = '';
                }
            });
        }

        // Обробник списку завдань (Toggle, Edit, Delete)
        const tasksUl = document.getElementById('tasks-ul');
        if (tasksUl) {
            tasksUl.addEventListener('click', async (e) => {
                const li = e.target.closest('li');
                if (!li) return;
                const id = li.dataset.id;
                
                if (e.target.classList.contains('toggle-btn')) {
                    const isCompleted = !li.classList.contains('completed');
                    await updateTask(id, { completed: isCompleted });
                } 
                else if (e.target.classList.contains('delete-btn')) {
                    await deleteTask(id);
                }
                else if (e.target.classList.contains('edit-btn')) {
                    const titleSpan = li.querySelector('.title');
                    const isEditing = titleSpan.contentEditable === 'true';

                    if (!isEditing) {
                        titleSpan.contentEditable = 'true';
                        titleSpan.focus();
                        e.target.textContent = '💾 Зберегти';
                    } else {
                        titleSpan.contentEditable = 'false';
                        e.target.textContent = '✍️ Редагувати';
                        const newTitle = titleSpan.textContent.trim();
                        if (newTitle) {
                             await updateTask(id, { title: newTitle });
                        }
                    }
                }
            });
        }

        // Обробник виходу
        document.getElementById('logout-btn').addEventListener('click', async () => {
            const response = await fetch(`${API_BASE}/logout`);
            const data = await response.json();
            // Унікальне повідомлення (використовуємо alert, оскільки перенаправляємо)
            alert(data.message); 
            window.location.href = '/login.html';
        });

        // Обробник фільтрів
        const filterBtns = document.querySelectorAll('#filters button');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                currentFilter = btn.dataset.filter;
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                loadTasksAndStats();
            });
        });
        document.querySelector('[data-filter="all"]').classList.add('active');
    }
});