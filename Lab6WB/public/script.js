const API_URL = '/api/tasks';
const tasksListContainer = document.getElementById('tasks-list');
const addTaskBtn = document.getElementById('add-task-btn');
    
async function fetchTasks() {
    try {
        const response = await fetch(API_URL);
        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        console.error('Помилка отримання завдань:', error);
        tasksListContainer.innerHTML = '<p style="color: red;">Не вдалося завантажити завдання.</p>';
    }
}

addTaskBtn.addEventListener('click', async () => {
    const titleInput = document.getElementById('task-title');
    const descInput = document.getElementById('task-description');
    
    const title = titleInput.value.trim();
    const description = descInput.value.trim();

    if (!title || !description) {
        alert('Будь ласка, введіть назву та опис завдання.');
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description })
        });
        
        if (response.ok) {
            titleInput.value = '';
            descInput.value = '';
            fetchTasks(); 
        } else {
            alert('Помилка при додаванні завдання.');
        }
    } catch (error) {
        console.error('Помилка POST-запиту:', error);
    }
});

async function toggleTaskStatus(taskId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'done' : 'active';
    try {
        const response = await fetch(`${API_URL}/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            fetchTasks(); 
        } else {
            alert('Помилка при зміні статусу.');
        }
    } catch (error) {
        console.error('Помилка PUT-запиту:', error);
    }
}
async function deleteTask(taskId) {
    if (!confirm('Ви впевнені, що хочете видалити це завдання?')) return;

    try {
        const response = await fetch(`${API_URL}/${taskId}`, {
            method: 'DELETE'
        });

        if (response.status === 204) { 
            fetchTasks(); 
        } else {
            alert('Помилка при видаленні завдання.');
        }
    } catch (error) {
        console.error('Помилка DELETE-запиту:', error);
    }
}
function renderTasks(tasks) {
    tasksListContainer.innerHTML = ''; 

    if (tasks.length === 0) {
        tasksListContainer.innerHTML = '<p>Список завдань порожній. Додайте перше!</p>';
        return;
    }

    tasks.forEach(task => {
        const item = document.createElement('div');
        item.className = `task-item ${task.status}`;
        item.dataset.id = task.id;

        const statusText = task.status === 'done' ? 'Виконано' : 'Активне';
        const toggleButtonText = task.status === 'done' ? 'Відновити' : 'Виконати';
        const toggleButtonClass = task.status === 'done' ? 'restore-btn' : 'toggle-btn';

        item.innerHTML = `
            <div class="task-info">
                <h3>[${statusText}] ${task.title}</h3>
                <p>${task.description}</p>
            </div>
            <div class="task-actions">
                <button class="${toggleButtonClass}" onclick="toggleTaskStatus(${task.id}, '${task.status}')">${toggleButtonText}</button>
                <button class="delete-btn" onclick="deleteTask(${task.id})">Видалити</button>
            </div>
        `;
        tasksListContainer.appendChild(item);
    });
}

document.addEventListener('DOMContentLoaded', fetchTasks);