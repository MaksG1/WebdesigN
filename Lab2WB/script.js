  const API_URL_RANDOM = "https://api.adviceslip.com/advice";
const resultContainer = document.getElementById("result");

 /**
 * @param {Array<Object>} adviceSlips
 * @param {string} title 
 */
function displayAdvice(adviceSlips, title) {
    let html = `<h2>${title}</h2>`;
    
    adviceSlips.forEach(slip => {
        html += `
            <div class="advice-card">
                <p><strong>ID ${slip.slip_id}:</strong> ${slip.advice}</p>
            </div>
        `;
    });

    resultContainer.innerHTML = html;
}

document.getElementById("btnFetchRandom").addEventListener("click", async () => {
    resultContainer.innerHTML = "<p>Завантаження випадкової поради через Fetch...</p>";
    try {
        const response = await fetch(API_URL_RANDOM);
        if (!response.ok) {

            throw new Error(`Помилка HTTP: ${response.status}`);
        }
        const data = await response.json();
        const singleSlip = [data.slip];
        displayAdvice(singleSlip, "✨ Випадкова порада (Fetch)");

    } catch (error) {
        console.error("Помилка fetch:", error);
        resultContainer.innerHTML = `<p style="color: red;">Помилка: Не вдалося завантажити пораду. ${error.message}</p>`;
    }
});

document.getElementById("btnAxiosTop5").addEventListener("click", async () => {
    resultContainer.innerHTML = "<p>Завантаження ТОП-5 порад через Axios...</p>";
    const requests = [];
    const NUM_ADVICE = 5;

    for (let i = 0; i < NUM_ADVICE; i++) {
        const requestPromise = new Promise(resolve => setTimeout(resolve, i * 50)).then(() => axios.get(API_URL_RANDOM));
        requests.push(requestPromise);
    }

    try {
        const responses = await axios.all(requests);
        
        const top5Slips = responses.map(response => response.data.slip);
        
        const uniqueSlips = [];
        const seenIds = new Set();
        for (const slip of top5Slips) {
            if (!seenIds.has(slip.slip_id)) {
                uniqueSlips.push(slip);
                seenIds.add(slip.slip_id);
            }
        }

        displayAdvice(uniqueSlips, `🌟 "ТОП-${uniqueSlips.length}" унікальних порад (Axios)`);

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Помилка Axios:", error.message);
            resultContainer.innerHTML = `<p style="color: red;">Помилка Axios: Не вдалося завантажити поради. ${error.message}</p>`;
        } else {
            console.error("Загальна помилка:", error);
            resultContainer.innerHTML = `<p style="color: red;">Загальна помилка: ${error.message}</p>`;
        }
    }
});