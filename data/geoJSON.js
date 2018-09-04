const DOMParser = require('xmldom').DOMParser;
const jsdom  = require('jsdom');
const $ = require('jquery')(new jsdom.JSDOM().window);
const _ = require('lodash');
const fs = require('fs');
const svgPath = require('svg-path-properties');

const SVGtoWKT = {
  PRECISION: 3,
  DENSITY: 1,
};

(function() {
  SVGtoWKT.convert = function(svg) {

    // Halt if svg is undefined or empty.
    if (_.isUndefined(svg) || _.isEmpty(svg.trim())) {
      throw new Error('Empty XML.');
    }

    var els = [];
    var xml;

    // svg = `
    //   <svg>
    //     <polygon points="1,2 3,4 5,6" />
    //     <line x1="7" y1="8" x2="9" y2="10" />
    //     <path d="M150 0 L75 200 L225 200 Z" />
    //   </svg>`;
    // Strip out tabs and linebreaks.
    svg = svg.replace(/\r\n|\r|\n|\t/g, '');

    try {
      // Parse the raw XML.
      xml = $($.parseXML(svg));
    } catch (e) {
      // Halt if malformed.
      console.log(e);
      throw new Error('Invalid XML.');
    }

    // Match `<polygon>` elements.
    xml.find('polygon').each(function(i, polygon) {
      els.push(SVGtoWKT.polygon($(polygon).attr('points')));
    });

    // Match `<polyline>` elements.
    xml.find('polyline').each(function(i, polyline) {
      els.push(SVGtoWKT.polyline($(polyline).attr('points')));
    });

    // Match `<line>` elements.
    xml.find('line').each(function(i, line) {
      els.push(SVGtoWKT.line(
        parseFloat($(line).attr('x1')),
        parseFloat($(line).attr('y1')),
        parseFloat($(line).attr('x2')),
        parseFloat($(line).attr('y2'))
      ));
    });

    // Match `<rect>` elements.
    xml.find('rect').each(function(i, rect) {
      els.push(SVGtoWKT.rect(
        parseFloat($(rect).attr('x')),
        parseFloat($(rect).attr('y')),
        parseFloat($(rect).attr('width')),
        parseFloat($(rect).attr('height'))
      ));
    });

    // Match `<circle>` elements.
    xml.find('circle').each(function(i, circle) {
      els.push(SVGtoWKT.circle(
        parseFloat($(circle).attr('cx')),
        parseFloat($(circle).attr('cy')),
        parseFloat($(circle).attr('r'))
      ));
    });

    // Match `<ellipse>` elements.
    xml.find('ellipse').each(function(i, circle) {
      els.push(SVGtoWKT.ellipse(
        parseFloat($(circle).attr('cx')),
        parseFloat($(circle).attr('cy')),
        parseFloat($(circle).attr('rx')),
        parseFloat($(circle).attr('ry'))
      ));
    });

    // Match `<path>` elements.
    xml.find('path').each(function(i, path) {
      els.push(SVGtoWKT.path($(path).attr('d')));
    });

    return 'GEOMETRYCOLLECTION(' + els.join(',') + ')';
  };

  /**
   * Construct a WKT line from SVG start/end point coordinates.
   */
  SVGtoWKT.line = function(x1, y1, x2, y2) {
    return 'LINESTRING('+x1+' '+-y1+','+x2+' '+-y2+')';
  };

  /**
   * Construct a WKT linestrimg from SVG `points` attribute value.
   */
  SVGtoWKT.polyline = function(points) {
    // "1,2 3,4 " => "1 2,3 4"
    var pts = _.map(points.trim().split(' '), function(pt) {
      pt = pt.split(','); pt[1] = -pt[1];
      return pt.join(' ');
    });

    return 'LINESTRING(' + pts.join() + ')';
  };

  /**
   * Construct a WKT polygon from SVG `points` attribute value.
   */
  SVGtoWKT.polygon = function(points) {
    // "1,2 3,4 " => "1 2,3 4"
    var pts = _.map(points.trim().split(' '), function(pt) {
      pt = pt.split(','); pt[1] = -pt[1];
      return pt.join(' ');
    });

    // Close.
    pts.push(pts[0]);

    return 'POLYGON((' + pts.join() + '))';
  };

  /**
   * Construct a WKT polygon from SVG rectangle origin and dimensions.
   */
  SVGtoWKT.rect = function(x, y, width, height) {
    var pts = [];

    // 0,0 origin by default.
    if (!_.isNumber(x)) x = 0;
    if (!_.isNumber(y)) y = 0;

    // No corner rounding.
    pts.push(String(x)+' '+String(-y));              // top left
    pts.push(String(x+width)+' '+String(-y));        // top right
    pts.push(String(x+width)+' '+String(-y-height)); // bottom right
    pts.push(String(x)+' '+String(-y-height));       // bottom left
    pts.push(String(x)+' '+String(-y));              // close

    // TODO: Corner rounding.
    return 'POLYGON((' + pts.join() + '))';
  };

  /**
   * Construct a WKT polygon for a circle from origin and radius.
   */
  SVGtoWKT.circle = function(cx, cy, r) {
    var wkt = 'POLYGON((';
    var pts = [];

    // Compute number of points.
    var circumference = Math.PI * 2 * r;
    var point_count = Math.round(circumference * SVGtoWKT.DENSITY);

    // Compute angle between points.
    var interval_angle = 360 / point_count;

    // Genrate the circle.
    _(point_count).times(function(i) {
      var angle = (interval_angle * i) * (Math.PI / 180);
      var x = __round(cx + r * Math.cos(angle));
      var y = __round(cy + r * Math.sin(angle));
      pts.push(String(x)+' '+String(-y));
    });

    // Close.
    pts.push(pts[0]);

    return wkt + pts.join() + '))';
  };

  /**
   * Construct a WKT polygon for an ellipse from origin and radii.
   */
  SVGtoWKT.ellipse = function(cx, cy, rx, ry) {
    var wkt = 'POLYGON((';
    var pts = [];

    // Approximate the circumference.
    var circumference = 2 * Math.PI * Math.sqrt(
      (Math.pow(rx, 2) + Math.pow(ry, 2)) / 2
    );

    // Compute number of points and angle between points.
    var point_count = Math.round(circumference * SVGtoWKT.DENSITY);
    var interval_angle = 360 / point_count;

    // Generate the ellipse.
    _(point_count).times(function(i) {
      var angle = (interval_angle * i) * (Math.PI / 180);
      var x = __round(cx + rx * Math.cos(angle));
      var y = __round(cy + ry * Math.sin(angle));
      pts.push(String(x)+' '+String(-y));
    });

    // Close.
    pts.push(pts[0]);

    return wkt + pts.join() + '))';
  };

  /**
   * Construct a WKT polygon from a SVG path string. Approach from:
   * http://whaticode.com/2012/02/01/converting-svg-paths-to-polygons/
   */
  SVGtoWKT.path = function(d) {

    // Try to extract polygon paths closed with 'Z'.
    var polys = _.map(d.trim().match(/[^z|Z]+[z|Z]/g), function(p) {
      return __pathElement(p.trim()+'z');
    });

    // If closed polygon paths exist, construct a `POLYGON`.
    if (!_.isEmpty(polys)) {

      var parts = [];
      _.each(polys, function(poly) {
        parts.push('(' + __pathPoints(poly, d, true).join() + ')');
      });

      return 'POLYGON(' + parts.join() + ')';

    }

    // Otherwise, construct a `LINESTRING` from the unclosed path.
    else {
      var line = __pathElement(d);
      return 'LINESTRING(' + __pathPoints(line, d).join() + ')';
    }

  };

  /**
   * Construct a SVG path element.
   */
  var __pathElement = function(d) {
    // const SVGNS = 'http://www.w3.org/2000/svg';
    // var path = dom.window.document.createElementNS(SVGNS, 'path');
    // path.setAttributeNS(null, 'd', d);

    const path = new DOMParser().parseFromString('<path />');
    path.documentElement.setAttributeNS(null, 'd', d);
    return path;
  };

  /**
   * Construct a SVG path element.
   */
  var __pathPoints = function(path, d, closed) {
    closed = closed || false;
    var pts = [];

    const properties = svgPath.svgPathProperties(d);
    // Get number of points.
    var length = properties.getTotalLength();
    var count = Math.round(length * SVGtoWKT.DENSITY);

    // Interpolate points.
    _(count + 1).times(function(i) {
      var point = properties.getPointAtLength((length * i) / count);
      pts.push(String(__round(point.x))+' '+String(__round(-point.y)));
    });

    // If requested, close the shape.
    if (closed) pts.push(pts[0]);

    return pts;
  };

  /**
   * Round a number to the number of decimal places in `PRECISION`.
   */
  var __round = function(val) {
    var root = Math.pow(10, SVGtoWKT.PRECISION);
    return Math.round(val * root) / root;
  };
}.call(this));

function seriesToRegions(data) {
  const series = JSON.parse(data);
  const regions = [];
  series.data.forEach(({ name, key, path }) => {
    let region = regions.find(item  => item.name === name);

    if (!region) {
      region = {
        name,
        path: []
      };
      regions.push(region);
    }

    if (key) {
      region.key = key;
    }

    region.path.push(path);
  });

  return regions;
}

function pathToGeometry(path) {
  const wkt = SVGtoWKT.convert(`<svg><path d="${path}" /></svg>`);

  let geometry = wkt.replace('GEOMETRYCOLLECTION(POLYGON((', '')
    .replace(/[()]/g, '');

  geometry = geometry.split(',')
    .map(function(pair, index) {
      const point = pair.split(' ');
      return [Math.round(point[0] * 10) / 10, Math.round(point[1] * 10) / 10];
    });

  return geometry;
}

function regionsToGeoJSON(regions) {
  const map = {
    title: REGION_NAME,
    version: '0.1',
    type: 'FeatureCollection',
    features: [],
  };

  regions.forEach((region, index) => {
    const id = `${COUNTRY_CODE}.${REGION_NAME.slice(0, 2).toUpperCase()}.${index}`;
    const hcKey = id.toLowerCase().split('.').join('-');
    const hcA2 = region.key || region.name.slice(0, 2).toUpperCase();
    const polygon = region.path.length > 1 ? 'MultiPolygon' : 'Polygon';
    const coordinates = [];

    region.path.forEach(path => {
      const geometry = pathToGeometry(path);
      coordinates.push(geometry);
    });

    const feature = {
      id,
      type: 'Feature',
      properties: {
        name: region.name,
        'hc-group': 'admin2',
        'hc-key': hcKey,
        'hc-a2': hcA2,
      },
      geometry: {
        type: polygon,
        coordinates: region.path.length > 1 ? [coordinates] : coordinates,
      },
    };

    map.features.push(feature);
  });

  return map;
}

const PARENT_ID = '6325';
const COUNTRY_CODE = 'DK';
const REGION_NAME = 'Hovedstaden';

fs.readFile('./data/tmp/dataSeries.json', 'utf8', function(err, data) {
  if(err) {
    return console.log(err);
  }

  const regions = seriesToRegions(data);
  const geoJson = regionsToGeoJSON(regions);
  const dir = COUNTRY_CODE.toLowerCase();
  const file = `${dir}-${REGION_NAME}-all`
  const mapKey = `countries/${dir}/${dir}-${PARENT_ID}-all`;
  const map = `Highcharts.maps['${mapKey}'] = ${JSON.stringify(geoJson)}`;

  fs.writeFile(`./data/${dir}/${file}.js`, map,
  function(errr) {
    if(errr) {
      return console.log(errr);
    }

    console.log("::: GeoJSON saved! :::");
  });
});
