from flask import Flask
from flask import render_template
from flask import request
import json


app = Flask(__name__)

WEATHER_API_KEY = None

with open('weather_api_key.txt', 'r') as key_file:
    WEATHER_API_KEY = key_file.readline().strip()

if len(WEATHER_API_KEY) == 0:
    print 'The weather_api_key.txt file does not exist or is empty.'
    exit(1)

with open('current.city.list.json') as cities_file:
    print 'Loading city data...',
    cities_json = json.load(cities_file)
    cities_trie = None
    print 'Done.'


@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/autocomplete')
def autocomplete():
    return 'autocomplete'
    
@app.route('/api/forecast')
def forecast():
    return 'forecast'
