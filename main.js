import Map from 'https://cdn.jsdelivr.net/npm/ol@v9.2.4/Map.js';
import View from 'https://cdn.jsdelivr.net/npm/ol@v9.2.4/View.js';
import TileLayer from 'https://cdn.jsdelivr.net/npm/ol@v9.2.4/layer/Tile.js';
import VectorLayer from 'https://cdn.jsdelivr.net/npm/ol@v9.2.4/layer/Vector.js';
import OSM from 'https://cdn.jsdelivr.net/npm/ol@v9.2.4/source/OSM.js';
import VectorSource from 'https://cdn.jsdelivr.net/npm/ol@v9.2.4/source/Vector.js';
import Feature from 'https://cdn.jsdelivr.net/npm/ol@v9.2.4/Feature.js';
import Point from 'https://cdn.jsdelivr.net/npm/ol@v9.2.4/geom/Point.js';
import LineString from 'https://cdn.jsdelivr.net/npm/ol@v9.2.4/geom/LineString.js';
import { fromLonLat } from 'https://cdn.jsdelivr.net/npm/ol@v9.2.4/proj.js';
import { Style, Circle, Fill, Stroke, Text } from 'https://cdn.jsdelivr.net/npm/ol@v9.2.4/style.js';

const target = { name: '目标区域（海马斯）', coord: [123.2, 25.7], type: 'target' };
const satellites = [
  { name: 'AI卫星-01', coord: [124.2, 27.5], type: 'sat' },
  { name: 'AI卫星-02', coord: [126.4, 26.8], type: 'sat' },
  { name: '光学卫星-03', coord: [127.7, 24.9], type: 'sat' },
  { name: 'SAR卫星-04', coord: [122.2, 24.3], type: 'sat' },
];

const stations = [
  { name: '青岛站', coord: [120.4, 36.1], type: 'station' },
  { name: '三亚站', coord: [109.5, 18.2], type: 'station' },
];

const pointFeatures = [target, ...satellites, ...stations].map(
  (item) =>
    new Feature({
      geometry: new Point(fromLonLat(item.coord)),
      ...item,
    })
);

const routeFeatures = [
  ['AI卫星-01', target.coord, satellites[0].coord],
  ['AI卫星-02', target.coord, satellites[1].coord],
  ['光学卫星-03', target.coord, satellites[2].coord],
  ['SAR卫星-04', target.coord, satellites[3].coord],
  ['青岛站链路', satellites[0].coord, stations[0].coord],
  ['三亚站链路', satellites[3].coord, stations[1].coord],
].map(([name, from, to]) =>
  new Feature({
    geometry: new LineString([fromLonLat(from), fromLonLat(to)]),
    name,
    type: 'route',
  })
);

const vectorLayer = new VectorLayer({
  source: new VectorSource({
    features: [...routeFeatures, ...pointFeatures],
  }),
  style: (feature) => {
    const type = feature.get('type');
    if (type === 'route') {
      return new Style({
        stroke: new Stroke({
          color: 'rgba(255, 179, 64, 0.85)',
          width: 2,
          lineDash: [8, 6],
        }),
      });
    }

    const palette = {
      target: '#ff4b62',
      sat: '#19d2ff',
      station: '#27f0b6',
    };

    return new Style({
      image: new Circle({
        radius: type === 'target' ? 10 : 7,
        fill: new Fill({ color: palette[type] || '#ffffff' }),
        stroke: new Stroke({ color: '#ffffff', width: 1.3 }),
      }),
      text: new Text({
        text: feature.get('name'),
        offsetY: -18,
        fill: new Fill({ color: '#dbeeff' }),
        stroke: new Stroke({ color: '#07244e', width: 3 }),
      }),
    });
  },
});

new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
      opacity: 0.75,
    }),
    vectorLayer,
  ],
  view: new View({
    center: fromLonLat([122.6, 26.0]),
    zoom: 4.9,
  }),
});

const countdownElement = document.getElementById('countdown');
let remain = 26 * 60 + 40;

setInterval(() => {
  remain = Math.max(remain - 1, 0);
  const mm = String(Math.floor(remain / 60)).padStart(2, '0');
  const ss = String(remain % 60).padStart(2, '0');
  countdownElement.textContent = `00:${mm}:${ss}`;
}, 1000);
