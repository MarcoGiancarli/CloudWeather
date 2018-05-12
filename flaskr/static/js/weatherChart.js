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
                borderColor: 'rgba(49, 199, 90, 1.0)',
                backgroundColor: 'rgba(49, 199, 90, 1.0)',
                yAxisID: 'temp'
            }, {
                label: 'Humidity',
                fill: false,
                data: data.humidData,
                borderColor: 'rgba(237, 92, 87, 1.0)',
                backgroundColor: 'rgba(237, 92, 87, 1.0)',
                yAxisID: 'humid'
            }, {
                label: 'Rain',
                fill: true,
                steppedLine: true,
                data: data.rainData,
                borderColor: 'rgba(64, 121, 196, 1.0)',
                backgroundColor: 'rgba(64, 121, 196, 0.4)',
                yAxisID: 'rain'
            }]
        },
        options: {
            tooltips: {
                mode: 'index',
                intersect: false,
                callbacks: {}
            },
            responsive: true,
            maintainAspectRatio: false,
            title: {
                display: true,
                text: 'Weather Conditions for ' + weatherDay.dayOfWeek +
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
                }, {
                    id: 'rain',
                    display: false,
                    type: 'linear',
                    position: 'right',
                    gridLines: {
                        display: false
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'inches'
                    },
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    };

    if(data.hasSnow) {
        config.data.datasets.push({
            label: 'Snow',
            fill: true,
            steppedLine: true,
            data: data.snowData,
            borderColor: 'rgba(244, 244, 249, 1.0)',
            backgroundColor: 'rgba(244, 244, 249, 0.4)',
            yAxisID: 'snow'
        });
        config.options.scales.yAxes.push({
            id: 'snow',
            display: false,
            type: 'linear',
            position: 'right',
            gridLines: {
                display: false
            },
            scaleLabel: {
                display: true,
                labelString: 'inches'
            },
            ticks: {
                beginAtZero: true
            }
        });
    }

    config.options.tooltips.callbacks.label = function(tooltipItem, data) {
        if(tooltipItem.datasetIndex == 0) {
            return tooltipItem.yLabel + String.fromCharCode(176) + 'F';
        } else if(tooltipItem.datasetIndex == 1) {
            return tooltipItem.yLabel + '%';
        } else if(tooltipItem.datasetIndex == 2) {
            return tooltipItem.yLabel + ' in.';
        } else if(tooltipItem.datasetIndex == 3) {
            return tooltipItem.yLabel + ' in.';
        }
        return tooltipItem.ylabel;
    }
    Chart.defaults.global.defaultFontColor = '#F8F9FA';
    
    weatherChart = new Chart(ctx, config);
};

function prepareData(weatherDay) {
    var labels = [];
    var tempData = [];
    var humidData = [];
    var rainData = [];
    var snowData = [];
    var hasSnow = false;

    for(var i=0; i<weatherDay.dataPoints.length; i++) {
        labels.push(weatherDay.dataPoints[i].dt);
        tempData.push(Math.round(weatherDay.dataPoints[i].temp));
        humidData.push(Math.round(weatherDay.dataPoints[i].humid));
        rainData.push(weatherDay.dataPoints[i].rain.toFixed(2));
        snowData.push(weatherDay.dataPoints[i].snow.toFixed(2));
    }

    if(weatherDay.totalSnow > 0) {
        hasSnow = true;
    }

    return {
        labels: labels,
        tempData: tempData,
        humidData: humidData,
        rainData: rainData,
        snowData: snowData,
        hasSnow: hasSnow,
    }
}

