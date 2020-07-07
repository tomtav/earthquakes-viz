
const createMap = () => {

  var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  /*
  source: https://docs.mapbox.com/api/maps/#styles
  The following Mapbox styles are available to all accounts using a valid access token:
    mapbox/streets-v11
    mapbox/outdoors-v11
    mapbox/light-v10
    mapbox/dark-v10
    mapbox/satellite-v9
    mapbox/satellite-streets-v11
  */


  const mapboxAccessToken = API_KEY;
  const mapboxURL = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + mapboxAccessToken;
  const mapboxATTR = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';

  var satellite = L.tileLayer(mapboxURL, {
    attribution: mapboxATTR,
    tileSize: 512,
    zoomOffset: -1,
    id: "mapbox/satellite-v9"
  });

  var grayscale = L.tileLayer(mapboxURL, {
    attribution: mapboxATTR,
    tileSize: 512,
    zoomOffset: -1,
    id: 'mapbox/light-v10'
  });

  var darkscale = L.tileLayer(mapboxURL, {
    attribution: mapboxATTR,
    tileSize: 512,
    zoomOffset: -1,
    id: 'mapbox/dark-v10'
  });

  var outdoors = L.tileLayer(mapboxURL, {
    attribution: mapboxATTR,
    tileSize: 512,
    zoomOffset: -1,
    id: "mapbox/outdoors-v11"
  });


  // Initialize all of the LayerGroups we'll be using
  var layers = {
    EARTHQUAKES: new L.geoJson(null, {
      pointToLayer: pointToLayer,
      onEachFeature: onEachFeature
    }),
    TECTONICS: new L.geoJson(null, {
      style: () => ({
        fillColor: '#000',
        fillOpacity: 0,
        color: 'red',
        weight: 2,
        opacity: .65
      })
    })
  };

  // Create the map with our layers
  var map = L.map('map', {
    scrollWheelZoom: false,
    center: [39.4941, -98.3446],
    zoom: 4,
    layers: [
      layers.TECTONICS,
      layers.EARTHQUAKES
    ]
  });

  // Add our 'lightmap' tile layer to the map
  osm.addTo(map);

  // Create base layers
  var baseLayers = {
    'Satellite': satellite,
    'Grayscale': grayscale,
    'Outdoors': outdoors,
    'Dark': darkscale,
    'OpenStreetMap': osm
  }

  // Create an overlays object to add to the layer control
  var overlays = {
    "Fault Lines": layers.TECTONICS,
    "Earthquakes": layers.EARTHQUAKES
  };

  // Create a control for our layers, add our overlay layers to it
  L.control.layers(baseLayers, overlays, { collapsed: false }).addTo(map);


  addQuakes(layers.EARTHQUAKES)
  addFaults(layers.TECTONICS)

  const magnitudeLegend = createMagnitudeLegend()
  magnitudeLegend.addTo(map);

  map.on('overlayadd', function (layer) {
    layers.EARTHQUAKES.bringToFront();
    if (layer.name === 'Earthquakes') {
      magnitudeLegend.addTo(map);
    }
  });
  map.on('overlayremove', function (layer) {
    if (layer.name === 'Earthquakes') {
      this.removeControl(magnitudeLegend)
    }
  })


}

const addQuakes = (layer) => {

  const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson';
  //const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';
  //const url = 'static/data/all_month.geojson'
  //const url = 'static/data/all_week.geojson';

  d3.json(url).then(quakes => {

    layer.addData(quakes)

    /* L.geoJson(quakes, {
      pointToLayer: pointToLayer,
      onEachFeature: onEachFeature
    }) */

  })
}

const addFaults = (layer) => {

  const url = 'static/data/plates.geojson';

  d3.json(url).then(plates => {

    layer.addData(plates)

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

const createMagnitudeLegend = () => {

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

  return legend;
}

createMap()
