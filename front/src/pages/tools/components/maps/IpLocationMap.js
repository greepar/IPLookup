import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const ipMarkerIcon = L.divIcon({
  className: 'ip-location-map__marker',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function hasCoordinates(profile) {
  return Number.isFinite(profile?.latitude) && Number.isFinite(profile?.longitude)
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export default {
  name: 'IpLocationMap',
  props: {
    profile: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const wrapElement = ref(null)
    const mapElement = ref(null)
    const mapSize = ref({
      height: 220,
      width: null,
    })
    const canShowMap = computed(() => props.profile.available && hasCoordinates(props.profile))
    const mapCanvasStyle = computed(() => ({
      height: `${mapSize.value.height}px`,
      width: mapSize.value.width ? `${mapSize.value.width}px` : '100%',
    }))
    let map = null
    let marker = null
    let resizeFrame = 0
    let resizeState = null
    let disposed = false

    function destroyMap() {
      if (!map) {
        return
      }

      map.remove()
      map = null
      marker = null
    }

    function invalidateMapSize() {
      if (resizeFrame) {
        return
      }

      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0
        map?.invalidateSize()
      })
    }

    function updateMarker() {
      if (!map || !hasCoordinates(props.profile)) {
        return
      }

      const position = [props.profile.latitude, props.profile.longitude]
      const popupContent = `${props.profile.label} ${props.profile.addressText}<br>${props.profile.country} ${props.profile.region} ${props.profile.city}`

      map.setView(position, 8)

      if (!marker) {
        marker = L.marker(position, { icon: ipMarkerIcon }).addTo(map)
      } else {
        marker.setLatLng(position)
      }

      marker.bindPopup(popupContent)
    }

    function recenterMap() {
      if (!map || !hasCoordinates(props.profile)) {
        return
      }

      const position = [props.profile.latitude, props.profile.longitude]

      map.flyTo(position, Math.max(map.getZoom(), 8), {
        duration: 0.45,
      })
      updateMarker()
    }

    async function refreshMap() {
      if (disposed || !canShowMap.value) {
        return
      }

      await nextTick()

      if (disposed || !mapElement.value || !canShowMap.value) {
        return
      }

      if (!map) {
        map = L.map(mapElement.value, {
          attributionControl: false,
          scrollWheelZoom: true,
        })

        L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}', {
          maxZoom: 18,
          subdomains: ['1', '2', '3', '4'],
          attribution: '© 高德地图',
        }).addTo(map)

        L.control.attribution({ prefix: false }).addTo(map)
      }

      updateMarker()
      invalidateMapSize()
      window.setTimeout(() => {
        map?.invalidateSize()
      }, 450)
    }

    function stopResize() {
      if (!resizeState) {
        return
      }

      window.removeEventListener('pointermove', resizeState.move)
      window.removeEventListener('pointerup', resizeState.end)
      window.removeEventListener('pointercancel', resizeState.end)
      document.body.style.cursor = resizeState.previousCursor
      document.body.style.userSelect = resizeState.previousUserSelect
      resizeState = null
      invalidateMapSize()
    }

    function startResize(event) {
      if (!mapElement.value || !wrapElement.value) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const rect = mapElement.value.getBoundingClientRect()
      const wrapRect = wrapElement.value.getBoundingClientRect()
      const maxWidth = Math.max(280, wrapRect.width)
      const startWidth = rect.width
      const startHeight = rect.height
      const startX = event.clientX
      const startY = event.clientY

      const move = (moveEvent) => {
        const nextWidth = clamp(startWidth + moveEvent.clientX - startX, 280, maxWidth)
        const nextHeight = clamp(startHeight + moveEvent.clientY - startY, 180, 620)

        mapSize.value = {
          height: Math.round(nextHeight),
          width: Math.round(nextWidth),
        }
        invalidateMapSize()
      }

      const end = () => {
        stopResize()
      }

      stopResize()
      resizeState = {
        end,
        move,
        previousCursor: document.body.style.cursor,
        previousUserSelect: document.body.style.userSelect,
      }
      document.body.style.cursor = 'nwse-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', end)
      window.addEventListener('pointercancel', end)
    }

    onMounted(() => {
      refreshMap()
    })

    watch(() => props.profile, () => {
      refreshMap()
    }, { deep: true })

    onBeforeUnmount(() => {
      disposed = true
      stopResize()
      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame)
        resizeFrame = 0
      }
      destroyMap()
    })

    return {
      canShowMap,
      mapCanvasStyle,
      mapElement,
      recenterMap,
      refreshMap,
      startResize,
      wrapElement,
    }
  },
}
