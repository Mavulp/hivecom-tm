import { $, reusable } from '@dolanske/cascade'
import type { TrackmaniaMap } from '../types'

interface Props {
  map: TrackmaniaMap
}

export default reusable('div', (ctx, props) => {
  // const data = props.map
  // const record = props.map.records[0]
  ctx.class('map-item')
  ctx.nest($.span(props.map.name))
})