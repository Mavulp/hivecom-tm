import { span, reusable, strong, fragment, div, table, tr, th, td } from '@dolanske/cascade'
import type { TrackmaniaMap } from '../types'
import { Ref, computed, ref } from '@vue/reactivity'
import Detail from './Detail'
import { timeAgo } from '../util/time'
import RecordList from './RecordList'
import { getRoute } from "@dolanske/crumbs"

interface Props {
  map: TrackmaniaMap
  showFormattedNames: Ref<boolean>
  isNewRecord: Ref<boolean>
}

export default reusable('div', (ctx, props: Props) => {
  const wr = props.map.records.toSorted((a, b) => a.time > b.time ? 1 : -1)[0]
  const name = computed(() => props.showFormattedNames.value ? props.map.name_styled : props.map.name)
  const active = ref(false)

  ctx.onMount(() => {
    const route = getRoute()
    if (route && Number(route.hash) === props.map.id) {
      active.value = true
    }
  })

  ctx.class('map-item').class({
    'new-record': props.isNewRecord.value,
    'is-highlight': active
  })
  ctx.id(props.map.id)
  ctx.nest(
    Detail().props({
      button: fragment([
        span().class('map-name').html(name),
        strong(wr.player).class('map-player'),
        strong(wr.time).class('map-time')
      ]),
      content: div().class('map-content')
        .nest(
          div().class('map-details').nest(
            table([
              tr([th('Environment'), td(props.map.environment)]),
              tr([th('Author'), td(props.map.author)]),
              tr([th('Records'), td(props.map.records.length)]),
              tr([th('Latest time'), td().setup((ctx) => {
                const latest = props.map.records.sort((a, b) => a.unixDate > b.unixDate ? -1 : 1)[0]
                ctx.text(`${latest.player}, ${timeAgo(Number(`${latest.unixDate}000`))}`)
              })])
            ])
          ),
          div().class('map-players').nest(RecordList().props({
            records: props.map.records
          }))
        )
    })
  )
})