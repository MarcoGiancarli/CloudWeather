// global so that we can graph daily data on click
var dailyWeatherData;

$('#locationInput').autocomplete({
    paramName: 'prefix',
    serviceUrl: '/api/autocomplete',
    deferRequestBy: 80,
    onSelect: function(suggestion) {
        getForecast(suggestion);
    }
});

function getForecast(suggestion) {
    var forecastURL = '/api/forecast?location=' + 
            encodeURIComponent(suggestion.value);
    $.getJSON(forecastURL, function(data) {
        var cityName = data.city.name;
        // display city name and current conditions
        var currentWeather = {};

        dailyWeatherData = formatWeatherData(data);
        $('#forecastContainer').removeClass('hide');
        for(var i=0; i<5; i++) {
            var col = $('#forecast-day-' + i);
            var highString = Math.round(dailyWeatherData[i].high);
            var lowString = Math.round(dailyWeatherData[i].low);
            var humidString = 'Peak Humidity: ' + 
                    dailyWeatherData[i].peakHumid.toFixed(1) + '%';
            var windString = 'Peak Wind Speed: ' + 
                    dailyWeatherData[i].peakWind.toFixed(1) + 'mph';
            col.find('.forecast-temp-high').text(highString);
            col.find('.forecast-temp-low').text(lowString);
            col.find('.forecast-humid').text(humidString);
            col.find('.forecast-wind').text(windString);
        }
        // display current temp, humid, weather type
        // get stock photo as background for weather type
    });
}

function formatWeatherData(data) {
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 
                'Thursday', 'Friday', 'Saturday'];
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June',
                  'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

    var dailyWeather = []; // contains data for each day in forecast
    var forecastDays = {}; // keeps track of days already in dailyWeather
    for(var i=0; i<data.list.length; i++) {
        var weatherReport = reformat3Hour(data.list[i]);
        var dayOfMonth = weatherReport.dt.getDate().toString();
        if(dayOfMonth in forecastDays) {
            var currentDay = dailyWeather[dailyWeather.length-1];
            if(currentDay.high < weatherReport.high) {
                currentDay.high = weatherReport.high;
            }
            if(currentDay.low > weatherReport.low) {
                currentDay.low = weatherReport.low;
            }
            if(currentDay.peakHumid < weatherReport.humid) {
                currentDay.peakHumid = weatherReport.humid;
            }
            if(currentDay.peakWind < weatherReport.wind) {
                currentDay.peakWind = weatherReport.wind;
            }
            currentDay.dataPoints.push(weatherReport);
        } else {
            forecastDays[dayOfMonth] = dailyWeather.length;
            dailyWeather.push({
                'high': weatherReport.high,
                'low': weatherReport.low,
                'peakHumid': weatherReport.humid,
                'peakWind': weatherReport.wind,
                'dataPoints': [weatherReport],
                'dayOfWeek': days[weatherReport.dt.getDay()],
                'date': months[weatherReport.dt.getMonth()] + ' ' + 
                        weatherReport.dt.getDate().toString()
            });
        }

        // fill first partial day up to 8 3-hour data points so that graphing
        // works the same for all days
        var prevDay = dailyWeather[dailyWeather.length-2];
        if(dailyWeather.length > 1 && prevDay.dataPoints.length < 8) {
            prevDay.dataPoints.push(weatherReport);
        }
    }

    return dailyWeather;
}

function reformat3Hour(weatherReport) {
    return {
        'dt': new Date(weatherReport.dt*1000),
        'high' : convertToF(weatherReport.main.temp_max),
        'low' : convertToF(weatherReport.main.temp_min),
        'humid' : weatherReport.main.humidity,
        'wind' : weatherReport.wind.speed,
        'main' : weatherReport.weather[0].main,
        'desc' : weatherReport.weather[0].description
    }
}

function convertToF(temp) {
    return (temp - 273.15) * 1.8 + 32;
}

