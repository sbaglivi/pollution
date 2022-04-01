import Map from 'ol/Map';
import View from 'ol/View';
import { Draw } from 'ol/interaction';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer, VectorImage } from 'ol/layer';
import { get, fromLonLat, toLonLat } from 'ol/proj';
import { shiftKeyOnly, click } from 'ol/events/condition'
import { Select } from 'ol/interaction';
import { Style, Fill, Stroke, Circle, Icon } from 'ol/style';
import { Point } from 'ol/geom';
import { Feature } from 'ol/index';
import { Overlay } from 'ol';
import { toSize } from 'ol/size';
import { Control, defaults as defaultControls } from 'ol/control'

// need to invert the coordinates order when copying from gmaps and also call fromLonLat since openlayers uses mercator
let milanCoordinates = fromLonLat([
    9.183224, 45.474510
]);
// mapping manual data to features which are themselves point objects.
// creating the vector layer and already feeding it the features I created from the db data
const source = new VectorSource({
    // features: features,
});
// gets features from api
let pollution_sites;
const getPollutionSites = async () => {
    let response = await fetch("http://localhost:3000/pollution_sites")
    if (response.ok) {
        pollution_sites = (await response.json()).results;
        console.log(pollution_sites)
        console.log('Just printed the pollution sites')
        let newFeatures = pollution_sites.map(db_feature => new Feature(new Point(fromLonLat([db_feature.longitude, db_feature.latitude]))));
        return newFeatures;
    }
}
const getFeatures = async () => {
    let response = await fetch("http://localhost:3000/features");
    if (response.ok) {
        let featuresFromDB = await response.json();
        let newFeatures = featuresFromDB.results.map(db_feature => new Feature(new Point([db_feature.x, db_feature.y])));
        return newFeatures;

    } else {
        console.log('response was not ok')
        console.log(response);
    }
}
// create a function that uses the data from the api to add features to source after it has been created
const addFeatures = async (source) => {
    // let newFeatures = await getFeatures();
    let newFeatures = await getPollutionSites();
    console.log(newFeatures);
    source.addFeatures(newFeatures);
}
addFeatures(source);

// defining styles for the vector layer
let strokeStyle = new Stroke({
    color: [50, 50, 50, 1],
    width: 2,
})
let imageStyle = new Circle({
    fill: new Fill({
        color: [80, 80, 80, 1],
    }),
    radius: 6,
    stroke: strokeStyle
})
let unselectedStyle = new Style({
    image: imageStyle
})
// Creating the vector Image by combining the vector layer with some styles.
const vector = new VectorImage({
    source: source,
    style: unselectedStyle,
});
// Creating the tile layer
const tile = new TileLayer({
    source: new OSM()
})
let map = new Map({
    layers: [tile, vector],
    target: 'map',
    view: new View({
        center: milanCoordinates,
        zoom: 3,
    }),
})

// This is the draw interaction, ultimately I don't want this to exist. Points will be loaded from the db and then will just be selected through clicks
let draw = new Draw({
    source: source,
    type: 'Point',
});
// map.addInteraction(draw);

// This creates an icon style that is used for the selected items. For now I'm using scale since size doesn't seem to work
const iconStyle = new Style({
    image: new Icon({
        src: '../images/maps-pin.png',
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        scale: 0.05,
    }),
});

// Select interaction, not even sure if it has a point. The only interaction I want to have is the ability to click and open a relative popup. Max popup opens should be 1, when popup is open 
// the point look should change so maybe I do need to have a select interaction. Limit should be 1 and is not right now
let selectedImage = new Circle({
    fill: new Fill({
        color: [80, 200, 100, 1],
    }),
    radius: 8,
    stroke: strokeStyle
})
let selectedStyle = new Style({
    image: selectedImage
})
const checkArraysEqual = (array1, array2) => array1.length === array2.length && array1.every((value, index) => value === array2[index]);
let popup = new Overlay({
    element: document.getElementById('popup')
})
map.addOverlay(popup);
/*
let select = new Select({
    layers: [vector],
    // addCondition: (browserEvent) => {
    //     return shiftKeyOnly(browserEvent) && click(browserEvent)
    // },
    // removeCondition: (browserEvent) => click(browserEvent),
    style: selectedStyle,
})
map.addInteraction(select);
select.on('select', (e) => {
    // e.stopPropagation();
    let coordinates = source.getFeatures().map(feature => feature.getGeometry().getCoordinates());
    // console.log(source.getFeatures());
    // console.log(coordinates);
    console.log(e)
    const elem = popup.getElement();

    // e.selected[0] seems to be the same result as e.target.getFeatures()[e.target.getFeatures().length -1] basically the best option since it's always the last one and it's short

    // console.log(e);
    // console.log(e.target);
    // console.log(e.target.getFeatures()[0].getGeometry())
    // console.log(e.selected[0]) // This is the last element selected
    // console.log(e.selected[0].getGeometry().getCoordinates())
    // console.log(select.getFeatures());
    if (e.selected.length == 0) return;
    while (select.getFeatures().getLength() > 1) {
        select.getFeatures().removeAt(0);
    }
    const coords = coordinatesFromFeature(e.selected[0]);
    popup.setPosition(coords);
    let pollution_site = pollution_sites.filter(site => checkArraysEqual(fromLonLat([site.longitude, site.latitude]), coords));
    pollution_sites.forEach(site => {
        let lonlat = fromLonLat([site.longitude, site.latitude]);
        console.log(lonlat);
        console.log(checkArraysEqual(lonlat, coords));


    })
    console.log('point coordinates instead are')
    console.log(coords);
    elem.textContent = `You clicked on ${coords}, ${pollution_site[0].name}`;
    elem.style.display = "block";
});

let coordinatesFromFeature = (feature) => {
    // console.log(feature);
    return feature.getGeometry().getCoordinates();
    // return [feature.geometry.x, feature.geometry.y];
}
map.on('click', e => {
    e.stopPropagation();
    let element = popup.getElement();
    element.style.display = "none";
    console.log('click on map')
    console.log(e)
    console.log('done printing map click e')
    // I need click coordinates. I might need to hide the last popup but maybe I can just move it and overwrite the content. I do need to remove 
    // the selection effect though. The selected item seemed to deselect itself automatically though, not sure how? need to test
})
*/
let currentSelection = null;
// need a normal style and a selected style, when I click on a new point I remove the selected style from old selection, update selection pointer and apply new style to clicked item.
// In theory there should be 3 possible states before a click: feature selected / popup open outside of a feature / nothing. 
const createFeaturePopup = (element, sites) => {
    for (let site of sites) {
        let featureDiv = document.createElement('div');
        featureDiv.classList.add('featureDiv')
        let link = document.createElement('a');
        let title = document.createElement('h4');
        title.textContent = site.name;
        link.append(title);
        link.href = `http://localhost:3000/submissions/${site.id}`;
        featureDiv.append(link);
        let imgDiv = document.createElement('div');
        imgDiv.classList.add('imgDiv');
        let img = document.createElement('img');
        img.src = `/resized/${site.image_name}`;
        imgDiv.append(img);
        featureDiv.append(imgDiv);
        if (!site.hide_author) {
            let by = document.createElement('p');
            by.classList.add('author');
            by.textContent = `by: ${site.author}`;
            imgDiv.append(by);
        }
        // let lonlatcoords = document.createElement('p');
        // lonlatcoords.textContent = `[${site.latitude}, ${site.longitude}]`;
        // featureDiv.append(lonlatcoords);
        let submittedOn = document.createElement('p');
        submittedOn.classList.add('date');
        let date = new Date(site.submission_date);
        submittedOn.textContent = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        imgDiv.append(submittedOn);
        element.append(featureDiv)
    }
}
/* Clusters 
Different color for feature that get selected.
When I deselect I'll have an array of items to deselect instead of one
For simplicity popup will open again on click point rather than on feature / middle of features.

*/
map.on('singleclick', e => {
    let element = popup.getElement();
    console.log(element) // DEBUGGING
    if (currentSelection !== null) {
        if (currentSelection !== 'popup') {
            // unselect feature
            if (Array.isArray(currentSelection)) {
                for (let selected of currentSelection) {
                    selected.setStyle(unselectedStyle);
                }
            } else {
                currentSelection.setStyle(unselectedStyle);
            }
            console.log(currentSelection); // DEBUGGING
        }
        // hide popup: think this has to happen both if previously a feature was selected or normal popup, even when feature is selected I want a popup to be shown.
        element.innerHTML = '';
        element.style.display = 'none';
        currentSelection = null;
    }
    let features = [];
    map.forEachFeatureAtPixel(e.pixel, f => {
        features.push(f);
    })
    let coords = null;
    if (features.length > 0) {
        console.log(features);
        console.log('just printed the feature(s)') // DEBUGGING
        let selected_sites;
        if (features.length > 1) {
            currentSelection = features;
            // let coords = currentSelection.map(feature => feature.getGeometry().getCoordinates());
            selected_sites = new Set();
            for (let feature of currentSelection) {
                feature.setStyle(selectedStyle);
                // selected_sites.add(...pollution_sites.filter(site => checkArraysEqual(fromLonLat([site.longitude, site.latitude]), feature.getGeometry().getCoordinates())))
                pollution_sites.filter(site => checkArraysEqual(fromLonLat([site.longitude, site.latitude]), feature.getGeometry().getCoordinates())).forEach(site => selected_sites.add(site));
            }
            console.log(`selected sites length before removing duplicates: ${selected_sites.size}`); // DEBUGGING
            // selected_sites = [...new Set(selected_sites)];
            console.log(`after: ${selected_sites.size}`); // DEBUGGING
            // I'll probably modify this to be a set from the beginning I believe, I just want to check if it's working correctly.
        } else {
            currentSelection = features[0];
            currentSelection.setStyle(selectedStyle);
            coords = currentSelection.getGeometry().getCoordinates();
            selected_sites = pollution_sites.filter(site => checkArraysEqual(fromLonLat([site.longitude, site.latitude]), coords));
        }
        // element.textContent = `You clicked on the feature at ${coords}\n${pollution_site.length > 0 ? pollution_site[0].name : "Could not retrieve title"}`

        createFeaturePopup(element, selected_sites)
        console.log(selected_sites) // DEBUGGING
        console.log('printed selected sites')
        // There is a bug where the popup gets positioned in a certain place but if you moved the map in the opposite direction it will be quite far away.

    } else {
        coords = e.coordinate;
        let [lon, lat] = toLonLat(coords);
        currentSelection = 'popup' // seems shit 
        element.textContent = `You clicked at [${lat.toFixed(5)},${lon.toFixed(5)}]` // testing on google maps even 4 digits seems to be plenty for most applications
        let submitLink = document.createElement('a');
        submitLink.textContent = 'Signal an event that happened here'
        submitLink.href = `http://localhost:3000/submit/${lat},${lon}`
        submitLink.style.display = 'inline-block'
        element.append(submitLink);

    }
    console.log(element) //DEBUGGING
    popup.setPosition(e.coordinate);
    // popup.setPosition(coords); To do it properly I'd have to understand the periodicity of the map width / longitude and adjust for that. A great simplification is to just put popup wherever the user clicks even thought it won't be perfectly centered on the feature. 
    console.log(`event coordinates: ${e.coordinate}\ncalculated coordinates: ${coords}`)
    element.style.display = 'block';


})









// /* Geocoding if it finishes installing
// var geocoder = new Geocoder('nominatim', {
//     provider: 'mapquest',
//     key: '__some_key__',
//     lang: 'pt-BR', //en-US, fr-FR
//     placeholder: 'Search for ...',
//     targetType: 'text-input',
//     limit: 5,
//     keepOpen: true
// });
// map.addControl(geocoder);