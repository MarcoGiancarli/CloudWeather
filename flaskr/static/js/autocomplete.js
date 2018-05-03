function getForecast(suggestion) {
    var forecastURL = '/api/forecast?location=' + 
            encodeURIComponent(suggestion.value);
    $.getJSON(forecastURL, function(data) {
        var current_temp_k = data.list[0].main.temp - 273.15;
        var current_temp = (Math.round(current_temp_k * 10) / 10).toFixed(1)
        console.log(current_temp + 'C');
        console.log(data.list[0].weather[0].description);
    });
}

$('#locationInput').autocomplete({
    paramName: 'prefix',
    serviceUrl: '/api/autocomplete',
    deferRequestBy: 80,
    onSelect: function(suggestion) {
        getForecast(suggestion);
    }
});

