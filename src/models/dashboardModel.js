export function getDashboardMetrics() {
  return [
    {
      id: 'customers',
      label: 'Customers',
      value: '3,782',
      trend: '11.01%',
      trendUp: true,
    },
    {
      id: 'orders',
      label: 'Orders',
      value: '5,359',
      trend: '9.05%',
      trendUp: false,
    },
  ]
}

export function getMapConfig() {
  return {
    map: 'world',
    zoomButtons: false,
    regionStyle: {
      initial: {
        fontFamily: 'Outfit',
        fill: '#D9D9D9',
      },
      hover: {
        fillOpacity: 1,
        fill: '#465fff',
      },
    },
    markers: [
      {
        name: 'Egypt',
        coords: [26.8206, 30.8025],
      },
      {
        name: 'United Kingdom',
        coords: [55.3781, 3.436],
      },
      {
        name: 'United States',
        coords: [37.0902, -95.7129],
      },
    ],
    markerStyle: {
      initial: {
        strokeWidth: 1,
        fill: '#465fff',
        fillOpacity: 1,
        r: 4,
      },
      hover: {
        fill: '#465fff',
        fillOpacity: 1,
      },
      selected: {},
      selectedHover: {},
    },
    onRegionTooltipShow(tooltip, code) {
      if (code === 'EG') {
        tooltip.selector.innerHTML = `${tooltip.text()} <b>(Hello Russia)</b>`
      }
    },
  }
}

export function getDemographics() {
  return [
    {
      id: 'usa',
      country: 'USA',
      customers: '2,379 Customers',
      flag: '/images/country/country-01.svg',
      percent: 79,
    },
    {
      id: 'france',
      country: 'France',
      customers: '589 Customers',
      flag: '/images/country/country-02.svg',
      percent: 23,
    },
  ]
}
