(function() {
  var COLORS = [
    '#DAF8F8',
    '#15D6D8',
    '#012223',
  ];

  var WORLD = 'custom/world-highres.js';
  var REGIONS = [];
  var LOCATION = {};
  var drilldownMessageExist = true;

  function loadLocation() {
    var location = JSON.parse(localStorage.getItem('geoLocation'));
    if (location && location.src) {
      LOCATION = location;
    } else {
      LOCATION = {
        country: '',
        region: '',
        src: WORLD,
      };
    }
  }

  function saveLocation() {
    localStorage.setItem('geoLocation', JSON.stringify(LOCATION));
    initLocation();
  }

  function getDataByCountry(countryCode) {
    var countries = window.geoCompliance.data.countries; // FIXME

    return countries.find(function(item) { return item.countryCode === countryCode; });
  }

  $.each(Highcharts.mapDataIndex, function(group, maps) {
    $.each(maps, function(name, src) {
      REGIONS.push({
        name: name,
        src: src,
      });
    });
  });

  function numberGroup(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  initLocation();
  function initLocation() {
    loadLocation();
    var mapKey = LOCATION.src.slice(0, -3);

    if (Highcharts.charts[0]) {
      Highcharts.charts[0].showLoading('<i>LOADING...</i>');
    }

    // When the map is loaded or ready from cache...
    function mapReady() {
      var mapGeoJSON = Highcharts.maps[mapKey];
      var data = [];

      $.each(mapGeoJSON.features, function (index, feature) {
        var key = feature.properties['hc-key'];
        if (key) {
          var value = 0;

          if (feature.properties['hc-group'] === 'admin0') { // World
            drilldownMessageExist = true;

            var country = getDataByCountry(feature.id);
            value = country && country.events;
          }

          if (feature.properties['hc-group'] === 'admin1') { // Country
            drilldownMessageExist = true;

            var country = getDataByCountry(feature.id.split('.')[0]);
            var region = country && country.regions.find(function(item) { return item.name === feature.properties['name']; });
            value = region && region.events;
          }

          if (feature.properties['hc-group'] === 'admin2') { // Region
            $('#geoMessage').addClass('fade-out-me');
            drilldownMessageExist = false;

            var country = getDataByCountry(feature.id.split('.')[0]);
            var region = country && country.regions.find(function(item) { return item.name === LOCATION.region; });
            var subRegion = region && region.subRegions.find(function(item) { return item.name ===  feature.properties['name']; });
            value = subRegion && subRegion.events;
          }

          data.push({
            id: key.toUpperCase(),
            key: key,
            value: value || 0
          });
        }
      });

      $('#geoUp').html('');
      $('#geoTitle').html('');
      if (LOCATION.country || LOCATION.region) {
        $('#geoUp').append(
          $('<a><< Back</a>')
            // .attr({ title: heir.src })
            .click(function () {
              LOCATION.country = LOCATION.region ? LOCATION.country : '';
              LOCATION.region = '';
              LOCATION.src = LOCATION.country ? REGIONS.find(function(item) { return item.name === LOCATION.country; }).src : WORLD;
              saveLocation();
            })
        );

        $('#geoTitle').append(LOCATION.country + (LOCATION.region ? ' \\ ' + LOCATION.region : ''));
      }

      function getMaxValue() {
        return Math.max.apply(null, data.map(function(item) { return item.value; })) || 1;
      }
      // var minRange = 500;

      $('#geoMap').highcharts('Map', {
        chart: {
          events: {
            load: function () {
              var target = 'UA'; // FIXME
              var country = $('#geoMap').highcharts().get(target);
              if (country) {
                country.zoomTo();
              }
            }
          }
        },
        credits: {
          enabled: false
        },
        tooltip: {
          formatter: function(e) {
            return '<b>' + this.point.name + '</b><br>' +
              this.series.name + ': <b>' + numberGroup(this.point.value) + '</b>';
          }
        },
        title: {
          text: null,
        },
        mapNavigation: {
          enabled: true,
        },
        xAxis: {
          // minRange: minRange,
          events: {
            afterSetExtremes: function (e) {
              if (drilldownMessageExist) {
                $('#geoMessage').removeClass('fade-out-me');
              } else {
                $('#geoMessage').addClass('fade-out-me');
              }
            }
          }
        },
        colorAxis: {
          min: 0,
          max: getMaxValue(),
          stops: [
            [0, COLORS[0]],
            [0.01, COLORS[1]],
            [0.5, COLORS[1]],
            [0.7, COLORS[1]],
            [1, COLORS[2]]
          ]
        },
        legend: {
          layout: 'vertical',
          align: 'left',
          verticalAlign: 'bottom'
        },
        series: [{
          data: data,
          mapData: mapGeoJSON,
          joinBy: ['hc-key', 'key'],
          name: 'Impressions',
          dataLabels: {
            enabled: true,
            formatter: function () {
              return mapKey === 'custom/world-highres' || mapKey === 'countries/us/us-all' ?
                '' : this.point.name;
            }
          },
          point: {
            events: {
              // On click, look for a detailed map
              click: function () {
                var key = this.key;
                var name = this.name;
                console.log(name, ':', key);
                REGIONS.forEach(function(region) {
                  if ((region.src === 'countries/' + key.substr(0, 2) + '/' + key + '-all.js') ||
                      (region.src === 'countries/' + key.substr(0, 2) + '/custom/' + key.substr(0, 2) + '-countries.js')) {
                    if (key.length === 2) {
                      LOCATION.country = name;
                    } else {
                      LOCATION.region = name;
                    }
                    LOCATION.src = region.src;
                    saveLocation();
                    return true;
                  }
                });
              }
            }
          }
        }]
      });
    }

    // Check whether the map is already loaded, else load it and then show it async
    if (Highcharts.maps[mapKey]) {
      mapReady();
    } else {
      var mapPathHC = 'https://code.highcharts.com/mapdata/';
      var mapPathAR = 'http://localhost:3000/'; // TODO: node server/server.js
      var scriptPath = '';

      const arSources = [
        'dk',
        'fi',
        'gb',
        'se',
        'ua',
        'vn',
        'vn-all',
      ];

      var mapLevel1 = mapKey.match(/^(countries\/[a-z]{2}\/[a-z]{2})-all$/);
      var mapLevel2 = mapKey.match(/^(countries\/[a-z]{2}\/[a-z]{2})-[a-z0-9]+-all$/);
      var admin1 = mapLevel1 && mapLevel1[0].split('/')[2];
      var admin2 = mapLevel2 && mapLevel2[0].split('/')[2];

      if (admin1 && arSources.indexOf(admin1) > -1) {
        var code = admin1.split('-')[0];
        scriptPath = mapPathAR + code + '/' + code + '-all.js';
      } else if (admin2 && arSources.indexOf(admin2.split('-')[0]) > -1) {
        var code = admin2.split('-')[0];
        scriptPath = mapPathAR + code + '/' + code + '-admin2-all.js';
      } else {
        scriptPath = mapPathHC + mapKey + '.js';
      }

      $.getScript(scriptPath, mapReady);
    }
  }

})();
