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
let milanCoordinates = fromLonLat([
    9.183224, 45.474510
]);
// mapping manual data to features which are themselves point objects.
// creating the vector layer and already feeding it the features I created from the db data
const source = new VectorSource({
    // features: features,
    // wrapX: false
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
let thinStroke = new Stroke({
    color: [0, 0, 0, 1],
    width: 1
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
let clickMarkerImage = new Circle({
    fill: new Fill({
        color: [200, 0, 0, 1],
    }),
    radius: 4,
    stroke: thinStroke,
})
let clickMarkerStyle = new Style({
    image: clickMarkerImage
})
const checkArraysEqual = (array1, array2) => array1.length === array2.length && array1.every((value, index) => value === array2[index]);
let popup = new Overlay({
    element: document.getElementById('popup'),
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
const adjustClickMarkerLongitude = (markerLongitude) => {
    let iterations = 0;
    let mapWidth = 40075016.68; // ?
    // Apparently map width is (fucking obviously) the full map width. If it does admit negative values like I had already thought it would that means that the whole range of coordinates will be covered not in [0, mapWidth] but in [-mapWidth/2, mapWidth/2]
    while (markerLongitude >= mapWidth / 2 || markerLongitude <= - mapWidth / 2) {
        if (iterations > 10) return -1;
        if (markerLongitude >= mapWidth) markerLongitude -= mapWidth;
        else markerLongitude += mapWidth;
        iterations++;
    }
    return markerLongitude;
}
const calculateCoordinates = (clickLongitude, featureLongitude) => {
    let mapWidth = 40075016.68; // ?
    let iterations = 0;
    let closest = -999999999;
    console.log(clickLongitude, featureLongitude)
    while ((clickLongitude / featureLongitude) > 1.02 || (clickLongitude / featureLongitude) < 0.98) {
        if (iterations > 10) return (closest);
        if (clickLongitude < featureLongitude) featureLongitude -= mapWidth;
        else featureLongitude += mapWidth;
        if (Math.abs(clickLongitude / featureLongitude - 1) < closest) {
            closest = clickLongitude / featureLongitude;
        }
        iterations++;
    }
    return (featureLongitude);
}
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
const getElementWidthAndHeight = element => {
    element.style.display = "block";
    var height = element.offsetHeight + 0;
    var width = element.offsetWidth + 0;
    return [width, height];
}
let nonFeatureMarker = null;
let pastMarkers = [];
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
        if (nonFeatureMarker) {
            source.removeFeature(nonFeatureMarker);
            nonFeatureMarker = null;
            console.log('removed a marker from the map') // DEBUGGING
        }
        // hide popup: think this has to happen both if previously a feature was selected or normal popup, even when feature is selected I want a popup to be shown.
        element.innerHTML = '';
        element.style.display = 'none';
        currentSelection = null;
    }
    let features = [];
    map.forEachFeatureAtPixel(e.pixel, f => {
        features.push(f);
    }, layer => layer === vector)
    let coords = null;
    // if (features.length > 0 && !features.includes(nonFeatureMarker)) {
    if (features.length > 0 && !features.includes(pastMarkers[pastMarkers.length - 1])) {
        console.log(nonFeatureMarker)
        console.log(source.getFeatures());
        console.log(pastMarkers); // For some reason .forEachFeatureAtPixel finds the feature even after it has been removed from the map. This only happens if I click twice in the same points, if I click another time it registers that the feature has been removed.
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
        // Want to show a small marker to indicate the point that was clicked on the map. Obv will need logic to hide it the next time the user clicks on map.

        let markerCoordinates = [adjustClickMarkerLongitude(e.coordinate[0]), e.coordinate[1]]
        console.log(`calculated coordinates: ${markerCoordinates}, previous coordinates ${e.coordinate}`)
        nonFeatureMarker = new Feature(new Point(markerCoordinates));
        // nonFeatureMarker.setStyle(clickMarkerStyle);
        nonFeatureMarker.setStyle(selectedStyle);
        pastMarkers.push(nonFeatureMarker)
        console.log(`feature length before adding marker: ${source.getFeatures().length}`)
        source.addFeature(nonFeatureMarker);
        console.log(`feature length before after marker: ${source.getFeatures().length}`)
        console.log(`click marker coordinates: ${nonFeatureMarker.getGeometry().getCoordinates()}`);
        console.log(`click coordinates ${e.coordinate}`)
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
    // The current solution works only without zoom. When the user opens a popup and then zooms in or out the popup gets moved because its anchor point is not the clicked point but one shifted to make it visible.
    console.log(element) //DEBUGGING
    element.style.display = 'block';
    element.style.display = 'absolute';
    // requestAnimationFrame(positionPopup.bind(null, element, e.coordinate));
    let elementWidth = element.offsetWidth;
    let elementHeight = element.offsetHeight;
    console.log(`element offsetwidth: ${elementWidth}, element offsetheight: ${elementHeight}`)
    let [left, top] = map.getPixelFromCoordinate(e.coordinate); // Can probably just use e.pixel instead
    let [mapWidth, mapHeight] = map.getSize();
    let right = mapWidth - left;
    let bottom = mapHeight - top;
    console.log(`available space [left, top]: [${left}, ${top}]. available space [right, bottom]: [${right}, ${bottom}]`);
    let [xDirection, yDirection] = ['right', 'bottom'];
    if (right < elementWidth && left >= elementWidth) xDirection = 'left';
    if (bottom < elementHeight && top >= elementHeight) yDirection = 'top';
    let xPosition = xDirection === 'right' ? left : left - elementWidth - 16; // By default the popup has an offset of 8 pixel to the right because of margin, by removing 16 I'm reversing the margin to the left
    let yPosition = yDirection === 'bottom' ? top : top - elementHeight - 16;
    // popup.setPosition(map.getCoordinateFromPixel([xPosition, yPosition]));
    let xOffset = xDirection === 'left' ? - elementWidth - 16 : 0;
    let yOffset = yDirection === 'top' ? - elementHeight - 16 : 0;
    element.style.visibility = 'visible';
    popup.setOffset([xOffset, yOffset]);
    if (features.length > 0) {
        let featureCoords = features[0].getGeometry().getCoordinates();
        console.log(`feature coords are: ${featureCoords},  event coordinates are: ${e.coordinate}`)
        let calculatedCoordinates = calculateCoordinates(e.coordinate[0], featureCoords[0])
        console.log(`calculated coordinates: ${calculatedCoordinates}`);
        popup.setPosition([calculatedCoordinates, featureCoords[1]])
    } else {
        popup.setPosition(e.coordinate);

    }
    // popup.setPosition(coords);




    // console.log(map.getCoordinateFromPixel([xPosition, yPosition]))

    // console.log(map.getEventPixel(e.originalEvent)); // DEBUGGING
    // console.log('first row was translation of coordinates into pixels, second was event pixel') // Not sure why but getEventPixel needs e.originalEvent instead. Also the numbers returned are 'almost' the same. 333 vs 333+6e-14
    // console.log(map.getViewport()); SEEMS FUCKING USELESS, maybe not though? map size is the size in pixels of the actual map without navbar.
    // END OF POPUP POSITIONING
    // popup.setPositioning('bottom-right') doens't do anything, the default is top-left
    // popup.setPosition(e.coordinate);
    // POSITIONING OF POPUP

})
function positionPopup(element, eventCoordinates) {

    // let [elementWidth, elementHeight] = getElementWidthAndHeight(element);
    // popup.setPosition(coords); To do it properly I'd have to understand the periodicity of the map width / longitude and adjust for that. A great simplification is to just put popup wherever the user clicks even thought it won't be perfectly centered on the feature. 
    // console.log(`event coordinates: ${e.coordinate}\ncalculated coordinates: ${coords}`)

}








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