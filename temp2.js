import Map from 'ol/Map';
import View from 'ol/View';
import { Draw } from 'ol/interaction';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer, VectorImage } from 'ol/layer';
import { get } from 'ol/proj';
import { shiftKeyOnly, click } from 'ol/events/condition'
import { Select } from 'ol/interaction';
import { Style, Fill, Stroke, Circle } from 'ol/style';
import {Point} from 'ol/geom';
import {Feature} from 'ol/index';

let featuresCoordinates = [
  [
    -9385649.962617075,
    4461394.138945856
  ],
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
        center: [-11000000, 4600000],
        zoom: 4,
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
    console.log(source.getFeatures());
	let coordinates = source.getFeatures().map(feature => feature.getGeometry().getCoordinates());
	console.log(coordinates);
    console.log(e)
});
