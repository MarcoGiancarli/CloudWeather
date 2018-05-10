// global so that we can graph daily data on click
var dailyWeatherData;
var forecastCards = [];

$('#locationInput').autocomplete({
    paramName: 'prefix',
    appendTo: $('#locationForm'),
    zIndex: 999,
    triggerSelectOnValidInput: false,
    serviceUrl: '/api/autocomplete',
    deferRequestBy: 80,
    onSelect: function(suggestion) {
        loadWeather(suggestion.value);
    }
});

// turns off autocomplete call on focus. see issue at
// https://github.com/devbridge/jQuery-Autocomplete/issues/498
$('#locationInput').off('focus.autocomplete');

// on focus of locationInput, scroll it to top of page to help mobile users
$('#locationInput').on('focus', function() {
    if($(window).width() < 768) {
        smoothScrollTo('#locationForm');
    }
});

// for when the user submits the form instead of clicking a suggestion
$("#locationForm").submit(function(e) {
    e.preventDefault(); // prevent form submit from refreshing page
    var loc = $('#locationInput');
    loadWeather(loc.val());
});

function loadWeather(suggestion) {
    // hide chart if it's visible
    $('.weather-chart-wrapper').addClass('hide');

    // hide mobile keyboard
    document.activeElement.blur();
    $('#locationInput').blur();
    
    var weatherURL = '/api/weather?location=' + 
            encodeURIComponent(suggestion);
    $.getJSON(weatherURL, function(data) {
        var forecastContainer = $('#forecastContainer');
        forecastContainer.fadeOut(300, function() {
            dailyWeatherData = formatForecastData(data.forecast);
            displayCurrentWeather(data.weather, forecastContainer);
            
            forecastCards = [];
            for(var i=0; i<5; i++) {
                forecastCards.push($('#forecast-day-' + i));
                displayForecastDay(dailyWeatherData[i], forecastCards[i]);
            }
            // after loaded, add listeners to forecast cards for graphing
            for(var i=0; i<5; i++) {
                forecastCards[i].on('click', makeDrawChartFunc(i));
                // since we're loading a new location, make all cards inactive
                forecastCards[i].removeClass('active');
            }

            // make the forecast visible again only after the content is loaded
            forecastContainer.removeClass('hide');
            forecastContainer.fadeIn(300);
        });
    });
}

function makeDrawChartFunc(index) {
    return function(e) {
        e.stopImmediatePropagation(); // removes jump-to-top-of-page bug

        for(var i=0; i<5; i++) {
            if(i !== index) {
                forecastCards[i].removeClass('active');
            } else {
                forecastCards[i].addClass('active');
            }
        }
        var weatherChartWrapper = $('.weather-chart-wrapper');
        weatherChartWrapper.removeClass('hide');
        smoothScrollTo('.weather-chart-wrapper');
        drawChart(dailyWeatherData[index]);
    }
}

function smoothScrollTo(selector) {
    var navHeight = $('nav').height();
    $('html, body').animate({
        scrollTop: $(selector).offset().top - $('main').offset().top
                - navHeight - 10
    }, {duration: 650, queue: false});
}

function formatForecastData(data) {
    var dailyWeather = []; // contains data for each day in forecast
    var daysSeen = {}; // keeps track of days already in dailyWeather
    for(var i=0; i<data.list.length; i++) {
        var weather3Hour = new Weather3Hour(data.list[i]);
        var dayOfMonth = weather3Hour.dt.getDate().toString();
        if(dayOfMonth in daysSeen) {
            var currentDay = dailyWeather[dailyWeather.length-1];
            updateDayValues(currentDay, weather3Hour);
            currentDay.dataPoints.push(weather3Hour);
        } else {
            daysSeen[dayOfMonth] = dailyWeather.length;
            dailyWeather.push(new WeatherDay(weather3Hour));
        }

        // fill first partial day up to 8 3-hour data points so that graphing
        // works the same for all days
        var prevDay = dailyWeather[dailyWeather.length-2];
        if(dailyWeather.length > 1 && prevDay.dataPoints.length < 8) {
            prevDay.dataPoints.push(weather3Hour);
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

function Weather3Hour(forecastSegment) {
    this.dt = new Date(forecastSegment.dt*1000),
    this.temp = convertToF(forecastSegment.main.temp),
    this.high = convertToF(forecastSegment.main.temp_max),
    this.low = convertToF(forecastSegment.main.temp_min),
    this.humid = forecastSegment.main.humidity,
    this.wind = convertToMph(forecastSegment.wind.speed),
    this.main = forecastSegment.weather[0].main,
    this.desc = forecastSegment.weather[0].description,
    this.icon = forecastSegment.weather[0].icon
}

function updateDayValues(currentDay, weather3Hour) {
	if(currentDay.high < weather3Hour.high) {
        currentDay.high = weather3Hour.high;
    }
    if(currentDay.low > weather3Hour.low) {
        currentDay.low = weather3Hour.low;
    }
    if(currentDay.peakHumid < weather3Hour.humid) {
        currentDay.peakHumid = weather3Hour.humid;
    }
    if(currentDay.peakWind < weather3Hour.wind) {
        currentDay.peakWind = weather3Hour.wind;
    }
}

function WeatherDay(weather3Hour) {
    var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
            'Friday', 'Saturday'];
    var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
            'July', 'August', 'September', 'October', 'November', 'December'];
    
	this.high = weather3Hour.high;
    this.low = weather3Hour.low;
    this.peakHumid = weather3Hour.humid;
    this.peakWind = weather3Hour.wind;
    this.dataPoints = [weather3Hour];
    this.dayOfWeek = DAYS[weather3Hour.dt.getDay()];
    this.date = MONTHS[weather3Hour.dt.getMonth()] + ' ' + 
            weather3Hour.dt.getDate().toString();
}

function displayCurrentWeather(currentWeather, forecastContainer) {
	var cityName = currentWeather.name;
    var currentTempString = 
            Math.round(convertToF(currentWeather.main.temp)) + 
            String.fromCharCode(176) + 'F';
    var currentDescString = 
            sentenceCapitalize(currentWeather.weather[0].description);
    var currentHumidString = 'Humidity: ' + 
            Math.round(currentWeather.main.humidity) + '%';
    var currentWindString = 'Wind Speed: ' + 
            Math.round(convertToMph(currentWeather.wind.speed)) + 'mph';

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

    // change background to match current weather type
    var currentMain = currentWeather.weather[0].main;
    var mainTypes = ['Rain', 'Clear', 'Snow', 'Clouds', 'Drizzle',
            'Atmosphere', 'Thunderstorm', 'Mist'];
    var atmosphereVariations = ['Fog', 'Smoke', 'Haze', 'Dust', 'Sand'];
    // extend mainTypes with atmosphereVariations
    mainTypes.push.apply(mainTypes, atmosphereVariations);

    if($.inArray(currentMain, mainTypes) !== -1) {
        // combine the variations of atmosphere
        if($.inArray(currentMain, atmosphereVariations) !== -1) {
            currentMain = 'Atmosphere';
        }

        var newBgUrl = '/static/img/' + currentMain + '.jpeg';
        $('body').toggleClass('opaque-bg');
        setTimeout(function() {
            $('html').css('background-image', 'url("' + newBgUrl + '")');
            $('body').toggleClass('opaque-bg');
        }, 300);
    }
}

function displayForecastDay(weatherDay, baseElement) {
	var dateString = weatherDay.dayOfWeek + ', ' +
    		weatherDay.date;
	var highString = Math.round(weatherDay.high);
	var lowString = Math.round(weatherDay.low);
	var descString = sentenceCapitalize(weatherDay.desc);
	var humidString = 'Peak Humidity: ' + 
	    	Math.round(weatherDay.peakHumid) + '%';
	var windString = 'Peak Wind Speed: ' + 
	    	Math.round(weatherDay.peakWind) + 'mph';
	var iconImg = '<img src="http://openweathermap.org/img/w/' +
			weatherDay.icon + '.png"/>';
	
	baseElement.find('.forecast-date').text(dateString);
	baseElement.find('.forecast-temp-high').text(highString);
	baseElement.find('.forecast-temp-low').text(lowString);
	baseElement.find('.forecast-desc').text(descString);
	baseElement.find('.forecast-humid').text(humidString);
	baseElement.find('.forecast-wind').text(windString);
	baseElement.find('.forecast-icon').html(iconImg);
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
