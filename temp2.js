import Map from 'ol/Map';
import View from 'ol/View';
import { Draw } from 'ol/interaction';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer, VectorImage } from 'ol/layer';
import { get, fromLonLat } from 'ol/proj';
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
let featuresCoordinates = [
    milanCoordinates,
    [
        -9962902.400226727,
        4608153.233253395
    ],
    [
        -10011822.098329239,
        4021116.8560232413
    ]
];
// mapping manual data to features which are themselves point objects.
let features = featuresCoordinates.map(coordinates => new Feature(new Point(coordinates)));
// creating the vector layer and already feeding it the features I created from the db data
const source = new VectorSource({
    features: features,
});
// gets features from api
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
    let newFeatures = await getFeatures();
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
let vectorLayerStyle = new Style({
    image: imageStyle
})
// Creating the vector Image by combining the vector layer with some styles.
const vector = new VectorImage({
    source: source,
    style: vectorLayerStyle,
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
        zoom: 6,
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
let selectedImageStyle = new Circle({
    fill: new Fill({
        color: [80, 200, 100, 1],
    }),
    radius: 8,
    stroke: strokeStyle
})
let select = new Select({
    layers: [vector],
    // addCondition: (browserEvent) => {
    //     return shiftKeyOnly(browserEvent) && click(browserEvent)
    // },
    // removeCondition: (browserEvent) => click(browserEvent),
    style: new Style({ image: selectedImageStyle }),
})
map.addInteraction(select);
select.on('select', (e) => {
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
    elem.textContent = `You clicked on ${coords}`;
    elem.style.display = "block";
});

let coordinatesFromFeature = (feature) => {
    // console.log(feature);
    return feature.getGeometry().getCoordinates();
    // return [feature.geometry.x, feature.geometry.y];
}
let popup = new Overlay({
    element: document.getElementById('popup')
})
map.addOverlay(popup);
map.on('click', () => {
    let element = popup.getElement();
    element.style.display = "none";
})
let createPopup = () => {

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