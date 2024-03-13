import { $ } from '@dolanske/cascade'
import type { RouteProps, TrackmaniaMap } from '../types'
import MapItem from '../components/MapItem'
import InputSearch from '../components/form/InputSearch'
import { computed, ref } from '@vue/reactivity'
import { searchInStr } from '../util/search-in'

export default $.div().setup((ctx, props: RouteProps<TrackmaniaMap[]>) => {
  const { $data } = props

  const search = ref('')
  const toRender = computed(() => $data.filter(item => searchInStr(item.name, search.value)))

  ctx.nest([
    InputSearch().props({
      placeholder: 'Search maps',
      label: 'Search',
      modelValue: search
    }),
    $.ul().for(toRender, (map) => {
      return MapItem().props({ map })
    })
  ])
})
