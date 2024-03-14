import { span, reusable, strong, fragment, div, table, tr, th, td } from '@dolanske/cascade'
import type { TrackmaniaMap } from '../types'
import { Ref, computed } from '@vue/reactivity'
import Detail from './Detail'
import { timeAgo } from '../util/time'

interface Props {
  map: TrackmaniaMap
  showFormattedNames: Ref<boolean>
}

export default reusable('div', (ctx, props: Props) => {
  const wr = props.map.records[0]
  const name = computed(() => props.showFormattedNames.value ? props.map.name_styled : props.map.name)

  ctx.class('map-item')
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
              tr([th('Newest time'), td().setup((ctx) => {
                const latest = props.map.records.sort((a, b) => a.unixDate > b.unixDate ? -1 : 1)[0]
                ctx.text(`${timeAgo(Number(`${latest.unixDate}000`))} by ${latest.player}`)
              })])
            ])
          ),
          div().class('map-players')
        )
    })
  )
})