const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
imageInput.onchange = evt => {
  const [file] = imageInput.files
  if (file) {
    imagePreview.src = URL.createObjectURL(file)
    imagePreview.removeAttribute('hidden')
  }
}

let searchForm = document.getElementsByClassName("geocodingForm")[0];
let resultsDiv = document.getElementsByClassName("geocodingResultsDiv")[0];
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
const displayResults = (container, results) => {
    container.innerHTML = "";
    let htmlList = htmlFromResults(results)
    htmlList.forEach(element => {
        container.append(element);
    })
}
function setLatitudeAndLongitude(lat, long){
let latitude = document.getElementById('latitude');
let longitude = document.getElementById('longitude');
    latitude.value = lat;
    longitude.value = long;
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
        div.addEventListener('click', setLatitudeAndLongitude.bind(null, result.latitude, result.longitude));
        return div;
    })
    return htmlList;
}
const gpsButton = document.getElementById('gpsButton');
const gpsResultsDiv = document.getElementsByClassName('gpsResultsDiv')[0];
function updateLatitudeAndLongitudeFromGPS(position){
    setLatitudeAndLongitude(position.coords.latitude, position.coords.longitude);
    console.log(position.coords)
}
function displayGeolocationError(error){
    gpsResultsDiv.innerHTML = error.message;
}
gpsButton.addEventListener('click', (e)=>{
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(updateLatitudeAndLongitudeFromGPS, displayGeolocationError);
    } else {
        gpsResultsDiv.innerHTML = "Geolocation is not supported by this browser";
    }
})