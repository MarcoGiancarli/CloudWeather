$('#locationInput').autocomplete({
    paramName: 'prefix',
    serviceUrl: '/api/autocomplete',
    deferRequestBy: 80,
    onSelect: function (suggestion) {
        alert('You selected: ' + suggestion.value + ', ' + suggestion.data);
    }
});
