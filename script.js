const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'bar', // тип діаграми: 'line', 'bar', 'pie'
    data: {
        labels: ['СР', 'ЧТ', 'Пт', 'СБ', 'НД', 'ПН', 'ВТ'],
        datasets: [{
            label: 'Погода в Дублянах (Грицаюк М.)',
            data: [17, 18, 20, 24, 25, 25, 23],
            borderWidth: 1,
            backgroundColor: [
                'rgba(54, 214, 235, 0.86)', 
                'rgba(200, 255, 34, 1)',
                'rgba(244, 195, 34, 1)',
                'rgba(244, 143, 2, 1)',
                'rgba(234, 145, 1, 1)',
                'rgba(234, 141, 1, 1)',
                'rgba(1, 200, 193, 0.91)'
        ]
        }] 
         },
        options: {  responsive: true,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});