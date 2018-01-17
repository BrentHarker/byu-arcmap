var map,
  view,
  layerList,
  legend;
var featureLayerIDSet = [];

function initialize() {
  //load the basemap
  //change test
  require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/widgets/Search",
    "esri/widgets/Home",
    "dojo/domReady!"
  ], function(Map, MapView, FeatureLayer, Search, Home) {
    map = new Map({
      //  Unable to find basemap definition for: dark-grays. Try one of these: "streets", "satellite", "hybrid", "terrain", "topo", "gray", "dark-gray", "oceans", "national-geographic", "osm", "dark-gray-vector", "gray-vector", "streets-vector", "topo-vector", "streets-night-vector", "streets-relief-vector", "streets-navigation-vector"
      basemap: "topo"
    });
    view = new MapView({
      container: "viewDiv",
      map: map,
      center: [
        -111.649278, 40.249251
      ],
      zoom: 16
    });
    view.then(function() {
      toggleBuildings();

      var template = {
        title: "{Name}",
        content: "{Description}",
        overwriteActions: true
      };
      var searchWidget = new Search({
        view: view,
        allPlaceholder: "Enter Name or Acronym",
        sources: [
          {
            featureLayer: new FeatureLayer({url: "https://services.arcgis.com/FvF9MZKp3JWPrSkg/arcgis/rest/services/Buildings_Edited/FeatureServer/0", popupTemplate: template}),
            searchFields: [
              "Name", "BLDG_ABBR"
            ],
            suggestionTemplate: "{Name} ({BLDG_ABBR})",
            displayField: "Name",
            exactMatch: false,
            outFields: [
              "Name", "BLDG_ABBR", "Description"
            ],
            name: "Buildings",
            placeholder: "example: JSB"
          }, {
            featureLayer: new FeatureLayer({url: "https://services.arcgis.com/FvF9MZKp3JWPrSkg/arcgis/rest/services/Athletics/FeatureServer/0", popupTemplate: template}),
            searchFields: [
              "Name", "BLDG_ABBR"
            ],
            suggestionTemplate: "{Name}",
            exactMatch: false,
            outFields: ["*"],
            name: "Sports",
            placeholder: "example: Marriott Center"
          }, {
            featureLayer: new FeatureLayer({url: "https://services.arcgis.com/FvF9MZKp3JWPrSkg/arcgis/rest/services/Services/FeatureServer/0", popupTemplate: template}),
            searchFields: ["Name"],
            suggestionTemplate: "{Name}",
            exactMatch: false,
            outFields: ["*"],
            name: "Services",
            placeholder: "example: Admissions"
          }, {
            featureLayer: new FeatureLayer({url: "https://services.arcgis.com/FvF9MZKp3JWPrSkg/arcgis/rest/services/StudentServices/FeatureServer/0", popupTemplate: template}),
            searchFields: ["Name"],
            suggestionTemplate: "{Name}",
            exactMatch: false,
            outFields: ["*"],
            name: "Student Services",
            placeholder: "example: Title IX"
          }, {
            featureLayer: new FeatureLayer({url: "https://services.arcgis.com/FvF9MZKp3JWPrSkg/arcgis/rest/services/Entertainment_Museums/FeatureServer/0", popupTemplate: template}),
            searchFields: ["Name"],
            suggestionTemplate: "{Name}",
            exactMatch: false,
            outFields: ["*"],
            name: "Entertainment and Museums",
            placeholder: "example: Planetarium"
          }
        ]
      });

      view.ui.add(searchWidget, {
        position: "top-left",
        index: 2
      });
      view.ui.move("zoom", "top-left");
      var homeWidget = new Home({view: view});
      view.ui.add(homeWidget, "top-left");
      view.popup.dockEnabled = false;
      searchWidget.then(function() {}, function(error) {
        console.log('search failed', error);
      });

    }, function(error) {
      // Use the errback function to handle when the view doesn't load properly
      console.log('The view\'s resources failed to load: ', error);
    });
  });
}

function toggleLayers(id) {
  var id = id;
  if (map.findLayerById(featureLayerIDSet[0])) {
    removeLayers();
  }
  require([
    "esri/layers/FeatureLayer", "esri/tasks/support/Query", "dojo/domReady!"
  ], function(FeatureLayer, Query) {
    //load ParkingLayers
    var template = {
      title: "{Name}",
      content: [
        {
          type: "text",
          text: "<img src='{ImageUrl}'><div class='popupText'>{Description}</div>   <a target='_blank' href={url}>{url}</a>"
        }
      ]

    };
    var featureLayer = new FeatureLayer({
      url: "https://services.arcgis.com/FvF9MZKp3JWPrSkg/arcgis/rest/services/" + id + "/FeatureServer/0",
      //outFields: ["Name", "Description", "BLDG_ABBR", "BLDG_NAME"],
      outFields: ["*"],
      definitionExpression: "Name != ''",
      popupTemplate: template
    });
    map.add(featureLayer);
    featureLayer.then(function() {
      if (featureLayer.capabilities.queryRelated.supportsOrderBy) {
        console.log("order supported");
        //console.log(featureLayer);
      } else {
        console.log("order NOT supported");
      }
    });

    featureLayerIDSet.push(featureLayer.id);
    var graphics;
    var listNode = document.getElementById("listNode");
    view.whenLayerView(featureLayer).then(function(lyrView) {
      lyrView.watch("updating", function(val) {
        if (!val) { // wait for the layer view to finish updating
          //console.log(lyrView);
          //var queryParams = featureLayer.createQuery();
          //queryParams.orderByFields = (featureLayer.title == "BYUBuildings" || featureLayer.title == "Athletics") ? ["BLDG_NAME"] : ["Name"];
          // query all the features available for drawing.
          lyrView.queryFeatures().then(function(results) {
            //console.log(results);
            results.sort(function(a, b) {
              if (a.attributes.BLDG_NAME > b.attributes.BLDG_NAME) {
                return 1;
              } else if (a.attributes.BLDG_NAME < b.attributes.BLDG_NAME) {
                return -1;
              } else {
                return 0;
              }
            });
            graphics = results;
            //document.getElementsByClassName("panel-side")[0].style.zIndex = "1";
            var fragment = document.createDocumentFragment();

            results.forEach(function(result, index) {
              var attributes = result.attributes;
              var name;
              if (attributes.BLDG_ABBR != null) {
                name = attributes.Name + " (" + attributes.BLDG_ABBR + ")";
              } else {
                name = attributes.Name;
              }
              var Description = attributes.Description;

              // Create a list zip codes in NY
              var li = document.createElement("li");
              li.classList.add("panel-result");
              li.tabIndex = 0;
              li.setAttribute("data-result-id", index);
              li.textContent = name;
              fragment.appendChild(li);
            });
            // Empty the current list
            listNode.innerHTML = "";
            listNode.appendChild(fragment);
          }, function(error) {
            console.log("something query messed up", error);
          });
        }
      });
    });
    listNode.addEventListener("click", onListClickHandler);

    function onListClickHandler(event) {
      var target = event.target;
      var resultId = target.getAttribute("data-result-id");

      // get the graphic corresponding to the clicked zip code
      var result = resultId && graphics && graphics[parseInt(resultId, 10)];

      if (result) {
        var centerPoint = (featureLayer.title == "Buildings Edited" || featureLayer.title == "Athletics")
          ? result.geometry.centroid
          : {
            latitude: result.geometry.latitude,
            longitude: result.geometry.longitude
          };
        // open the popup at the centroid of zip code polygon
        // and set the popup's features which will populate popup content and title.
        view.popup.open({features: [result], location: centerPoint});
      }
    }
  });
}

function toggleLegendLayers(id) {
  var id = id;
  if (map.findLayerById(featureLayerIDSet[0])) {
    removeLayers();
  }
  require([
    "esri/layers/FeatureLayer", "esri/widgets/Legend", "dojo/domReady"
  ], function(FeatureLayer, Legend) {
    var template = {
      title: "{Name}",
      content: "{Description} {StopLocati}"
    };
    var featureLayer;
    if (id === "AccessibilityRoutes") {
      featureLayer = new FeatureLayer({
        url: "https://services.arcgis.com/FvF9MZKp3JWPrSkg/arcgis/rest/services/" + id + "/FeatureServer/0"
      });
    } else {
      featureLayer = new FeatureLayer({
        url: "https://services.arcgis.com/FvF9MZKp3JWPrSkg/arcgis/rest/services/" + id + "/FeatureServer/0",
        outFields: ["*"],
        popupTemplate: template
      });
    }
    map.add(featureLayer);

    featureLayer.then(function() {
      featureLayerIDSet.push(featureLayer.id);
      console.log(featureLayer);
      legend = new Legend({
        view: view,
        layerInfos: [
          {
            layer: featureLayer
          }
        ]
      });
      view.ui.add(legend, "bottom-left");
    });
  });

}

function toggleBuildings() {
  if (map.findLayerById(featureLayerIDSet[0])) {
    removeLayers();
  }
  require([
    "esri/layers/FeatureLayer", "dojo/domReady!"
  ], function(FeatureLayer) {
    //load ParkingLayers
    var template = {
      title: "{Name}",
      content: "{Description}"
    };
    var featureLayer = new FeatureLayer({
      url: "https://services.arcgis.com/FvF9MZKp3JWPrSkg/arcgis/rest/services/Buildings_Edited/FeatureServer/0",
      outFields: [
        "Name", "Description"
      ],
      popupTemplate: template,
      opacity: 0
    });
    //console.log(featureLayer.outfields);
    map.add(featureLayer);
    // console.log(featureLayer.layerId);
    featureLayerIDSet.push(featureLayer.id);
  });
}

function toggleParkingLots() {
  if (map.findLayerById(featureLayerIDSet[0])) {
    removeLayers();
  }
  require([
    "esri/layers/FeatureLayer", "esri/widgets/LayerList", "dojo/query", "dojo/domReady!"
  ], function(FeatureLayer, LayerList, query) {
    //load ParkingLayers
    var template = {
      title: "{Lot}",
      content: "{Description}"
    };
    var parkingLotsArrayNames = [
      "MotorcycleParking",
      "Students",
      "RestrictedVisitor",
      "Construction",
      "StudentHousing",
      "FreeParking",
      "VisitorParking",
      "TimedParking",
      "GraduateStudents",
      "FacultyandStaff"
    ];
    var featureLayerArray = [];
    for (var i = 0; i < 10; i++) {
      featureLayerArray[i] = new FeatureLayer({
        url: "https://services.arcgis.com/FvF9MZKp3JWPrSkg/arcgis/rest/services/" + parkingLotsArrayNames[i] + "/FeatureServer/0",
        outFields: [
          "Lot", "Description", "Map_Category"
        ],
        popupTemplate: template
      });
      //console.log(featureLayer.title);
      map.add(featureLayerArray[i]);
      featureLayerIDSet.push(featureLayerArray[i].id);
    }
    layerList = new LayerList({
      view: view,
      // executes for each ListItem in the LayerList
      listItemCreatedFunction: function(event) {
        //console.log(event);
        var item = event.item;
        setTimeout(function() {
          //var item = event.item;
          var itemUid = layerList.id + "_" + item.uid + "__title";
          var node = query("[aria-labelledby=\"" + itemUid + "\"]")[0];
          if (node && node.children[0] && item.layer.renderer && item.layer.renderer.symbol) {
            node.children[0].style.backgroundColor = item.layer.renderer.symbol.color;

            if (item.title === "FacultyandStaff") {
              item.title = "Faculty and Staff";
            } else if (item.title === "FreeParking") {
              item.title = "Free Parking";
            } else if (item.title === "MotorcycleParking") {
              item.title = "Motorcycle Parking";
            } else if (item.title === "RestrictedVisitor") {
              item.title = "Restricted Visitor";
            } else if (item.title === "StudentHousing") {
              item.title = "Student Housing";
            } else if (item.title === "TimedParking") {
              item.title = "Timed Parking";
            } else if (item.title === "VisitorParking") {
              item.title = "Visitor Parking";
            } else if (item.title === "GraduateStudents") {
              item.title = "Graduate Students";
            } else if (item.title === "Students") {
              node.children[0].children[0].children[1].style.color = "unset";
            }
          }
        }, 50);

      }
    });

    view.ui.add(layerList, {position: "bottom-left"});
  });
}

function toggleAEDs() {
  removeLayers();
  require([
    "esri/layers/FeatureLayer",
    "esri/request",
    "esri/geometry/Point",
    "esri/widgets/Legend",
    "esri/config",
    "dojo/domReady!"
  ], function(FeatureLayer, esriRequest, Point, Legend, esriConfig) {
    var aedurl = "https://risk.byu.edu/ws/aedfeed.php";
    esriConfig.request.corsEnabledServers.push("https://risk.byu.edu/");
    getData().then(createGraphics). // then send it to the createGraphics() method
    then(createLayer). // when graphics are created, create the layer
    otherwise(errback);
    //attempt to access the aedlive feed. if not, return the local aedfeed.json
    function getData() {
      return esriRequest(aedurl).then(function(response) {
        //console.log(response);
        return response;
      }).otherwise(function(error) {
        console.log('request failed, grabbing local feed');
        return esriRequest("scripts/aedfeed.json", {responseType: "json"});
      });
    }
    function createGraphics(response) {
      // raw GeoJSON data
      var geoJson = response.data;
      // Create an array of Graphics from each GeoJSON feature
      return geoJson.features.map(function(feature, i) {
        return {
          geometry: new Point({x: feature.geometry.coordinates[0], y: feature.geometry.coordinates[1]}),
          // select only the attributes you care about
          attributes: {
            ObjectID: i,
            building: feature.properties.building,
            room: feature.properties.room,
            location: feature.properties.location,
            picture: feature.properties.picture
          }
        };
      });
    }
    function createLayer(graphics) {

      var fields = [
        {
          name: "ObjectID",
          alias: "ObjectID",
          type: "oid"
        }, {
          name: "building",
          alias: "building",
          type: "string"
        }, {
          name: "room",
          alias: "room",
          type: "string"
        }, {
          name: "location",
          alias: "location",
          type: "string"
        }, {
          name: "picture",
          alias: "picture",
          type: "string"
        }
      ];
      var template = {
        title: "AED #{ObjectID}",
        content: "<img src='{picture}' height='320' width='240'/><div class='popupText'>{building} room {room}  {location} </div>"
      };
      featureLayer = new FeatureLayer({
        source: graphics, // autocast as an array of esri/Graphic
        // create an instance of esri/layers/support/Field for each field object
        fields: fields, // This is required when creating a layer from Graphics
        objectIdField: "ObjectID", // This must be defined when creating a layer from Graphics
        renderer: {
          type: "simple", // autocasts as new SimpleRenderer()
          symbol: {
            type: "picture-marker", // autocasts as new SimpleMarkerSymbol()
            url: "aed.png",
            width: "30px",
            height: "56px"
          }
        },
        spatialReference: {
          wkid: 4326
        },
        popupTemplate: template,
        geometryType: "point", // Must be set when creating a layer from Graphics
      });

      map.add(featureLayer);
      featureLayerIDSet.push(featureLayer.id);
      return featureLayer;
    }
    function createLegend(layer) {}
    function errback(error) {
      console.error("Creating failed. ", error);
    }
  });
}

function removeLayers() {
  console.log("removing layers");
  document.getElementById("listNode").innerHTML = "";
  view.popup.close();
  //document.getElementsByClassName("panel-side")[0].style.zIndex = "-1";
  if (layerList != null) {
    layerList.destroy();
    layerList = null;
  }
  if (legend != null) {
    legend.destroy();
    legend = null;
  }
  map.removeAll();
  featureLayerIDSet = [];
  // map.removeMany(featureLayerIDSet);
  // for(i=0; i<featureLayerIDSet.length; i++){
  //   map.remove(featureLayerIDSet[i]);
  // }
}
