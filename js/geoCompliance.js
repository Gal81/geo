(function() {
  var MAPS = [
    'Canada Provinces Admin 2',
    'Countries',
    'Custom',
    'Denmark',
    'France Regions Admin 2',
    'Germany Bundesländer Admin 2',
    'Germany Bundesländer Admin 3',
    'Netherlands Provinces',
    'Norway Counties',
    'USA States',
    'Ukraine',
  ];

  var REGIONS = [];

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

  // Base path to maps
  var baseMapPath = 'https://code.highcharts.com/mapdata/';
  var showDataLabels = true; // Switch for data labels enabled/disabled

  Highcharts.mapDataIndex['Denmark'] = {
    'Nordjylland, admin2': 'countries/dk/dk-3568-all.js',
    'Midtjylland, admin2': 'countries/dk/dk-6326-all.js',
    'Syddanmark, admin2': 'countries/dk/dk-3564-all.js',
    'Sjælland, admin2': 'countries/dk/dk-3563-all.js',
    'Hovedstaden, admin2': 'countries/dk/dk-6325-all.js',
  };

  Highcharts.mapDataIndex['Ukraine'] = {
    "Cherkasy, admin2": "countries/ua/ua-ck-all.js",
    "Chernihiv, admin2": "countries/ua/ua-ch-all.js",
    "Chernivtsi, admin2": "countries/ua/ua-cv-all.js",
    "Crimea, admin2": "countries/ua/ua-kr-all.js",
    "Dnipropetrovs'k, admin2": "countries/ua/ua-dp-all.js",
    "Donets'k, admin2": "countries/ua/ua-dt-all.js",
    "Ivano-Frankivs'k, admin2": "countries/ua/ua-if-all.js",
    "Kharkiv, admin2": "countries/ua/ua-kk-all.js",
    "Kherson, admin2": "countries/ua/ua-ks-all.js",
    "Khmel'nyts'kyy, admin2": "countries/ua/ua-km-all.js",
    "Kiev, admin2": "countries/ua/ua-kv-all.js",
    "Kiev City, admin2": "countries/ua/ua-kc-all.js",
    "Kirovohrad, admin2": "countries/ua/ua-kh-all.js",
    "L'viv, admin2": "countries/ua/ua-lv-all.js",
    "Luhans'k, admin2": "countries/ua/ua-lh-all.js",
    "Mykolayiv, admin2": "countries/ua/ua-my-all.js",
    "Odessa, admin2": "countries/ua/ua-od-all.js",
    "Poltava, admin2": "countries/ua/ua-pl-all.js",
    "Rivne, admin2": "countries/ua/ua-rv-all.js",
    "Sevastopol', admin2": "countries/ua/ua-sc-all.js",
    "Sumy, admin2": "countries/ua/ua-sm-all.js",
    "Ternopil', admin2": "countries/ua/ua-tp-all.js",
    "Transcarpathia, admin2": "countries/ua/ua-zk-all.js",
    "Vinnytsya, admin2": "countries/ua/ua-vi-all.js",
    "Volyn, admin2": "countries/ua/ua-vo-all.js",
    "Zaporizhzhya, admin2": "countries/ua/ua-zp-all.js",
    "Zhytomyr, admin2": "countries/ua/ua-zt-all.js"
  };

  $.each(Highcharts.mapDataIndex, function (mapGroup, maps) {
    if (MAPS.includes(mapGroup)) {
      $.each(maps, function (desc, path) {
        REGIONS.push({
          value: path,
          desc: desc
        });
      });
    }
  });
  console.log(REGIONS);

  function numberGroup(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  initLocation();
  function initLocation() {
    var selectedValue = $('#geoMapBox').attr('data-value');
    var selectedDesc = $('#geoMapBox').attr('data-desc');

    var mapKey = selectedValue.slice(0, -3);
    var mapDesc = selectedDesc;
    var javascriptPath = baseMapPath + selectedValue;

    // Show loading
    // if (Highcharts.charts[0]) {
    //   Highcharts.charts[0].showLoading('<i class="fa fa-spinner fa-spin fa-2x"></i>');
    // }

    // When the map is loaded or ready from cache...
    function mapReady() {
      var mapGeoJSON = Highcharts.maps[mapKey];
      var data = [];
      var parent;
      var match;

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

      // Is there a layer above this?
      match = mapKey.match(/^(countries\/[a-z]{2}\/[a-z]{2})-[a-z0-9]+-all$/);
      if (/^countries\/[a-z]{2}\/[a-z]{2}-all$/.test(mapKey)) { // country
        parent = {
          desc: 'World',
          key: 'custom/world-highres'
        };
      } else if (match) { // admin1
        parent = {
          desc: $('#geoMapBox').attr('data-desc'),
          key: match[1] + '-all'
        };
      }

      $('#geoUp').html('');
      if (parent) {
        $('#geoUp').append(
          $('<a><i></i> Back</a>')
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
      var minRange = 500;

      $('#geoMap').highcharts('Map', {
        chart: {
          events: {
            load: function () {
              var target = 'SE'; // FIXME
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
            [0.3, COLORS[8]],
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
                window.parentLevel = this.name;
                console.log(key);
                REGIONS.forEach(function(region) {
                  if (region.value === 'countries/' + key.substr(0, 2) + '/' + key + '-all.js') {
                    $('#geoMapBox')
                      .attr('data-value', region.value)
                      .attr('data-desc', region.desc);
                    initLocation();
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
      $.getScript(javascriptPath, mapReady);
    }
  }

})();
