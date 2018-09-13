(function() {
  var REGIONS = [];
  var REPLACE = {
    'countries/gb/gb': 'countries/gb/custom/gb-countries',
  };

  var COLORS = [
    '#17D6D8',
    '#13ABAC',
    '#0E7F81',
    '#145D5D',
    '#9EE010',
    '#7EB30D',
    '#5E860A',
    '#3F5906',
    '#FFAA00',
    '#4f5a5a',
    '#8a9c9c',
    '#FEFEFE',
  ];

  function getDataByCountry(countryCode) {
    var countries = window.geoCompliance.data.countries; // FIXME

    return countries.find(function(item) { return item.countryCode === countryCode; });
  }

  var showDataLabels = true; // Switch for data labels enabled/disabled

  $.each(Highcharts.mapDataIndex, function(group, maps) {
    $.each(maps, function(desc, path) {
      REGIONS.push({
        value: path,
        desc: desc
      });
    });
  });

  function numberGroup(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  initLocation();
  function initLocation() {
    var selectedMap = $('#geoMapBox').attr('data-value');
    var selectedDesc = $('#geoMapBox').attr('data-desc');

    var mapKey = selectedMap.slice(0, -3);
    var mapDesc = selectedDesc;

    // Show loading
    // if (Highcharts.charts[0]) {
    //   Highcharts.charts[0].showLoading('<i class="fa fa-spinner fa-spin fa-2x"></i>');
    // }

    // When the map is loaded or ready from cache...
    function mapReady() {
      var mapGeoJSON = Highcharts.maps[mapKey];
      var data = [];

      $.each(mapGeoJSON.features, function (index, feature) {
        var key = feature.properties['hc-key'];
        if (key) {
          var value = 0;

          if (feature.properties['hc-group'] === 'admin0') {
            window.zoomMessageExist = true;
            var country = getDataByCountry(feature.id);
            value = country && country.events;
          }

          if (feature.properties['hc-group'] === 'admin1') {
            window.zoomMessageExist = true;
            var country = getDataByCountry(feature.id.split('.')[0]);
            var region = country && country.regions.find(function(item) { return item.name === feature.properties['name']; });
            value = region && region.events;
          }

          if (feature.properties['hc-group'] === 'admin2') {
            $('#geoMessage').addClass('fade-out-me');
            window.zoomMessageExist = false;
            var country = getDataByCountry(feature.id.split('.')[0]);
            var region = country && country.regions.find(function(item) { return item.name === window.parentLevel; });
            var subRegion = region && region.subRegions.find(function(item) { return item.name ===  feature.properties['name']; });
            value = subRegion && subRegion.events;
            // console.log(feature.properties);
          }

          data.push({
            id: key.toUpperCase(),
            key: key,
            value: value || 0
          });
        }
      });

      var parent;
      var match = mapKey.match(/^(countries\/[a-z]{2}\/[a-z]{2})-[a-z0-9]+-all$/) ||
                  mapKey.match(/^(countries\/[a-z]{2}\/custom\/)[a-z]{2}-countries$/); // 'countries/gb/custom/gb-countries'
      if (/^countries\/[a-z]{2}\/[a-z]{2}-all$/.test(mapKey) ||
          /^countries\/[a-z]{2}\/custom\/[a-z]{2}-countries$/.test(mapKey)) { // country
        parent = {
          desc: 'World',
          key: 'custom/world-highres'
        };
      } else if (match) { // admin1
        parent = {
          desc: $('#geoMapBox').attr('data-desc'),
          key: REPLACE[match[1]] ? REPLACE[match[1]] : match[1] + '-all'
        };
      }

      $('#geoUp').html('');
      if (parent) {
        var goUp = REGIONS.find(function(region) { return region.value === parent.key + '.js'; });
        $('#geoUp').append(
          $('<a><i></i> ' + goUp.desc + (parent.desc === 'World' ? '' : ' \\ ' + parent.desc) + '</a>')
            .attr({ title: parent.key })
            .click(function () {
              $('#geoMapBox')
                .attr('data-value', parent.key + '.js')
                .attr('data-desc', parent.desc);
              initLocation();
            })
        );
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
          text: null
        },
        mapNavigation: {
          enabled: true,
        },
        xAxis: {
          // minRange: minRange,
          events: {
            afterSetExtremes: function (e) {
              if (window.zoomMessageExist && !(e.min === e.dataMin && e.max === e.dataMax)) {
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
            [0, COLORS[11]],
            [0.01, COLORS[8]],
            [0.5, COLORS[8]],
            [0.7, COLORS[8]],
            [1, Highcharts.Color(COLORS[8]).brighten(-0.5).get()]
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
            enabled: showDataLabels,
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
                window.parentLevel = name;
                console.log(name, ':', key);
                REGIONS.forEach(function(region) {
                  if ((region.value === 'countries/' + key.substr(0, 2) + '/' + key + '-all.js') ||
                      (region.value === 'countries/' + key.substr(0, 2) + '/custom/' + key.substr(0, 2) + '-countries.js')) {
                    $('#geoMapBox')
                      .attr('data-value', region.value)
                      .attr('data-desc', name);
                    initLocation();
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

      // console.log('MAP LOADING...', mapKey);
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
