window.CLOSURE_NO_DEPS = true;
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.TileJSON');
goog.require('ol.source.XYZ');

var maps = (function () {
    //var swipe = $('#swipe');
    var settings = {};
    var mapControls = function (optOptions) {
        var options = optOptions || {},
            element = $('<select>').addClass('ol-unselectable'),
            n = 0;

        if (options.alignment === 'left') {
            element.addClass('ol-align-left');
        } else if (options.alignment === 'right') {
            element.addClass('ol-align-right');
        }

        _.forEach(options.mapInfo.layers, function (layer) {
            var option = $('<option>').html(layer.name);
            if (n === options.index) {
                option.attr('selected', 'true');
            }
            element.append(option);
            n += 1;
        });

        var _this = this;
        var handleViewLayer = function (e) {
            // prevent #rotate-north anchor from getting appended to the url
            e.preventDefault();
            var map = _this.getMap();
            var layers = map.getLayers();
            var pixelProj = new ol.proj.Projection({
                code: 'pixel',
                units: 'pixels',
                extent: options.mapInfo.extent
            });
            var layerInfo = options.mapInfo.layers[e.target.selectedOptions[0].index];
            var newLayer = new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: layerInfo.url,
                    wrapX: false,
                    projection: pixelProj
                }),
                preload: 6
            });
            newLayer.set('title', layerInfo.name);

            layers.setAt(options.index, newLayer);
            console.log('map.getLayers(): ', map.getLayers()); //DEBUG: Anders Sjöberg 2015-01-23 00:00

            map.getLayers().item(1).on('precompose', function (event) {
                var context = event.context;
                var sliderValue = $('#slider').slider('option', 'value');

                var width = context.canvas.width * (sliderValue / 100);

                context.save();
                context.beginPath();
                context.rect(width, 0, context.canvas.width - width, context.canvas.height);
                context.clip();
            });

            map.getLayers().item(1).on('postcompose', function (event) {
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

    var showMap = function (mapInfo) {
        var pixelProj = new ol.proj.Projection({
                code: 'pixel',
                units: 'pixels',
                extent: mapInfo.extent
            }),
            layers = [];

        _.forOwn(mapInfo.layers, function (layer) {
            var newLayer = new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: layer.url,
                    wrapX: false,
                    projection: pixelProj
                }),
                preload: 6
            });
            newLayer.set('title', layer.name);
            layers.push(
                newLayer
            );
        });
        console.log('mapInfo: ', mapInfo); //DEBUG: Anders Sjöberg 2015-01-29 00:00

        var view = new ol.View({
                center: [mapInfo.extent[2] / 2, -mapInfo.extent[3] / 2],
                zoom: 4,
                minZoom: 1,
                maxZoom: 8,
                projection: pixelProj
            }),

            map = new ol.Map({
                layers: [layers[0], layers[1]],
                target: 'map',
                units: 'm',
                view: view,
                renderer: 'canvas',
                controls: [
                    new ol.control.Zoom(),
                    new ol.control.ZoomToExtent(),
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

        map.getLayers().item(1).on('precompose', function (event) {
            var context = event.context;
            var sliderValue = $('#slider').slider('option', 'value');
            var width = context.canvas.width * (sliderValue / 100);
            context.save();
            context.beginPath();
            context.rect(width, 0, context.canvas.width - width, context.canvas.height);
            context.clip();
        });

        map.getLayers().item(1).on('postcompose', function (event) {
            var context = event.context;
            context.restore();
        });

        var test = function (event, ui) {
            map.render();
        };

        $('#slider').slider({
            slide: test,
            min: 0,
            max: 100,
            value: 50
        });
    };

    var mapChanged = function (event) {
        console.log('event', event);
        var mapName = event.target.selectedOptions[0].value;
        console.log('event.target.selectedOptions[0].value: ', mapName); //DEBUG: Anders Sjöberg 2015-01-29 00:00
        event.preventDefault();
        $('#map').html('');
        var theMapInfo = settings[mapName];
        showMap(theMapInfo);
        _.forEach(theMapInfo.layers, function (layerInfo) {
            $('#selLayer1').append($('<option/>').attr('value', layerInfo.name).html(layerInfo.name));
        });
        _.forEach(theMapInfo.layers, function (layerInfo) {
            $('#selLayer2').append($('<option/>').attr('value', layerInfo.name).html(layerInfo.name));
        });
    };

    var init = function (data) {
        settings = data;
        _.forOwn(data, function (item, key) {
            $('#selMap').append($('<option/>').attr('value', key).html(item.title));
        });
        $('#selMap').on('change', mapChanged);
    };

    return {
        show: showMap,
        init: init,
        settings: settings
    };
}());

$(function () {
    'use strict';
    $.getJSON('settings.js', function (data) {
            maps.init(data);
            maps.show(data.sälen);
        })
        .fail(function (err) {
            console.log('FAIL!', err);
        });
});