import { span, reusable, strong } from '@dolanske/cascade'
import type { TrackmaniaMap } from '../types'
import { Ref, computed } from '@vue/reactivity'

interface Props {
  map: TrackmaniaMap
  showFormattedNames: Ref<boolean>
}

export default reusable('div', (ctx, props: Props) => {
  const wr = props.map.records[0]
  const name = computed(() => props.showFormattedNames.value ? props.map.name_styled : props.map.name)

  ctx.class('map-item')
  ctx.nest(
    span().class('map-name').html(name),
    strong(wr.player).class('map-player'),
    strong(wr.time).class('map-time')
  )
})