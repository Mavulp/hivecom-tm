import { div, ul, span } from '@dolanske/cascade'
import type { RouteProps, TrackmaniaMap, TrackmaniaPlayer } from '../types'
import MapItem from '../components/MapItem'
import InputSearch from '../components/form/InputSearch'
import { computed, ref } from '@vue/reactivity'
import { searchInStr } from '../util/search-in'
import InputSelect from '../components/form/InputSelect'
import InputCheckbox from '../components/form/InputCheckbox'
import { Icon } from '../components/Icon'
import { FETCH_INTERVAL, getRecords } from '../api'
import { getRoute } from "@dolanske/crumbs"
import { watch } from '@vue-reactivity/watch'

function extractKey(data: TrackmaniaMap[], key: keyof TrackmaniaMap) {
  return data
    .reduce((group, item) => {
      if (!group.includes(item[key] as string))
        group.push(item[key] as string)
      return group
    }, [] as string[])
    .sort()
}

export default div().setup((ctx, props: RouteProps<[number[], TrackmaniaMap[], TrackmaniaPlayer[]]>) => {
  const $records = ref(props.$data[0])
  const $maps = props.$data[1]
  const $players = props.$data[2]
  const search = ref('')

  // Environments
  const envFilters = ref<string[]>([])
  const envOptions = extractKey($maps, 'environment')

  // Players
  const plaFilters = ref<string[]>([])
  const plaOptions = $players
    .reduce((group, item) => {
      group.push(item.name)
      return group
    }, [] as string[])
    .sort()

  // Authors
  const autFilters = ref<string[]>([])
  const autOptions = extractKey($maps, 'author')

  // Checkboxes
  const showFormattedNames = ref(false)
  const showOnlyRecords = ref(false)

  // Apply filters
  const toRender = computed(() => $maps
    // Make sure every selected player is in the map's saved records
    .filter(item => (
      plaFilters.value.length > 0 ? plaFilters.value.some(p => item.records.find(r => r.player === p)) : true
        && envFilters.value.length > 0 ? envFilters.value.some(e => e === item.environment) : true
          && autFilters.value.length > 0 ? autFilters.value.some(a => a === item.author) : true
    ))
    .filter(item => searchInStr(item.name, search.value))
    .filter((item) => {
      if (!showOnlyRecords.value)
        return true
      return $records.value.includes(item.id)
    })
  )

  // Is set to true, if new records have been added since user loaded this page
  const hasNewRecords = ref(false)
  // Fetch new records
  const interval = setInterval(async () => {
    $records.value = await getRecords()
  }, 4000)
  ctx.onDestroy(() => clearInterval(interval))

  watch($records, (newVal, oldVal) => {
    if (!hasNewRecords.value && oldVal.length < newVal.length) {
      hasNewRecords.value = true
    }
  })

  // Scroll maps into view
  ctx.onMount(() => {
    const route = getRoute()
    if (route && route.hash) {
      const el = document.getElementById(route.hash)
      if (!el)
        return
      el?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  })


  ctx.class('container').class('route-map-list')
  ctx.nest(
    div().class('filter-wrap').nest(
      InputSearch().props({
        placeholder: 'Search maps',
        label: 'Search',
        modelValue: search
      }),
      InputSelect().props({
        label: 'Environment',
        options: envOptions,
        modelValue: envFilters
      }).style({ 'min-width': '156px' }),
      InputSelect().props({
        label: 'Player',
        options: plaOptions,
        modelValue: plaFilters,
      }).style({ 'min-width': '136px' }),
      InputSelect().props({
        label: 'Author',
        options: autOptions,
        modelValue: autFilters
      }).style({ 'min-width': '136px' }),
      InputCheckbox().props({
        modelValue: showFormattedNames,
        icon: Icon.palette
      }).attr('data-title-bottom', 'Show formatted map names'),
      InputCheckbox()
        .props({
          modelValue: showOnlyRecords,
          icon: Icon.medal
        })
        .attr('data-title-bottom', "Show new records only")
        .class('highlight', hasNewRecords)
    ),
    div().class('map-list').nest(
      ul().for(toRender, (map) => {
        return MapItem().props({
          map,
          showFormattedNames,
          isNewRecord: computed(() => $records.value.includes(map.id))
        })
      }),
      div(span('Looks like there are no maps here :/'))
        .if(computed(() => toRender.value.length === 0))
        .class('empty-state')
    ),
  )
})

