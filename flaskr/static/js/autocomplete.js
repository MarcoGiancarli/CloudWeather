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

// turns off autocomplete call on focus. see issue at
// https://github.com/devbridge/jQuery-Autocomplete/issues/498
$('#locationInput').off('focus.autocomplete');

// for when the user submits the form instead of clicking a suggestion
// prevent form submit from refreshing page
$("#locationForm").submit(function(e) {
    e.preventDefault();
    var loc = $('#locationInput').val();
    getForecast({'value': loc}); // must be in object to immitate suggestion
});

function getForecast(suggestion) {
    var forecastURL = '/api/forecast?location=' + 
            encodeURIComponent(suggestion.value);
    $.getJSON(forecastURL, function(data) {
        var forecastContainer = $('#forecastContainer');
        forecastContainer.fadeOut(300, function() {

            dailyWeatherData = formatWeatherData(data);

            var cityName = data.city.name;
            var currentTempString = 
                    Math.round(convertToF(data.list[0].main.temp)) + 
                    String.fromCharCode(176) + 'F';
            var currentDescString = 
                    sentenceCapitalize(data.list[0].weather[0].description);
            var currentHumidString = 'Humidity: ' + 
                    Math.round(data.list[0].main.humidity) + '%';
            var currentWindString = 'Wind Speed: ' + 
                    Math.round(convertToMph(data.list[0].wind.speed)) + 'mph';

            forecastContainer.find('.current-city-name')
                    .text(cityName);
            forecastContainer.find('.current-conditions-temp')
                    .text(currentTempString);
            forecastContainer.find('.current-conditions-desc')
                    .text(currentDescString);
            forecastContainer.find('.current-conditions-humid')
                    .text(currentHumidString);
            forecastContainer.find('.current-conditions-wind')
                    .text(currentWindString);

            // change background to match current weather conditions
            var currentMain = data.list[0].weather[0].main;
            var newBgUrl = '/static/img/' + currentMain + '.jpeg';
            $('html').css('background-image', 'url("' + newBgUrl + '")');

            for(var i=0; i<5; i++) {
                var col = $('#forecast-day-' + i);
                var dateString = dailyWeatherData[i].dayOfWeek + ', ' +
                        dailyWeatherData[i].date;
                var highString = Math.round(dailyWeatherData[i].high);
                var lowString = Math.round(dailyWeatherData[i].low);
                var descString = sentenceCapitalize(dailyWeatherData[i].desc);
                var humidString = 'Peak Humidity: ' + 
                        Math.round(dailyWeatherData[i].peakHumid) + '%';
                var windString = 'Peak Wind Speed: ' + 
                        Math.round(dailyWeatherData[i].peakWind) + 'mph';
                var iconImg = '<img src="http://openweathermap.org/img/w/' +
                        dailyWeatherData[i].icon + '.png"/>';

                col.find('.forecast-date').text(dateString);
                col.find('.forecast-temp-high').text(highString);
                col.find('.forecast-temp-low').text(lowString);
                col.find('.forecast-desc').text(descString);
                col.find('.forecast-humid').text(humidString);
                col.find('.forecast-wind').text(windString);
                col.find('.forecast-icon').html(iconImg);
            }

            // make the forecast visible only after the content is loaded
            forecastContainer.removeClass('hide');
            forecastContainer.fadeIn(300);
        });
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
    
    // select weather description based on current or mid-day weather
    // note: we're only guaranteed full days of data for indices 1-4
    dailyWeather[0].main = dailyWeather[0].dataPoints[0].main;
    dailyWeather[0].desc = dailyWeather[0].dataPoints[0].desc;
    dailyWeather[0].icon = dailyWeather[0].dataPoints[0].icon;
    for(var i=1; i<5; i++) {
        dailyWeather[i].main = dailyWeather[i].dataPoints[4].main;
        dailyWeather[i].desc = dailyWeather[i].dataPoints[4].desc;
        dailyWeather[i].icon = dailyWeather[i].dataPoints[4].icon;
    }

    return dailyWeather;
}

function reformat3Hour(weatherReport) {
    return {
        'dt': new Date(weatherReport.dt*1000),
        'high' : convertToF(weatherReport.main.temp_max),
        'low' : convertToF(weatherReport.main.temp_min),
        'humid' : weatherReport.main.humidity,
        'wind' : convertToMph(weatherReport.wind.speed),
        'main' : weatherReport.weather[0].main,
        'desc' : weatherReport.weather[0].description,
        'icon' : weatherReport.weather[0].icon
    }
}

function convertToF(temp) {
    return (temp - 273.15) * 1.8 + 32;
}

function convertToMph(speed) {
    return speed * 2.23694;
}

function sentenceCapitalize(sentence) {
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}