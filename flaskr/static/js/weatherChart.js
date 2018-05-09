// THIS MUST BE INITIALIZED AS NULL OR ELSE IOS BREAKS
var weatherChart = null;

// declare function with var to put it in window namespace. fixes ios issue
var drawChart = function(weatherDay) {
    var data = prepareData(weatherDay);
    
    // destroy pre-existing chart so that we dont overlap them
    if(weatherChart != null) {
        weatherChart.destroy();
    }
    var ctx = document.getElementById("weatherChart").getContext('2d');
    var config = {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Temperature',
                fill: false,
                data: data.tempData,
                borderColor: 'rgba(24, 86, 24, 1.0)',
                backgroundColor: 'rgba(24, 86, 24, 1.0)',
                yAxisID: 'temp'
            }, {
                label: 'Humidity',
                fill: false,
                data: data.humidData,
                borderColor: 'rgba(15, 23, 88, 1.0)',
                backgroundColor: 'rgba(15, 23, 88, 1.0)',
                yAxisID: 'humid'
            }]
        },
        options: {
            tooltips: {
                mode: 'nearest',
                intersect: false
            },
            responsive: true,
            maintainAspectRatio: false,
            title: {
                display: true,
                text: 'Temperature and Humidity for ' + weatherDay.dayOfWeek +
                        ', ' + weatherDay.date
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: 'hour'
                    },
                    gridLines: {
                        display: false
                    },
                    ticks: {
                        autoskip: false
                    }
                }],
                yAxes: [{
                    id: 'temp',
                    type: 'linear',
                    position: 'left',
                    gridLines: {
                        display: true
                    },
                    scaleLabel: {
                        display: true,
                        labelString: String.fromCharCode(176) + 'F'
                    }
                }, {
                    id: 'humid',
                    type: 'linear',
                    position: 'right',
                    gridLines: {
                        display: false
                    },
                    scaleLabel: {
                        display: true,
                        labelString: '% Humidity'
                    }
                }]
            }
        }
    };
    weatherChart = new Chart(ctx, config);
};

function prepareData(weatherDay) {
    var labels = [];
    var tempData = [];
    var humidData = [];

    for(var i=0; i<weatherDay.dataPoints.length; i++) {
        labels.push(weatherDay.dataPoints[i].dt);
        tempData.push(Math.round(weatherDay.dataPoints[i].temp));
        humidData.push(Math.round(weatherDay.dataPoints[i].humid));
    }

    return {
        labels: labels,
        tempData: tempData,
        humidData: humidData
    }
}

