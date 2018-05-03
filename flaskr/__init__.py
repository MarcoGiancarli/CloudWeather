from flask import Flask
from flask import render_template
from flask import request
from flask import Response
import requests
import json
import pygtrie


def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)

    # load the instance config, if it exists, when not testing
    if test_config is None:
        app.config.from_pyfile('config.py', silent=True)
    else:
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    #try:
    #    os.makedirs(app.instance_path)
    #except OSError:
    #    pass

    WEATHER_API_KEY = None
    with open('weather_api_key.txt', 'r') as key_file:
        WEATHER_API_KEY = key_file.readline().strip()
    if len(WEATHER_API_KEY) == 0:
        print 'The weather_api_key.txt file does not exist or is empty.'
        exit(1)

    cities_trie = pygtrie.CharTrie()
    with open('current.city.list.json') as cities_file:
        print 'Loading city data...'
        cities_json = json.load(cities_file)
        for city in cities_json:
            city_tag = make_city_tag(city)
            if city_tag in cities_trie:
                # TODO: find a better workaround for collisions
                collision_count = 1
                new_tag = city_tag + ' (' + str(collision_count) + ')'
                while new_tag in cities_trie:
                    collision_count += 1
                    new_tag = city_tag + ' (' + str(collision_count) + ')'
                city_tag = new_tag
            cities_trie[city_tag] = city['id']
        print 'Done.'

    zip_codes_trie = pygtrie.CharTrie()
    poop = 0
    with open('zip_codes.txt') as zip_codes_file:
        print 'Loading zip codes...'
        for line in zip_codes_file:
            zip_code = line.strip()
            zip_codes_trie[zip_code] = True
        print 'Done.'


    @app.route('/')
    def home():
        return render_template('index.html')

    @app.route('/api/autocomplete')
    def autocomplete():
        """ Return a JSON array of at most 6 results. """
        prefix = request.args.get('prefix', None)
        if prefix is None or len(prefix) == 0:
            print request.args, prefix
            return json.dumps([])
        
        # Make queries case insensitive by always using title-capitalization
        prefix = " ".join(word.capitalize() for word in prefix.split())

        try:
            # TODO: make a wrapper generator and only use the first 6 values
            results = list(cities_trie.iteritems(prefix=prefix))
        except KeyError:
            # it's probably not a city, so attempt to match to a zip code.
            try:
                results = list(zip_codes_trie.items(prefix=prefix))
            except KeyError:
                return json.dumps([])
        if len(results) > 6:
            results = results[:6]
        # only supply the keys
        results = {'suggestions': [result[0] for result in results]}

        return json.dumps(results)
        
    @app.route('/api/forecast')
    def forecast():
        """ Display the 5-day forecast for a selected city/zip. Relays JSON 
            response from openweathermap.org API. """
        location = request.args.get('location', None)
        if location is None:
            response = make_response('Invalid location')
            response.status_code = 400
            return response

        if cities_trie.has_node(location) == pygtrie.Trie.HAS_VALUE:
            city_id = cities_trie[location]
        elif zip_codes_trie.has_node(location) == pygtrie.Trie.HAS_VALUE:
            zip_code = location

        return 'forecast'

    return app


def make_city_tag(city):
    """ Generate a searchable tag for a city. Should be unique. Attempts to 
        match the state based on the city's wikipedia link to avoid 
        collisions. """
    city_tag = city['name']
    # since there is no US state field, extract it from the wiki link
    # this must be done to avoid collisions between same-named US cities
    if 'langs' in city:
        for item in city['langs']:
            if 'link' in item:
                state_abbrev = get_state_from_link(item['link'])
                if state_abbrev is not None:
                    city_tag += ', ' + state_abbrev
    city_tag += ', ' + city['country']

    return city_tag

def get_state_from_link(link):
    state_abbrevs = {
	"Alabama": "AL",
	"Alaska": "AK",
	"Arizona": "AZ",
	"Arkansas": "AR",
	"California": "CA",
	"Colorado": "CO",
	"Connecticut": "CT",
	"Delaware": "DE",
	"District of Columbia": "DC",
	"Florida": "FL",
	"Georgia": "GA",
	"Hawaii": "HI",
	"Idaho": "ID",
	"Illinois": "IL",
	"Indiana": "IN",
	"Iowa": "IA",
	"Kansas": "KS",
	"Kentucky": "KY",
	"Louisiana": "LA",
	"Maine": "ME",
	"Montana": "MT",
	"Nebraska": "NE",
	"Nevada": "NV",
	"New Hampshire": "NH",
	"New Jersey": "NJ",
	"New Mexico": "NM",
	"New York": "NY",
	"North Carolina": "NC",
	"North Dakota": "ND",
	"Ohio": "OH",
	"Oklahoma": "OK",
	"Oregon": "OR",
	"Maryland": "MD",
	"Massachusetts": "MA",
	"Michigan": "MI",
	"Minnesota": "MN",
	"Mississippi": "MS",
	"Missouri": "MO",
	"Pennsylvania": "PA",
	"Rhode Island": "RI",
	"South Carolina": "SC",
	"South Dakota": "SD",
	"Tennessee": "TN",
	"Texas": "TX",
	"Utah": "UT",
	"Vermont": "VT",
	"Virginia": "VA",
	"Washington": "WA",
	"West Virginia": "WV",
	"Wisconsin": "WI",
	"Wyoming": "WY",
    }
    
    for state in state_abbrevs.keys():
        if link.endswith(state.replace(' ', '_')):
            return state_abbrevs[state]
    return None

