import { $ } from '@dolanske/pantry'
import type { RouteProps, TrackmaniaMap } from '../types'
import MapItem from '../components/MapItem'

export default $.div().setup((ctx, props: RouteProps<TrackmaniaMap[]>) => {
  ctx.nest(
    $.ul().for(props.$data, (map) => {
      return MapItem().props({ map })
    })
  )
})
