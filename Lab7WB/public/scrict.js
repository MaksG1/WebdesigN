const API_URL = '/api/schedule';
const scheduleList = document.getElementById('schedule-list');
const scheduleForm = document.getElementById('schedule-form');
const itemIdInput = document.getElementById('item-id');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const filterDayInput = document.getElementById('filter-day');
const filterBtn = document.getElementById('filter-btn');
const resetFilterBtn = document.getElementById('reset-filter-btn');

/**
 * @param {string} filterQuery 
 */
async function fetchSchedule(filterQuery = '') {
    scheduleList.innerHTML = 'Завантаження...';
    try {
        const response = await fetch(`${API_URL}${filterQuery}`);
        const data = await response.json();
        renderSchedule(data);
    } catch (error) {
        console.error('Помилка отримання розкладу:', error);
        scheduleList.innerHTML = '<p style="color: red;">Помилка завантаження даних.</p>';
    }
}
scheduleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = itemIdInput.value;
    const isUpdate = id !== '';
    const method = isUpdate ? 'PUT' : 'POST';
    const url = isUpdate ? `${API_URL}/${id}` : API_URL;

    const data = {
        day: document.getElementById('day').value,
        subject: document.getElementById('subject').value,
        time: document.getElementById('time').value,
        room: document.getElementById('room').value,
    };

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            scheduleForm.reset();
            resetFormState();
            fetchSchedule();
        } else {
            const errorData = await response.json();
            alert(`Помилка: ${errorData.error || 'Невідома помилка операції.'}`);
        }
    } catch (error) {
        console.error('Помилка запиту:', error);
        alert('Помилка зв\'язку з сервером.');
    }
});
async function deleteItem(id) {
    if (!confirm(`Ви впевнені, що хочете видалити запис ID: ${id}?`)) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.status === 204) {
            fetchSchedule(); // Оновлюємо список
        } else {
            const errorData = await response.json();
            alert(`Помилка видалення: ${errorData.error || 'Запис не знайдено.'}`);
        }
    } catch (error) {
        console.error('Помилка DELETE-запиту:', error);
        alert('Помилка зв\'язку з сервером.');
    }
}

function fillFormForUpdate(item) {
    formTitle.textContent = `Оновити Запис ID: ${item.id}`;
    submitBtn.textContent = 'Зберегти зміни';
    itemIdInput.value = item.id;
    document.getElementById('day').value = item.day;
    document.getElementById('subject').value = item.subject;
    document.getElementById('time').value = item.time;
    document.getElementById('room').value = item.room;
    cancelBtn.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' }); 
}
function resetFormState() {
    formTitle.textContent = 'Додати Новий Запис';
    submitBtn.textContent = 'Додати Запис';
    itemIdInput.value = '';
    cancelBtn.classList.add('hidden');
    scheduleForm.reset();
}

cancelBtn.addEventListener('click', resetFormState);
window.deleteItem = deleteItem;
window.fillFormForUpdate = fillFormForUpdate;

filterBtn.addEventListener('click', () => {
    const day = filterDayInput.value.trim();
    if (day) {
        fetchSchedule(`?day=${encodeURIComponent(day)}`);
    } else {
        fetchSchedule();
    }
});

resetFilterBtn.addEventListener('click', () => {
    filterDayInput.value = '';
    fetchSchedule();
});
function renderSchedule(schedule) {
    scheduleList.innerHTML = '';
    
    if (schedule.length === 0) {
        scheduleList.innerHTML = '<p>Розклад порожній або не знайдено записів за заданим фільтром.</p>';
        return;
    }

    schedule.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        itemCard.dataset.id = item.id;

        itemCard.innerHTML = `
            <div class="item-details">
                <h3>${item.day}, ${item.time}</h3>
                <p><strong>Предмет:</strong> ${item.subject}</p>
                <p><strong>Аудиторія:</strong> ${item.room}</p>
                <p><small>ID: ${item.id}</small></p>
            </div>
            <div class="item-actions">
                <button class="action-btn secondary" onclick="fillFormForUpdate(${JSON.stringify(item).replace(/"/g, '&quot;')})">Редагувати</button>
                <button class="action-btn danger" onclick="deleteItem(${item.id})">Видалити</button>
            </div>
        `;
        scheduleList.appendChild(itemCard);
    });
}
document.addEventListener('DOMContentLoaded', () => {
    fetchSchedule();
});