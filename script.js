const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");
const mapContainer = document.getElementById("mapContainer");

let temperatureLimit;
let fiveDaysForecast;
let map;

const API_KEY = "6c4fea006e152c559e9366d3aee6ec0e";

const createWeatherCard = (cityName, weatherItem, index) => {
    if (index === 0) {
        return `<div class="details">
                    <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                    <h6>Temperature: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                    <h6>${weatherItem.weather[0].description}</h6>
                </div>`;
    } else {
        return `<li class="card">
                    <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                    <h6>Temp: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </li>`;
    }
};

// Function to create Leaflet map
const createMap = (latitude, longitude) => {
    
    if (map) {
        map.remove();
    }

    
    map = L.map("mapContainer").setView([latitude, longitude], 30);

   
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri - Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(map);

  
    L.marker([latitude, longitude]).addTo(map)
        .bindPopup('Location').openPopup();
};

// Function to get weather details for a city
const getWeatherDetails = (cityName, latitude, longitude) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

    fetch(WEATHER_API_URL)
        .then(response => response.json())
        .then(data => {
            
            const uniqueForecastDays = [];
            fiveDaysForecast = data.list.filter(forecast => {
                const forecastDate = new Date(forecast.dt_txt).getDate();
                if (!uniqueForecastDays.includes(forecastDate)) {
                    return uniqueForecastDays.push(forecastDate);
                }
            });

            
            cityInput.value = "";
            currentWeatherDiv.innerHTML = "";
            weatherCardsDiv.innerHTML = "";

           
            fiveDaysForecast.forEach((weatherItem, index) => {
                const html = createWeatherCard(cityName, weatherItem, index);
                if (index === 0) {
                    currentWeatherDiv.insertAdjacentHTML("beforeend", html);
                } else {
                    weatherCardsDiv.insertAdjacentHTML("beforeend", html);
                }
            });

       
            const currentDayDetails = [];

            
            data.list.forEach(forecast => {
                
                const forecastDate = new Date(forecast.dt_txt).toLocaleDateString();

               
                if (forecastDate === new Date().toLocaleDateString()) {
                    currentDayDetails.push({
                        time: new Date(forecast.dt_txt).toLocaleTimeString(),
                        temperature: forecast.main.temp - 273.15,
                        windSpeed: forecast.wind.speed,
                        humidity: forecast.main.humidity,
                    });
                }
            });

            
            lineChart.data.labels = currentDayDetails.map(detail => detail.time);
            lineChart.data.datasets[0].data = currentDayDetails.map(detail => detail.temperature);
            lineChart.update();

           
            barChart.data.labels = currentDayDetails.map(detail => detail.time);
            barChart.data.datasets[0].data = currentDayDetails.map(detail => detail.windSpeed);
            barChart.update();

            
            pieChart.data.labels = ["Humidity", "Remaining"];
            pieChart.data.datasets[0].data = [currentDayDetails[0]?.humidity || 0, 100 - (currentDayDetails[0]?.humidity || 0)];
            pieChart.update();
        })
        .catch(error => {
            console.error("Error fetching weather data:", error);
        });
};


const updateMap = (latitude, longitude) => {
    createMap(latitude, longitude);
};


function handleCheckButton() {
   
    const temperatureLimitInput = document.getElementById("input-limit").value;

   
    temperatureLimit = parseFloat(temperatureLimitInput);

  
    if (isNaN(temperatureLimit)) {
        alert("Please enter a valid temperature limit");
        return;
    }

    
    if (typeof fiveDaysForecast !== 'undefined') {
        const datesAboveLimit = fiveDaysForecast
            .filter(weatherItem => (weatherItem.main.temp - 273.15) > temperatureLimit)
            .map(weatherItem => new Date(weatherItem.dt_txt).toLocaleDateString());

        console.log("Dates with temperature above the limit:", datesAboveLimit);

        
        const resultDiv = document.getElementById("result");
        resultDiv.innerHTML = ""; 

       
        datesAboveLimit.forEach(date => {
            const line = document.createElement("div");
            line.textContent = date;
            resultDiv.appendChild(line);
        });
    }
}


document.getElementById("checkbtn").onclick = handleCheckButton;


const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (cityName === "") return;

    const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;

    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            if (!data.length) return alert(`No coordinates found for ${cityName}`);
            const { lat, lon, name } = data[0];
            updateMap(lat, lon);
            getWeatherDetails(name, lat, lon);
        })
        .catch(() => {
            alert("An error occurred while fetching the coordinates!");
        });
};


const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            updateMap(latitude, longitude);
            const API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            fetch(API_URL)
                .then(response => response.json())
                .then(data => {
                    const { name } = data[0];
                    getWeatherDetails(name, latitude, longitude);
                })
                .catch(() => {
                    alert("An error occurred while fetching the city name!");
                });
        },
        error => {
            if (error.code === error.PERMISSION_DENIED) {
                alert(
                    "Geolocation request denied. Please reset location permission to grant access again."
                );
            } else {
                alert("Geolocation request error. Please reset location permission.");
            }
        }
    );
};


locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());

// Function to set initial weather data for Delhi
const setInitialWeatherForDelhi = () => {
    const DELHI_COORDINATES = { lat: 28.6139, lon: 77.2090 }; 
    const DELHI_NAME = "Delhi";

    updateMap(DELHI_COORDINATES.lat, DELHI_COORDINATES.lon);
    getWeatherDetails(DELHI_NAME, DELHI_COORDINATES.lat, DELHI_COORDINATES.lon);
};


window.addEventListener("load", setInitialWeatherForDelhi);


const lineChartData = {
    labels: [],
    datasets: [
        {
            label: "Temperature",
            borderColor: "rgb(75, 192, 192)",
            data: [],
            fill: false,
        },
    ],
};
const lineChartCanvas = document.getElementById("lineChart");
const lineChart = new Chart(lineChartCanvas, {
    type: "line",
    data: lineChartData,
    options: {
        scales: {
            x: {
                ticks: {
                    color: 'white', 
                },
                grid: {
                    color: 'white', 
                },
            },
            y: {
                ticks: {
                    color: 'white', 
                },
                grid: {
                    color: 'white', 
                },
                beginAtZero: true,
            },
        },
        plugins: {
            legend: {
                labels: {
                    color: 'white' 
                }
            }
        }
    },
});


const barChartData = {
    labels: [],
    datasets: [
        {
            label: "Wind Speed",
            backgroundColor: "rgba(54, 162, 235, 0.5)",
            data: [],
        },
    ],
};
const barChartCanvas = document.getElementById("barChart");
const barChart = new Chart(barChartCanvas, {
    type: "bar",
    data: barChartData,
    options: {
        scales: {
            x: {
                ticks: {
                    color: 'white', 
                },
                grid: {
                    color: 'white',
                },
            },
            y: {
                ticks: {
                    color: 'white', 
                },
                grid: {
                    color: 'white', 
                },
                beginAtZero: true,
            },
        },
        plugins: {
            legend: {
                labels: {
                    color: 'white' 
                }
            }
        }
    },
});



const pieChartData = {
    labels: ["Humidity", "Remaining"],
    datasets: [
        {
            label: "Humidity",
            backgroundColor: ["rgba(75, 192, 192, 0.5)", "rgba(255, 255, 255, 0.5)"],
            data: [],
        },
    ],
};
const pieChartCanvas = document.getElementById("pieChart");
const pieChart = new Chart(pieChartCanvas, {
    type: "pie",
    data: pieChartData,
});


const updateCharts = () => {
    setInterval(() => {
        getCityCoordinates();
    }, 60000);
};


updateCharts();
