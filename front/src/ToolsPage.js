import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import IpLocationMap from './components/maps/IpLocationMap.vue'

const emptyCoordinates = {
  coordinates: '未提供',
  latitude: null,
  longitude: null,
  mapX: '50%',
  mapY: '50%',
}

function createProtocolProfile(version, state = 'loading') {
  const label = version === 'ipv6' ? 'IPv6' : 'IPv4'

  return {
    ...emptyCoordinates,
    available: false,
    loading: state === 'loading',
    label,
    shortLabel: version === 'ipv6' ? 'v6' : 'v4',
    address: '',
    addressText: state === 'loading' ? '正在获取…' : '未获取到该地址，当前网络可能不支持该协议',
    asn: state === 'loading' ? '正在获取…' : '未知',
    carrier: '',
    carrierLocation: '',
    city: state === 'loading' ? '正在获取…' : '未知',
    colo: state === 'loading' ? '正在获取…' : '未知',
    country: state === 'loading' ? '正在获取…' : '未知',
    postalCode: state === 'loading' ? '正在获取…' : '未知',
    protocol: state === 'loading' ? '正在获取…' : '未知',
    isp: state === 'loading' ? '正在获取…' : '未知',
    mapNote: `${label} 位置示意`,
    networkType: state === 'loading' ? '正在获取…' : '未知',
    region: state === 'loading' ? '正在获取…' : '未知',
    scope: '公网地址',
    timezone: state === 'loading' ? '正在获取…' : '未知',
    tlsVersion: state === 'loading' ? '正在获取…' : '未知',
    userAgent: state === 'loading' ? '正在获取…' : '未提供',
  }
}

function formatCoordinates(data) {
  const latitude = Number(data.latitude)
  const longitude = Number(data.longitude)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return emptyCoordinates
  }

  return {
    coordinates: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    latitude,
    longitude,
    mapX: `${Math.min(96, Math.max(4, ((longitude + 180) / 360) * 100)).toFixed(1)}%`,
    mapY: `${Math.min(96, Math.max(4, ((90 - latitude) / 180) * 100)).toFixed(1)}%`,
  }
}

function profileFromIPData(data, version) {
  const label = version === 'ipv6' ? 'IPv6' : 'IPv4'
  const address = version === 'ipv6' ? data.ipv6 || data.ip : data.ip
  const organization = data.asOrganization || ''
  const protocolText = [data.protocol, data.tlsVersion, data.colo].filter(Boolean).join(' / ')

  return {
    ...createProtocolProfile(version, 'ready'),
    ...formatCoordinates(data),
    available: Boolean(address),
    loading: false,
    address: address || '',
    addressText: address || '未获取到',
    asn: data.asn ? `AS${data.asn}` : '未知',
    carrier: organization,
    carrierLocation: [data.country, data.region, data.city].filter(Boolean).join(' ') || '未知',
    city: data.city || '未知',
    colo: data.colo || '未知',
    country: data.country || '未知',
    isp: organization || '未知',
    mapNote: `${label} 位置示意`,
    networkType: protocolText || '未知',
    postalCode: data.postalCode || '未知',
    protocol: data.protocol || '未知',
    region: data.region || '未知',
    timezone: data.timezone || '未知',
    tlsVersion: data.tlsVersion || '未知',
    userAgent: data.userAgent || '未提供',
  }
}

function createOverviewProfile(protocolProfiles) {
  const availableProfiles = [protocolProfiles.ipv4, protocolProfiles.ipv6].filter((profile) => profile.available)
  const primaryProfile = availableProfiles[0] || protocolProfiles.ipv4 || protocolProfiles.ipv6

  if (!primaryProfile) {
    return createProtocolProfile('ipv4', 'empty')
  }

  return {
    ...primaryProfile,
    available: availableProfiles.length > 0,
    loading: availableProfiles.length === 0 && (protocolProfiles.ipv4?.loading || protocolProfiles.ipv6?.loading),
    label: '总览',
    address: availableProfiles.map((profile) => profile.address).filter(Boolean).join(' / '),
    addressText: availableProfiles.map((profile) => profile.addressText).filter(Boolean).join(' / ') || '未获取到',
    asn: availableProfiles.map((profile) => profile.asn).filter(Boolean).join(' / ') || primaryProfile.asn,
    carrier: availableProfiles.map((profile) => profile.carrier).filter(Boolean).join(' / ') || primaryProfile.carrier,
    mapNote: '总览示意',
    networkType: availableProfiles.map((profile) => profile.networkType).filter(Boolean).join(' / ') || primaryProfile.networkType,
    userAgent: availableProfiles.map((profile) => profile.userAgent).filter(Boolean).join(' / ') || primaryProfile.userAgent,
  }
}

async function fetchIPJson(url) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(url, { signal: controller.signal })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  } finally {
    window.clearTimeout(timeout)
  }
}

const bashCommands = [
  {
    key: 'ipv4',
    label: 'IPv4',
    command: 'curl 4.qwq.lu',
    meta: '快速查看当前 IPv4 出口',
  },
  {
    key: 'ipv6',
    label: 'IPv6',
    command: 'curl 6.qwq.lu',
    meta: '快速查看当前 IPv6 出口',
  },
  {
    key: 'ipsb',
    label: '自动',
    command: 'curl a.qwq.lu',
    meta: '自动 IPv4 / IPv6',
  },
]

const collapseDuration = 420
const collapseTransition = [
  `height ${collapseDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
  'opacity 280ms ease',
  `transform ${collapseDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
].join(', ')

function normalizeProtocol(profile, version) {
  const label = version === 'overview' ? '总览' : version === 'ipv6' ? 'IPv6' : 'IPv4'

  if (!profile?.available) {
    return {
      available: false,
      loading: Boolean(profile?.loading),
      label,
      addressText: profile?.addressText || `无 ${label}`,
      shortLabel: version === 'ipv6' ? 'v6' : version === 'ipv4' ? 'v4' : label,
      status: profile?.loading ? `正在获取 ${label}` : `当前记录未提供 ${label}`,
      accent: '未提供',
      note: '',
      scope: '未提供',
      asn: profile?.asn || 'N/A',
      isp: profile?.isp || '未提供',
      carrier: profile?.carrier || '',
      carrierLocation: profile?.carrierLocation || '',
      colo: profile?.colo || '未提供',
      networkType: profile?.networkType || '未提供',
      postalCode: profile?.postalCode || '未提供',
      protocol: profile?.protocol || '未提供',
      country: profile?.country || '未提供',
      region: profile?.region || '未提供',
      city: profile?.city || '未提供',
      timezone: profile?.timezone || '未提供',
      tlsVersion: profile?.tlsVersion || '未提供',
      userAgent: profile?.userAgent || '未提供',
      coordinates: profile?.coordinates || '未提供',
      latitude: profile?.latitude ?? null,
      longitude: profile?.longitude ?? null,
      mapX: profile?.mapX || '50%',
      mapY: profile?.mapY || '50%',
      mapNote: `${label} 缺失`,
    }
  }

  return {
    ...profile,
    addressText: profile.addressText || profile.address,
    shortLabel: version === 'ipv6' ? 'v6' : version === 'ipv4' ? 'v4' : label,
  }
}

export default {
  name: 'ToolsPage',
  components: {
    IpLocationMap,
  },
  setup() {
    const selectedVersion = ref('overview')
    const copiedVersion = ref('')
    const copiedCommand = ref('')
    const preferredVersion = ref('')
    const locationMap = ref(null)
    const protocolProfiles = ref({
      ipv4: createProtocolProfile('ipv4'),
      ipv6: createProtocolProfile('ipv6'),
    })
    const collapsedPanels = ref({
      details: false,
      map: true,
    })
    const hiddenPanels = ref({
      network: false,
      location: false,
    })
    let copyFeedbackTimer = 0
    let copyCommandTimer = 0
    let disposed = false

    const activeIpInfo = computed(() => {
      const profile = selectedVersion.value === 'overview'
        ? createOverviewProfile(protocolProfiles.value)
        : protocolProfiles.value[selectedVersion.value]

      return normalizeProtocol(profile, selectedVersion.value)
    })
    const ipCards = computed(() => {
      return ['ipv4', 'ipv6'].map((version) => ({
        key: version,
        ...normalizeProtocol(protocolProfiles.value[version], version),
      }))
    })
    const versionTabs = computed(() => {
      const tabs = [
        { key: 'overview', label: '总览' },
      ]

      if (protocolProfiles.value.ipv4.available) {
        tabs.push({ key: 'ipv4', label: 'IPv4' })
      }

      if (protocolProfiles.value.ipv6.available) {
        tabs.push({ key: 'ipv6', label: 'IPv6' })
      }

      return tabs
    })
    const priorityTitle = computed(() => {
      if (preferredVersion.value === 'ipv4') {
        return '当前网络 IPV4 优先'
      }

      if (preferredVersion.value === 'ipv6') {
        return '当前网络 IPV6 优先'
      }

      return '当前网络信息'
    })

    function setProtocolProfile(version, profile) {
      if (disposed) {
        return
      }

      protocolProfiles.value = {
        ...protocolProfiles.value,
        [version]: profile,
      }
    }

    async function fetchProtocolProfile(version, url) {
      try {
        const data = await fetchIPJson(url)
        const profile = profileFromIPData(data, version)

        setProtocolProfile(version, profile)
        return profile
      } catch {
        const profile = createProtocolProfile(version, 'empty')

        setProtocolProfile(version, profile)
        return null
      }
    }

    async function initIPLookup() {
      let autoData = null

      try {
        autoData = await fetchIPJson('https://a.qwq.lu/?detail')
      } catch {
        autoData = null
      }

      if (!autoData || (autoData.family !== 'v4' && autoData.family !== 'v6')) {
        preferredVersion.value = ''
        await Promise.all([
          fetchProtocolProfile('ipv4', 'https://4.qwq.lu/?detail'),
          fetchProtocolProfile('ipv6', 'https://6.qwq.lu/?detail'),
        ])
        return
      }

      preferredVersion.value = autoData.family === 'v6' ? 'ipv6' : 'ipv4'

      if (autoData.family === 'v4') {
        setProtocolProfile('ipv4', profileFromIPData(autoData, 'ipv4'))
        await fetchProtocolProfile('ipv6', 'https://6.qwq.lu/?detail')
        return
      }

      setProtocolProfile('ipv6', profileFromIPData(autoData, 'ipv6'))
      await fetchProtocolProfile('ipv4', 'https://4.qwq.lu/?detail')
    }

    function selectVersion(version) {
      selectedVersion.value = version
    }

    watch(versionTabs, (tabs) => {
      if (!tabs.some((tab) => tab.key === selectedVersion.value)) {
        selectedVersion.value = 'overview'
      }
    }, { immediate: true })

    function togglePanelHidden(panel) {
      hiddenPanels.value = {
        ...hiddenPanels.value,
        [panel]: !hiddenPanels.value[panel],
      }
    }

    function togglePanelCollapsed(panel) {
      collapsedPanels.value = {
        ...collapsedPanels.value,
        [panel]: !collapsedPanels.value[panel],
      }
    }

    function clearCollapseTransition(element) {
      if (element._collapseFrame) {
        window.cancelAnimationFrame(element._collapseFrame)
        delete element._collapseFrame
      }
      if (element._collapseTimer) {
        window.clearTimeout(element._collapseTimer)
        delete element._collapseTimer
      }
      if (element._collapseEndHandler) {
        element.removeEventListener('transitionend', element._collapseEndHandler)
        delete element._collapseEndHandler
      }
    }

    function finishCollapseTransition(element, done) {
      const finish = () => {
        clearCollapseTransition(element)
        done()
      }

      element._collapseEndHandler = (event) => {
        if (event.target === element && event.propertyName === 'height') {
          finish()
        }
      }

      element.addEventListener('transitionend', element._collapseEndHandler)
      element._collapseTimer = window.setTimeout(finish, collapseDuration + 80)
    }

    function shouldReduceMotion() {
      return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    }

    function beforeCollapseEnter(element) {
      clearCollapseTransition(element)
      element.style.transition = 'none'
      element.style.height = '0'
      element.style.opacity = '0'
      element.style.transform = 'translateY(-3px) scale(0.992)'
      element.style.overflow = 'hidden'
      element.offsetHeight
    }

    function collapseEnter(element, done) {
      if (shouldReduceMotion()) {
        done()
        return
      }

      element.style.transition = 'none'
      element.style.height = 'auto'
      const targetHeight = `${element.scrollHeight}px`
      element.style.height = '0'
      element.offsetHeight

      element.style.transition = collapseTransition
      window.requestAnimationFrame(() => {
        element.style.height = targetHeight
        element.style.opacity = '1'
        element.style.transform = 'translateY(0)'
        finishCollapseTransition(element, done)
      })
    }

    function beforeCollapseLeave(element) {
      clearCollapseTransition(element)
      element.style.transition = 'none'
      element.style.height = `${element.scrollHeight}px`
      element.style.opacity = '1'
      element.style.transform = 'translateY(0)'
      element.style.overflow = 'hidden'
      element.offsetHeight
    }

    function collapseLeave(element, done) {
      if (shouldReduceMotion()) {
        done()
        return
      }

      element.style.transition = collapseTransition
      window.requestAnimationFrame(() => {
        element.style.height = '0'
        element.style.opacity = '0'
        element.style.transform = 'translateY(-3px) scale(0.992)'
        finishCollapseTransition(element, done)
      })
    }

    function afterCollapseTransition(element) {
      clearCollapseTransition(element)
      element.style.transition = ''
      element.style.height = ''
      element.style.opacity = ''
      element.style.transform = ''
      element.style.overflow = ''
    }

    function handleMapCollapseTransitionEnd(event) {
      if (event.target !== event.currentTarget || event.propertyName !== 'grid-template-rows') {
        return
      }

      if (!collapsedPanels.value.map) {
        window.requestAnimationFrame(() => {
          locationMap.value?.refreshMap()
        })
      }
    }

    async function writeToClipboard(text) {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        return
      }

      const helper = document.createElement('textarea')
      helper.value = text
      helper.setAttribute('readonly', '')
      helper.style.position = 'absolute'
      helper.style.left = '-9999px'
      document.body.appendChild(helper)
      helper.select()
      document.execCommand('copy')
      document.body.removeChild(helper)
    }

    async function copyAddress(profile) {
      if (!profile.available) {
        return
      }

      try {
        await writeToClipboard(profile.addressText)
        copiedVersion.value = profile.key
        window.clearTimeout(copyFeedbackTimer)
        copyFeedbackTimer = window.setTimeout(() => {
          copiedVersion.value = ''
        }, 1600)
      } catch {
        copiedVersion.value = ''
      }
    }

    async function copyCommand(commandKey, commandText) {
      try {
        await writeToClipboard(commandText)
        copiedCommand.value = commandKey
        window.clearTimeout(copyCommandTimer)
        copyCommandTimer = window.setTimeout(() => {
          copiedCommand.value = ''
        }, 1600)
      } catch {
        copiedCommand.value = ''
      }
    }

    onMounted(() => {
      initIPLookup()
    })

    onBeforeUnmount(() => {
      disposed = true
      window.clearTimeout(copyFeedbackTimer)
      window.clearTimeout(copyCommandTimer)
    })

    return {
      activeIpInfo,
      bashCommands,
      collapsedPanels,
      copiedCommand,
      copiedVersion,
      afterCollapseTransition,
      beforeCollapseEnter,
      beforeCollapseLeave,
      collapseEnter,
      collapseLeave,
      copyAddress,
      copyCommand,
      hiddenPanels,
      handleMapCollapseTransitionEnd,
      ipCards,
      locationMap,
      preferredVersion,
      priorityTitle,
      selectedVersion,
      selectVersion,
      versionTabs,
      togglePanelCollapsed,
      togglePanelHidden,
    }
  },
}
