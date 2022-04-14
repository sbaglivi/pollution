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
// import { getEventPixel, getPixelFromCoordinate } from 'ol/pixel';
// import { getCoordinateFromPixel } from 'ol/coordinate';
import { toSize } from 'ol/size';
import { Control, defaults as defaultControls } from 'ol/control'

// need to invert the coordinates order when copying from gmaps and also call fromLonLat since openlayers uses mercator
const source = new VectorSource();
// gets features from api
let pollution_sites;
const getPollutionSites = async () => {
    let response = await fetch("/api/getAllSubmissions");
    if (response.ok) {
        pollution_sites = await response.json();
        let newFeatures = pollution_sites.map(db_feature => new Feature(new Point(fromLonLat([db_feature.longitude, db_feature.latitude]))));
        return newFeatures;
    }
}
const addFeatures = async (source) => {
    let newFeatures = await getPollutionSites();
    source.addFeatures(newFeatures);
}
addFeatures(source);

// defining styles for the vector layer
let normalStroke = new Stroke({
    color: [50, 50, 50, 1],
    width: 2,
})
let thinStroke = new Stroke({
    color: [0, 0, 0, 1],
    width: 1
})
let imageStyle = new Circle({
    fill: new Fill({
        color: [80, 80, 80, 1],
    }),
    radius: 6,
    stroke: normalStroke
})
let unselectedStyle = new Style({ // this is where I define the style used for normal markers loaded from the db. the image property is a circle with a fill color, a radius, a stroke for the border. the stroke itself then has a width and a color.
    image: imageStyle
})
let selectedImage = new Circle({ // this is for markers that get selected, the radius is slightly bigger and the color is green instead of black
    fill: new Fill({
        color: [80, 200, 100, 1],
    }),
    radius: 8,
    stroke: normalStroke
})
let selectedStyle = new Style({
    image: selectedImage
})
let clickMarkerImage = new Circle({ // this is for markers placed by a click on the map not on other markers. smaller radius and stroke, red fill.
    fill: new Fill({
        color: [200, 0, 0, 1],
    }),
    radius: 4,
    stroke: thinStroke,
})
let clickMarkerStyle = new Style({
    image: clickMarkerImage
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
        center: fromLonLat([9.188925808421253, 45.46311416228131]),
        zoom: 3,
    }),
})
let popup = new Overlay({
    element: document.getElementById('popup'),
})
map.addOverlay(popup);


const checkArraysEqual = (array1, array2) => array1.length === array2.length && array1.every((value, index) => value === array2[index]);

const adjustClickMarkerLongitude = (markerLongitude) => {
    let iterations = 0;
    let mapWidth = 40075016.68; // Apparently map width is (fucking obviously) the full map width. If it does admit negative values like I had already thought it would that means that the whole range of coordinates will be covered not in [0, mapWidth] but in [-mapWidth/2, mapWidth/2]
    while (markerLongitude >= mapWidth / 2 || markerLongitude <= - mapWidth / 2) {
        if (iterations > 10) {
            console.log(`After 10 attempts I failed to adjust the click marker longitude`);
            return -1;
        }
        if (markerLongitude >= mapWidth) markerLongitude -= mapWidth;
        else markerLongitude += mapWidth;
        iterations++;
    }
    return markerLongitude;
}
const calculateLongitude = (clickLongitude, featureLongitude) => {
    let mapWidth = 40075016.68; // ?
    let iterations = 0;
    let closest = -999999999;
    while ((clickLongitude / featureLongitude) > 1.4 || (clickLongitude / featureLongitude) < 0.6) { // In africa clicking one the feature, but not on the exact middle, can create differences of even 30%.
        if (iterations > 10) {
            console.log(`After 10 iterations I failed to adjust the feature longitude`);
            return (closest);
        }
        if (clickLongitude < featureLongitude) featureLongitude -= mapWidth;
        else featureLongitude += mapWidth;
        if (Math.abs(clickLongitude / featureLongitude - 1) < closest) {
            closest = clickLongitude / featureLongitude;
        }
        iterations++;
    }
    return (featureLongitude);
}
// need a normal style and a selected style, when I click on a new point I remove the selected style from old selection, update selection pointer and apply new style to clicked item.
// In theory there should be 3 possible states before a click: feature selected / popup open outside of a feature / nothing. 
const createSelectPopup = (element, sites) => { //TODO relook at this shit
    element.innerHTML = '';
    for (let site of sites) {
        let featureDiv = document.createElement('div');
        featureDiv.classList.add('featureDiv')
        let link = document.createElement('a');
        let title = document.createElement('h4');
        title.textContent = site.name;
        link.append(title);
        link.href = `/submission/${site.id}`;
        featureDiv.append(link);
        let imgDiv = document.createElement('div');
        imgDiv.classList.add('imgDiv');
        let img = document.createElement('img');
        img.src = `/resized/${site.image_name}`; //TODO fix this once I fix the express.static
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

function undoLastInteraction(lastInteraction) {
    if (lastInteraction.type !== null) {
        if (lastInteraction.type === 'select') {
            if (Array.isArray(lastInteraction.marker)) {
                for (let marker of lastInteraction.marker) {
                    marker.setStyle(unselectedStyle);
                }
            } else {
                lastInteraction.marker.setStyle(unselectedStyle);
            }
        } else if (lastInteraction.type === 'clickMarker') {
            source.removeFeature(lastInteraction.marker);
        } else {
            console.log(`lastInteraction type is not null / select / clickMarker: ${lastInteraction.type}`);
        }
    }
}
let lastInteraction = { type: null, marker: null };
let lastClickMarker = null; // TODO: I'd rather not have this line as each other line with lastClickMarker, problem is that despite undoingLastInteractoin before checking featuresAtPixel the last clickMarker still ges found when someone double clicks a location. then it gets considered as a feature but since it's not connected to any submission it just shows an empty popup where clicked.
map.on('singleclick', click => {
    undoLastInteraction(lastInteraction);
    let clickedFeatures = [];
    map.forEachFeatureAtPixel(click.pixel, f => { clickedFeatures.push(f); });
    let popupElement = popup.getElement(); //TODO if I can I'd like to move this elsewhere
    if (clickedFeatures.length === 0 || clickedFeatures[0] === lastClickMarker) {
        lastInteraction.type = 'clickMarker';
        let markerCoordinates = [adjustClickMarkerLongitude(click.coordinate[0]), click.coordinate[1]];
        let clickMarker = new Feature(new Point(markerCoordinates));
        lastInteraction.marker = clickMarker;
        lastClickMarker = clickMarker;
        clickMarker.setStyle(clickMarkerStyle);
        source.addFeature(clickMarker);
        createClickMarkerPopup(popupElement, click.coordinate);
    } else {
        let selectedFeatures;
        lastInteraction.type = 'select';
        if (clickedFeatures.length > 1) {
            lastInteraction.marker = clickedFeatures;
            selectedFeatures = new Set();
            for (let feature of clickedFeatures) {
                feature.setStyle(selectedStyle);
                let selectedSites = pollution_sites.filter(site => checkArraysEqual(fromLonLat([site.longitude, site.latitude]), feature.getGeometry().getCoordinates()))
                selectedSites.forEach(site => selectedFeatures.add(site));
            }
        } else {
            lastInteraction.marker = clickedFeatures[0];
            clickedFeatures[0].setStyle(selectedStyle);
            selectedFeatures = pollution_sites.filter(site => checkArraysEqual(fromLonLat([site.longitude, site.latitude]), clickedFeatures[0].getGeometry().getCoordinates()))
        }
        createSelectPopup(popupElement, selectedFeatures);
    }
    popupElement.style.display = 'block';
    positionAndShowPopup(popupElement, popup, click, clickedFeatures.length && clickedFeatures[0])
})

function createClickMarkerPopup(popup, coordinates) {
    popup.innerHTML = '';
    let [lon, lat] = toLonLat(coordinates);
    popup.textContent = `You clicked at [${lat.toFixed(5)}, ${lon.toFixed(5)}]` // testing on google maps even 4 digits seems to be plenty for most applications
    let submitLink = document.createElement('a');
    submitLink.textContent = 'Signal an event that happened here'
    submitLink.href = `/submit/${lat},${lon}`
    submitLink.style.display = 'inline-block'
    popup.append(submitLink);
}
function positionAndShowPopup(popupElement, popup, click, feature = null) {
    let [popupWidth, popupHeight] = [popupElement.offsetWidth, popupElement.offsetHeight];
    let [mapWidth, mapHeight] = map.getSize();
    // let [left, top] = map.getPixelFromCoordinate(click.coordinate);
    let [left, top] = click.pixel; // see above line for how it was done, trying to get pixel directly from click
    let [availableRight, availableBottom] = [mapWidth - left, mapHeight - top];
    let xDirection = (availableRight < popupWidth && left >= popupWidth) ? 'left' : 'right';
    let yDirection = (availableBottom < popupHeight && top >= popupHeight) ? 'top' : 'bottom';
    let xOffset = (xDirection == 'left') ? - popupWidth - 16 : 0; // 16 is to invert the margin which by default is 8 pixel to the right and bottom
    let yOffset = (yDirection == 'top') ? - popupHeight - 16 : 0;
    popup.setOffset([xOffset, yOffset]); // offset does not get reset on its own.
    if (feature) {
        let featureCoordinates = feature.getGeometry().getCoordinates();
        popup.setPosition([calculateLongitude(click.coordinate[0], featureCoordinates[0]), featureCoordinates[1]])
    } else {
        popup.setPosition(click.coordinate);
    }
}