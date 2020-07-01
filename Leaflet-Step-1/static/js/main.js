
const createMap = () => {
  map = L.map('map', { scrollWheelZoom: false }).setView([39.4941, -98.3446], 4);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  /* const mapboxAccessToken = API_KEY;
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + mapboxAccessToken, {
    id: 'mapbox/light-v10',
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    tileSize: 512,
    zoomOffset: -1
  }).addTo(map); */

  addGeoJSON(map)
  addLegend(map)
}

const addGeoJSON = (map) => {

  //const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson';
  //const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';
  //const url = 'static/data/all_month.geojson'
  const url = 'static/data/all_week.geojson';

  d3.json(url).then(quakes => {

    L.geoJson(quakes, {
      pointToLayer: pointToLayer,
      onEachFeature: onEachFeature
    }).addTo(map);

  })
}

const formatDate = (time) => {
  return new Date(time).toDateString()
}

const radiusScale = (magnitude) => {
  return Math.pow(magnitude, 2);
}

const colors = [
  '#90ee90',
  '#9acd32',
  '#ffd700',
  '#ffa500',
  '#e6550d',
  '#a63603'
]

const colorScale = (magnitude) => {

  return magnitude > 5 ? colors[5] :
    magnitude > 4 ? colors[4] :
      magnitude > 3 ? colors[3] :
        magnitude > 2 ? colors[2] :
          magnitude > 1 ? colors[1] :
            colors[0];
};

const pointToLayer = (feature, latlng) => {
  return L.circleMarker(latlng, {
    radius: radiusScale(feature.properties.mag),
    fillColor: colorScale(feature.properties.mag),
    color: "#333",
    weight: .5,
    opacity: 1,
    fillOpacity: .5
  })
}

const onEachFeature = (feature, layer) => {

  layer.on({
    mouseover: (event) => {
      layer = event.target;
      layer.setStyle({
        fillOpacity: 0.9
      });
    },
    mouseout: (event) => {
      layer = event.target;
      layer.setStyle({
        fillOpacity: 0.5
      });
    }
  });

  layer.bindPopup(`
    <style>
      .leaflet-popup-content-wrapper,
      .leaflet-popup-tip {
        background: ${colorScale(feature.properties.mag)};
        color: ${colorScale(feature.properties.mag) === '#ffd700' ? '#444' : 'whitesmoke'};
      }
    </style>
    <h3>${feature.properties.place}</h3>
    <hr>
    <p><b>Date:</b> ${formatDate(feature.properties.time)}<br/>
    <b>Magnitude:</b> ${feature.properties.mag}</p>
  `);

}

const addLegend = (map) => {

  let legend = L.control({ position: "bottomright" });

  legend.onAdd = () => {
    let div = L.DomUtil.create("div", "info legend"),
      labels = [],
      range_str;

    div.innerHTML += "<h4 style='margin:4px'>Magnitude</h4>"

    colors.forEach((color, index) => {
      range_str = `${index}${(index + 1 === colors.length) ? '+' : ' - ' + (index + 1)}`
      labels.push(
        '<div style="margin-bottom: .2rem;"><i style="border-radius: 50%; background:' + colors[index] + '"></i> ' + range_str + '</div>');
    })

    div.innerHTML += labels.join('');

    return div;
  };

  legend.addTo(map);
}

createMap()
