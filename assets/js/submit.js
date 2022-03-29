const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
imageInput.onchange = evt => {
    const [file] = imageInput.files
    if (file) {
        imagePreview.src = URL.createObjectURL(file)
        imagePreview.removeAttribute('hidden')
    }
}

let geocodingForm = document.getElementsByClassName("geocodingForm")[0];
let geocodingInput = geocodingForm.getElementsByTagName('input')[0];
let geocodingButton = geocodingForm.getElementsByTagName('button')[0];
let resultsDiv = document.getElementsByClassName("geocodingResultsDiv")[0];

const getGeocodingResults = async () => {
    let address = geocodingInput.value;
    let response = await fetch(`http://localhost:3000/geocode/${address}`)
    if (!response.ok) {
        console.log(`Error: ${response}`);
        return;
    }
    let results = await response.json();
    console.log(results);
    displayResults(resultsDiv, results.results);
}
geocodingButton.addEventListener('click', async (e) => {
    e.preventDefault();
    getGeocodingResults();
})
geocodingInput.addEventListener('keydown', async (e) => {
    if (e.code === 'Enter') {
        e.preventDefault();
        getGeocodingResults();
    }
})

/*
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let formData = new FormData(searchForm);
    let address = formData.get('address');
    let response = await fetch(`http://localhost:3000/geocode/${address}`)
    if (!response.ok) {
        console.log(`Error: ${response}`);
        return;
    }
    let results = await response.json();
    console.log(results);
    displayResults(resultsDiv, results.results);
})
*/
let activeResult = null;
const displayResults = (container, results) => {
    container.innerHTML = "";
    activeResult = null;
    let htmlList = htmlFromResults(results)
    htmlList.forEach(element => {
        container.append(element);
    })
}
function setLatitudeAndLongitude(lat, long) {
    let latitude = document.getElementById('latitude');
    let longitude = document.getElementById('longitude');
    latitude.value = lat;
    longitude.value = long;
}
const resultOnClick = (HTMLelem, latitude, longitude) => {
    setLatitudeAndLongitude(latitude, longitude);
    if (activeResult)
        activeResult.classList.toggle('active');
    activeResult = HTMLelem;
    activeResult.classList.add('active')
}
const htmlFromResults = (results) => {
    if (results.length === 0) {
        let p = document.createElement('p');
        p.textContent = "Sorry, there were no results for your search";
        return [p];
    }
    let htmlList = results.map(result => {
        let div = document.createElement('div');
        div.classList.add("resultDiv");
        let p = document.createElement('p');
        p.textContent = `${result.formattedAddress} - [${result.latitude}, ${result.longitude}]`;
        div.append(p);
        div.addEventListener('click', resultOnClick.bind(null, p, result.latitude, result.longitude));
        return div;
    })
    return htmlList;
}
const gpsButton = document.getElementById('gpsButton');
const gpsResultsDiv = document.getElementsByClassName('gpsResultsDiv')[0];
function updateLatitudeAndLongitudeFromGPS(position) {
    setLatitudeAndLongitude(position.coords.latitude, position.coords.longitude);
    console.log(position.coords)
}
function displayGeolocationError(error) {
    gpsResultsDiv.innerHTML = error.message;
}
gpsButton.addEventListener('click', (e) => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updateLatitudeAndLongitudeFromGPS, displayGeolocationError);
    } else {
        gpsResultsDiv.innerHTML = "Geolocation is not supported by this browser";
    }
})
let submitForm = document.getElementById('submitForm');
// submitForm.addEventListener('submit', e => {
//     e.preventDefault();
//     let formData = new FormData(submitForm);
//     for (let pair of formData.entries()) {
//         console.log(`${pair[0]} - ${pair[1]}`)
//     }
//     console.log(`hideAuthor is ${formData.get('hideAuthor')}`)
// })