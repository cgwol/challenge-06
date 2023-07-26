// Global variables
var apiKey = "dc2f1c9007cb4e0e7edfb63d1ec3e4e0"; // API key for OpenWeatherMap
var searches = []; // Stores search history as an array of city objects
var latitude; // Latitude of the searched city
var longitude; // Longitude of the searched city

// Function to get latitude and longitude from city name
function getLatandLong(city) {
    // API call to geocode maps service to get latitude and longitude of the city
    const apiUrl = `https://geocode.maps.co/search?q=${city}`;
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // Update latitude, longitude, and location elements with retrieved data
            latitude = data[0].lat;
            longitude = data[0].lon;
            var location = data[0].display_name;
            var locationEl = $('#location');
            locationEl.text(location);

            // Create a city object with cityName and displayName properties
            var cityName = getCityName(location);
            var cityObject = {
                cityName: cityName,
                displayName: location
            };

            // Check for duplicate city in the search history and remove it
            var existingIndex = searches.findIndex(s => s.displayName === cityObject.displayName);
            if (existingIndex !== -1) {
                searches.splice(existingIndex, 1);
            }

            // Add the city object to the search history
            searches.push(cityObject);
            addToList();
            dupeFlag = false;

            // Fetch weather data using the retrieved latitude and longitude
            fetchWeather(latitude, longitude);
        });
}

// Function to fetch weather data using latitude and longitude
function fetchWeather(latitude, longitude) {
    // API call to OpenWeatherMap service to get weather data
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // Update current weather elements with the retrieved weather data
            var date = dayjs.unix(data.list[0].dt).format('M/D/YYYY');
            var locationShort = data.city.name + ", " + data.city.country;
            var imgCurrentEl = $('#img-current');
            var tempCurrentEL = $('#temp-current');
            var weatherCurrentEl = $('#weather-current');
            var windCurrentEl = $('#wind-current');
            var humidCurrentEl = $('#humid-current');
            imgCurrentEl.text(weatherIcon(data.list[0].weather[0].id));
            tempCurrentEL.text(KtoF(data.list[0].main.temp) + "\u00B0 F");
            weatherCurrentEl.text(data.list[0].weather[0].description);
            windCurrentEl.text(Math.round(data.list[0].wind.speed) + " mph " + windDirection(data.list[0].wind.deg));
            humidCurrentEl.text(data.list[0].main.humidity + "% Humidity");

            // Loop through forecast data and update elements for the upcoming days
            var j = 0;
            for (var i = 7; i < 40; i = i + 8) {
                var dateEl = $('#date-' + j);
                var tempEl = $('#temp-' + j);
                var imgEl = $('#img-' + j);
                var weatherEl = $('#weather-' + j);
                var windEl = $('#wind-' + j);
                var humidEl = $('#humid-' + j);
                dateEl.text(dayjs.unix(data.list[i].dt).format('M/D/YYYY'));
                tempEl.text(KtoF(data.list[i].main.temp) + "\u00B0 F");
                imgEl.text(weatherIcon(data.list[i].weather[0].id));
                weatherEl.text(data.list[i].weather[0].description);
                windEl.text(Math.round(data.list[i].wind.speed) + " mph " + windDirection(data.list[i].wind.deg));
                humidEl.text(data.list[i].main.humidity + "% Humidity");
                j++;
            }
        });
}

// Function to convert Kelvin to Fahrenheit
function KtoF(kelvin) {
    return Math.round((kelvin - 273.15) * 1.8 + 32);
}

// Function to get wind direction from degrees
function windDirection(degree) {
    // Array of cardinal directions
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    degree = (degree % 360 + 360) % 360;
    var i = Math.round(degree / 45) % 8;
    return directions[i]; // Return the corresponding direction
}

// Function to get weather icon based on ID
function weatherIcon(ID) {
    var imgString;
    if (ID >= 200 && ID <= 232) { imgString = "thunderstorm" }
    else if (ID >= 300 && ID <= 321) { imgString = "rainy" }
    else if (ID >= 500 && ID <= 531) { imgString = "rainy" }
    else if (ID >= 600 && ID <= 622) { imgString = "weather_snowy" }
    else if (ID == 701) { imgString = "mist" }
    else if (ID == 11) { imgString = "foggy" }
    else if (ID == 721) { imgString = "foggy" }
    else if (ID == 731) { imgString = "foggy" }
    else if (ID == 741) { imgString = "foggy" }
    else if (ID == 751) { imgString = "storm" }
    else if (ID == 761) { imgString = "storm" }
    else if (ID == 762) { imgString = "volcano" }
    else if (ID == 771) { imgString = "storm" }
    else if (ID == 781) { imgString = "tornado" }
    else if (ID == 800) { imgString = "sunny" }
    else if (ID >= 801 && ID <= 804) { imgString = "partly_cloudy_day" }

    return imgString;
}

// Function to extract city name from display name
function getCityName(displayName) {
    var nameArray = displayName.split(', ');
    cityName = nameArray[0];
    return cityName; 
}

// Event listener for search bar keyup (Enter key)
document.querySelector('#searchBar').addEventListener("keyup", function (e) {
    if (e.keyCode === 13) {
        getLocation();
        document.querySelector('#searchBar').value = "";
    }
});

// Function to get location from search bar and trigger getLatandLong
function getLocation() {
    var location = document.querySelector('#searchBar').value;
    getLatandLong(location);
}

// Function to add city to search history list
function addToList() {
    var searchHistory = $('#search-history');
    searchHistory.empty();
    if (searches.length > 8) {
        searches.shift();
    }

    // Reverse the array to show the most recent search on top
    searches.slice().reverse().forEach((search, i) => {
        var listItem = $('<li>').attr({
            id: `li-${i}`,
            class: 'my-1 list-group-item list-group-item-action'
        }).text(search.cityName);

        // Add click event to the list item to retrieve weather data for the selected city
        listItem.on('click', function () {
            dupeFlag = true;
            getLatandLong(search.displayName);
        });

        searchHistory.append(listItem);
        // Save search history to local storage
        saveToLocalStorage();
    });
}

// Function to save searches to local storage
function saveToLocalStorage() {
    localStorage.setItem("searches", JSON.stringify(searches));
}

// Function to load searches from local storage
function loadLocalStorage() {
    var savedSearches = localStorage.getItem("searches");
    if (savedSearches !== null) {
        searches = JSON.parse(savedSearches);
        getLatandLong(searches[searches.length - 1].displayName);
    }
    else{
        getLatandLong("New York City");
    }
}

loadLocalStorage();
