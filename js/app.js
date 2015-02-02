window.CLOSURE_NO_DEPS = true;
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.TileJSON');
goog.require('ol.source.XYZ');

//Funktioner för kartan.
var maps = (function() {
  'use strict';
  var settings = {};
  //Skapa en pixel projektion som används av openlayers.
  var getProjection = function(extent) {
    return new ol.proj.Projection({
      code: 'pixel',
      units: 'pixels',
      extent: extent
    });
  };

  //Lägger till kontroller för zoom, lager-val m.m.
  var mapControls = function(optOptions) {
    var options = optOptions || {},
      element = $('<select>').addClass('ol-unselectable'),
      n = 0;

    if (options.alignment === 'left') {
      element.addClass('ol-align-left');
    } else if (options.alignment === 'right') {
      element.addClass('ol-align-right');
    }

    _.forEach(options.mapInfo.layers, function(layer) {
      var option = $('<option>').html(layer.name);
      if (n === options.index) {
        option.attr('selected', 'true');
      }
      element.append(option);
      n += 1;
    });

    var _this = this; //Kom ihåg this för användning i funktionen nedan, JavaScript har en annan def. av this än C#
    var handleViewLayer = function(e) {
      e.preventDefault();
      var map = _this.getMap();
      var layers = map.getLayers();
      var selectedName = $(this).val();
      var layerInfo = _.find(options.mapInfo.layers, function(lr) {
        return lr.name === selectedName;
      });
      //Skapa ett nytt lager för vald vy.
      var newLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({
          url: layerInfo.url,
          wrapX: false,
          projection: getProjection(options.mapInfo.extent)
        }),
        preload: 6
      });
      newLayer.set('title', layerInfo.name);
      layers.setAt(options.index, newLayer);
      //Ser till att lager 2 visas på högra sidan.
      map.getLayers().item(1).on('precompose', function(event) {
        var context = event.context;
        var sliderValue = $('#slider').slider('option', 'value');

        var width = context.canvas.width * (sliderValue / 100);

        context.save();
        context.beginPath();
        context.rect(width, 0, context.canvas.width - width, context.canvas.height);
        context.clip();
      });
      map.getLayers().item(1).on('postcompose', function(event) {
        var context = event.context;
        context.restore();
      });
      map.render();
    };

    element.on('change', handleViewLayer);

    ol.control.Control.call(this, {
      element: element[0],
      target: options.target
    });
  };
  ol.inherits(mapControls, ol.control.Control);

  var showMap = function(mapInfo) {
    var progress = $('#progress');
    var pixelProj = getProjection(mapInfo.extent),
      layers = [];
    $('#selMap').val(mapInfo.name);
    _.forOwn(mapInfo.layers, function(layer) {
      var newLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({
          url: layer.url,
          wrapX: false,
          projection: pixelProj
        })
      });

      newLayer.getSource().setTileLoadFunction((function() {
        var numLoadingTiles = 0;
        var tileLoadFn = newLayer.getSource().getTileLoadFunction();
        return function(tile, src) {
          if (numLoadingTiles === 0) {
            progress.show();
          }
          ++numLoadingTiles;
          var image = tile.getImage();
          image.onload = image.onerror = function() {
            --numLoadingTiles;
            if (numLoadingTiles === 0) {
              progress.hide();
            }
          };
          tileLoadFn(tile, src);
        };
      })());

      newLayer.set('title', layer.name);
      layers.push(
        newLayer
      );
    });

    //---------- DEBUG -------------
    var vectorSource = new ol.source.Vector({
      //create empty vector
    });

    var iconFeature = new ol.Feature({
      geometry: new ol.geom.Point([mapInfo.extent[0], mapInfo.extent[1]]),
      name: 'Ena hörnet'
    });
    vectorSource.addFeature(iconFeature);

    iconFeature = new ol.Feature({
      geometry: new ol.geom.Point([mapInfo.extent[2], mapInfo.extent[3]]),
      name: 'Andra hörnet'
    });
    vectorSource.addFeature(iconFeature);

    var iconStyle1 = new ol.style.Style({
      image: new ol.style.Icon( /** @type {olx.style.IconOptions} */ ({
        anchor: [0, 0],
        scale: 0.2,
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        opacity: 1,
        src: 'images/Blue-map-pin.png'
      }))
    });


    var vectorLayer = new ol.layer.Vector({
      source: vectorSource,
      style: iconStyle1
    });
    //---------- DEBUG -------------

    var view = new ol.View({
        center: [mapInfo.extent[2] / 2, -mapInfo.extent[3] / 2],
        zoom: 4,
        minZoom: 1,
        maxZoom: mapInfo.maxZoom,
        projection: pixelProj
      }),

      map = new ol.Map({
        //TODO: vectorLayer är för felsökning! Ta bort vid prodsättning!
        layers: [layers[0], layers[1]], //layers: [layers[0], layers[1], vectorLayer], //Visa debuglager
        target: 'map',
        units: 'm',
        view: view,
        renderer: 'canvas',
        controls: [
          new ol.control.Zoom(),
          new ol.control.ZoomToExtent({
            extent: [0, 0, 10000, 10000]
          }),
          new mapControls({
            index: 0,
            mapInfo: mapInfo,
            alignment: 'left'
          }),
          new mapControls({
            index: 1,
            mapInfo: mapInfo,
            alignment: 'right'
          })
        ]
      });
    map.on('moveend', function() {
      var size = map.getView().calculateExtent(map.getSize());
      console.log('size: ', size); //DEBUG: Anders Sjöberg 2015-01-30 00:00
    });

    map.getLayers().item(1).on('precompose', function(event) {
      var context = event.context;
      var sliderValue = $('#slider').slider('option', 'value');
      var width = context.canvas.width * (sliderValue / 100);
      context.save();
      context.beginPath();
      context.rect(width, 0, context.canvas.width - width, context.canvas.height);
      context.clip();
    });

    map.getLayers().item(1).on('postcompose', function(event) {
      var context = event.context;
      context.restore();
    });

    var test = function(event, ui) {
      map.render();
    };

    $('#slider').slider({
      slide: test,
      min: 0,
      max: 100,
      value: 50
    });
  };

  //Körs när man byter karta
  var mapChanged = function(event) {
    var mapName = $(this).val();
    event.preventDefault();
    $('#map').html('');
    var theMapInfo = _.find(settings, function(mapinfo){return mapName===mapinfo.name;});
    showMap(theMapInfo);
    _.forEach(theMapInfo.layers, function(layerInfo) {
      $('#selLayer1').append($('<option/>').attr('value', layerInfo.name).html(layerInfo.name));
    });
    _.forEach(theMapInfo.layers, function(layerInfo) {
      $('#selLayer2').append($('<option/>').attr('value', layerInfo.name).html(layerInfo.name));
    });
    document.title = theMapInfo.title;
    //Uppdatera urlen när man byter karta så att man kan kopiera länken
    window.location.search = $.query.set('map', mapName);
  };

  var init = function(data) {
    settings = data;
    //gå igenom och fyll dropdown för område.
    _.forEach(data, function(item) {
      $('#selMap').append($('<option/>').attr('value', item.name).html(item.title));
    });
    $('#selMap').on('change', mapChanged);
  };

  return {
    show: showMap,
    init: init,
    settings: settings
  };
}());

$(function() {
  'use strict';
  //Sätter storleken på omslutande div så att kartan fyller resten av fönstret.
  var setSize = function() {
      //$('#log').append('<div>Handler for .resize() called.</div>');
      var canvasheight = $('#map').parent().css('height');
      var canvaswidth = $('#map').parent().css('width');
      $('#map').css('height', canvasheight);
      $('#map').css('width', canvaswidth);
    },
    settingsFileName = 'settings.json';

  setSize();
  //Justera storleken på kartan när browser fönstret ändrar storlek
  $(window).resize(setSize);

  var urlMap = $.query.get('map');

  //Hämta inställningsfilen.
  $.getJSON(settingsFileName, function(data) {
      maps.init(data);
      var mapInfo;
      //Visa url specifierad karta eller första kartan från settings filen när sidan laddas första gången.
      if (!urlMap) {
        mapInfo = data[0];
      } else {
        mapInfo = _.find(data, function(info) {
          return info.name === urlMap;
        });
      }
      console.log('mapInfo', mapInfo);
      maps.show(mapInfo); 
    })
    .fail(function(err) {
      console.log('Kunde inte ladda settings.json!', err);
    });
});
