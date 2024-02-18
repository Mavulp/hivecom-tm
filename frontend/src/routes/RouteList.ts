import { $ } from '@dolanske/pantry'
import type { Props, TrackmaniaMap } from '../types'
import { Mapitem } from '../components/MapItem'

export default $.div().setup((ctx, props: Props<TrackmaniaMap[]>) => {
  ctx.nest(
    $.ul(
      $.li().for(props.$data, (ctx, { value }) => {
        ctx.nest(Mapitem.prop('map', value))
      }),
    ),
  )
})
