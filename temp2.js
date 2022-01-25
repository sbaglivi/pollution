import Map from 'ol/Map';
import View from 'ol/View';
import { Draw } from 'ol/interaction';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer, VectorImage } from 'ol/layer';
import { get, fromLonLat } from 'ol/proj';
import { shiftKeyOnly, click } from 'ol/events/condition'
import { Select } from 'ol/interaction';
import { Style, Fill, Stroke, Circle } from 'ol/style';
import { Point } from 'ol/geom';
import { Feature } from 'ol/index';
import { Overlay } from 'ol';
// import Geocoder from 'ol-geocoder';

const getFeatures = async () => {
    let response = await fetch("http://localhost:3000/features");
    if (response.ok) {
        let featuresFromDB = await response.json();
        let newFeatures = featuresFromDB.results.map(db_feature => new Feature(new Point([db_feature.x, db_feature.y])));
        return newFeatures;
        // let featureCoords =  featuresFromDB.features

    } else {
        console.log('response was not ok')
        console.log(response);
    }
}
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
let features = featuresCoordinates.map(coordinates => new Feature(new Point(coordinates)));
let points = featuresCoordinates.map(coordinates => new Point(coordinates));
const source = new VectorSource({
    features: features,
});
const addFeatures = async (source) => {
    let newFeatures = await getFeatures();
    console.log(newFeatures);
    source.addFeatures(newFeatures);
}
addFeatures(source);
const tile = new TileLayer({
    source: new OSM()
})
let fillStyle = new Fill({
    color: [12, 12, 12, 1],
})
let strokeStyle = new Stroke({
    color: [50, 50, 50, 1],
    width: 3,
})
let imageStyle = new Circle({
    fill: new Fill({
        color: [100, 100, 100, 1],
    }),
    radius: 8,
    stroke: strokeStyle
})
let vectorLayerStyle = new Style({
    // fill: fillStyle,
    // stroke: strokeStyle,
    image: imageStyle
})
const vector = new VectorImage({
    source: source,
    style: vectorLayerStyle,
});

let map = new Map({
    layers: [tile, vector],
    target: 'map',
    view: new View({
        center: milanCoordinates,
        zoom: 6,
    }),
})
let draw = new Draw({
    source: source,
    type: 'Point',
});
map.addInteraction(draw);
let select = new Select({
    layers: [vector],
    condition: (browserEvent) => {
        return shiftKeyOnly(browserEvent) && click(browserEvent)
    }
})
map.addInteraction(select);
select.on('select', (e) => {
    let coordinates = source.getFeatures().map(feature => feature.getGeometry().getCoordinates());
    // console.log(source.getFeatures());
    // console.log(coordinates);
    // console.log(e)
    const elem = popup.getElement();

    // e.selected[0] seems to be the same result as e.target.getFeatures()[e.target.getFeatures().length -1] basically the best option since it's always the last one and it's short

    console.log(e);
    console.log(e.target);
    // console.log(e.target.getFeatures()[0].getGeometry())
    console.log(e.selected[0])
    // console.log(e.selected[0].getGeometry().getCoordinates())
    const coords = coordinatesFromFeature(e.selected[0]);
    popup.setPosition(coords);
    elem.textContent = `You clicked on ${coords}`;
    elem.style.display = "block";
});

let coordinatesFromFeature = (feature) => {
    console.log(feature);
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