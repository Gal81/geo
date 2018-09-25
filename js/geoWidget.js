(() => {
  const COLORS = [
    '#DAF8F8',
    '#15D6D8',
    '#012223',
  ];

  const WORLD = 'custom/world-highres.js';
  const REGIONS = [];
  let location = {};
  let detailsMessageExist = true;

  const loadLocation = () => {
    const loc = JSON.parse(localStorage.getItem('geoLocation'));
    if (loc && loc.src) {
      location = loc;
    } else {
      location = {
        country: '',
        region: '',
        src: WORLD,
      };
    }
  }

  const saveLocation = () => {
    localStorage.setItem('geoLocation', JSON.stringify(location));
    initLocation();
  }

  const getDataByCountry = countryCode => {
    const countries = window.geoCompliance.data.countries; // FIXME

    return countries.find(item => item.countryCode === countryCode);
  }

  const numberGroup = num => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  $.each(Highcharts.mapDataIndex, (group, maps) => {
    $.each(maps, (name, src) => {
      REGIONS.push({ name, src });
    });
  });

  initLocation();
  function initLocation() {
    loadLocation();
    const mapKey = location.src.slice(0, -3);

    if (Highcharts.charts[0]) {
      Highcharts.charts[0].showLoading('<i>LOADING...</i>');
    }

    // When the map is loaded or ready from cache...
    function mapReady() {
      const jumpToAdmin2 = ['VN'];
      const mapGeoJSON = Highcharts.maps[mapKey];
      const data = [];

      $.each(mapGeoJSON.features, (index, feature) => {
        const key = feature.properties['hc-key'];
        if (key) {
          let value = 0;

          if (feature.properties['hc-group'] === 'admin0') { // World
            const country = getDataByCountry(feature.id);
            value = country && country.events;
            detailsMessageExist = true;
          }

          if (feature.properties['hc-group'] === 'admin1') { // Country
            const countryCode = feature.id.substr(0, 2);
            const country = getDataByCountry(countryCode);

            if (jumpToAdmin2.includes(countryCode)) {
              if (country) {
                country.regions.forEach(item => {
                  const subRegion = item.subRegions.find(it => it.name === feature.properties['name']);
                  if (!value && subRegion) {
                    value = subRegion.events;
                    return true;
                  }
                });
              }
              detailsMessageExist = false;
            } else {
              const region = country && country.regions.find(item => item.name === feature.properties['name']);
              value = region && region.events;
              detailsMessageExist = true;
            }
          }

          if (feature.properties['hc-group'] === 'admin2') { // Region
            $('#geoMessage').addClass('fade-out-me');

            const countryCode = feature.id.substr(0, 2);
            const country = getDataByCountry(countryCode);
            const region = country && country.regions.find(item => item.name === location.region);
            const subRegion = region && region.subRegions.find(item => item.name === feature.properties['name']);
            value = subRegion && subRegion.events;
            detailsMessageExist = false;
          }

          data.push({
            key,
            id: key.toUpperCase(),
            value: value || 0
          });
        }
      });

      $('#geoUp').html('');
      $('#geoTitle').html('');
      if (location.country || location.region) {
        $('#geoUp').append(
          $('<a><< Back</a>')
            // .attr({ title: heir.src })
            .click(() => {
              location.country = location.region ? location.country : '';
              location.region = '';
              location.src = location.country ? REGIONS.find(item => item.name === location.country).src : WORLD;
              saveLocation();
            })
        );

        $('#geoTitle').append(location.country + (location.region ? ' \\ ' + location.region : ''));
      }

      const getMaxValue = () => Math.max.apply(null, data.map(item => item.value)) || 1;
      const minRange = 1000;

      $('#geoMap').highcharts('Map', {
        chart: {
          events: {
            load: function () {
              const target = 'NO'; // FIXME
              const country = $('#geoMap').highcharts().get(target);
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
            const { name, value } = this.point;
            return '<b>' + name + '</b><br>' +
              this.series.name + ': <b>' + numberGroup(value) + '</b>';
          }
        },
        title: {
          text: null,
        },
        mapNavigation: {
          enabled: true,
        },
        xAxis: {
          minRange,
          events: {
            afterSetExtremes: function (e) {
              if (detailsMessageExist) {
                $('#geoMessage').removeClass('fade-out-me');
              } else {
                $('#geoMessage').addClass('fade-out-me');
              }
            }
          }
        },
        yAxis: {
          minRange,
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
                const { key, name, value } = this;
                // if (value) {
                  console.log(name, ':', key);
                  REGIONS.forEach(region => {
                    if ((region.src === `countries/${key.substr(0, 2)}/${key}-all.js`)) {
                      if (key.length === 2) {
                        location.country = name;
                      } else {
                        location.region = name;
                      }
                      location.src = region.src;
                      saveLocation();
                      return true;
                    }
                  });
                // }
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
      const mapPathHC = 'https://code.highcharts.com/mapdata/';
      const mapPathAR = 'http://localhost:3000/'; // TODO: node server/server.js
      let scriptPath = '';

      const arSources = [
        'dk',
        'fi',
        'fi-all',
        'gb',
        'gb-all',
        'se',
        'ua',
        'vn',
        'vn-all',
      ];

      const mapLevel1 = mapKey.match(/^(countries\/[a-z]{2}\/[a-z]{2})-all$/);
      const mapLevel2 = mapKey.match(/^(countries\/[a-z]{2}\/[a-z]{2})-[a-z0-9]+-all$/);
      const admin1 = mapLevel1 && mapLevel1[0].split('/')[2];
      const admin2 = mapLevel2 && mapLevel2[0].split('/')[2];

      if (admin1 && arSources.indexOf(admin1) > -1) {
        const code = admin1.split('-')[0];
        scriptPath = `${mapPathAR}${code}/${code}-all.js`;
      } else if (admin2 && arSources.indexOf(admin2.split('-')[0]) > -1) {
        const code = admin2.split('-')[0];
        scriptPath = `${mapPathAR}${code}/${code}-admin2-all.js`;
      } else {
        scriptPath = `${mapPathHC}${mapKey}.js`;
      }

      $.getScript(scriptPath, mapReady);
    }
  }

})();
