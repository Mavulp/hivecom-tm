import { $ } from '@dolanske/pantry'
import type { TrackmaniaMap } from '../types'

const { details, summary, strong, span, div, pre } = $

export const Mapitem = div().setup((ctx, props) => {
  const data: TrackmaniaMap = props.map
  const record = data.records[0]

  ctx.class('map-item')
  ctx.nest($.span(data.name))
  // ctx.nest([
  // data.name
  // summary([
  //   strong().html(data.named_styled),
  //   span(data.author),
  //   span(record.time).class('record-time'),
  // ]),
  // div([
  //   pre(JSON.stringify(data.records, null, 2)),
  // ]).class('content'),
  // ])
})
