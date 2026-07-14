import { useEffect, useMemo, useRef, useState } from 'react'
import {
  chartOneOptions,
  chartThreeOptions,
  chartThreeTabs,
  chartTwoMeta,
  chartTwoOptions,
} from '../models/chartModel.js'
import { getDemographics, getMapConfig } from '../models/dashboardModel.js'
import { getRecentOrders } from '../models/tableModel.js'

function useMenuDropdown() {
  const [menuOpen, setMenuOpen] = useState(false)

  return {
    menuOpen,
    toggleMenu: () => setMenuOpen((open) => !open),
    closeMenu: () => setMenuOpen(false),
  }
}

export function useChartOne() {
  const menu = useMenuDropdown()

  return {
    ...menu,
    options: chartOneOptions,
    series: chartOneOptions.series,
    type: 'bar',
    height: chartOneOptions.chart.height,
  }
}

export function useChartTwo() {
  const menu = useMenuDropdown()

  return {
    ...menu,
    options: chartTwoOptions,
    series: chartTwoOptions.series,
    type: 'radialBar',
    height: chartTwoOptions.chart.height,
    meta: chartTwoMeta,
  }
}

export function useChartThree() {
  const [selectedTab, setSelectedTab] = useState('overview')

  return {
    selectedTab,
    setSelectedTab,
    tabs: chartThreeTabs,
    options: chartThreeOptions,
    series: chartThreeOptions.series,
    type: 'area',
    height: chartThreeOptions.chart.height,
  }
}

export function useMapOne() {
  const menu = useMenuDropdown()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const mapConfig = useMemo(() => getMapConfig(), [])
  const demographics = getDemographics()

  useEffect(() => {
    let cancelled = false

    async function initMap() {
      if (!mapRef.current || mapInstanceRef.current) {
        return
      }

      const [{ default: jsVectorMap }] = await Promise.all([
        import('jsvectormap'),
        import('jsvectormap/dist/maps/world'),
        import('jsvectormap/dist/jsvectormap.css'),
      ])

      if (cancelled || !mapRef.current) {
        return
      }

      mapInstanceRef.current = new jsVectorMap({
        selector: mapRef.current,
        ...mapConfig,
      })
    }

    initMap()

    return () => {
      cancelled = true
      mapInstanceRef.current = null
    }
  }, [mapConfig])

  return {
    ...menu,
    mapRef,
    demographics,
  }
}

export function useRecentOrders() {
  return {
    rows: getRecentOrders(),
  }
}
