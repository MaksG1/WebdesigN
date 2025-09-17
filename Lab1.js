const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'bar', // тип діаграми: 'line', 'bar', 'pie'
    data: {
        labels: ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер'],
        datasets: [{
            label: 'Продажі (шт)',
            data: [12, 19, 3, 5, 2, 3],
            borderWidth: 1,
            backgroundColor: 'rgba(54, 162, 235, 0.6)'
        }]
    },
    options: {