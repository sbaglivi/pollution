let searchForm = document.getElementsByClassName("searchForm")[0];
let resultsDiv = document.getElementsByClassName("results")[0];
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
        return div;
    })
    return htmlList;
}

/*
To get current position from user
navigator.geolocation.getCurrentPosition(successFun, errorFun, options);
successFun example:
const logCoordinates = (position) => {
    console.log(`[${position.coords.latitude}, ${position.coords.longitude}]`)
    console.log(`Accuracy: ${position.coords.accuracy} meters`);
}
*/