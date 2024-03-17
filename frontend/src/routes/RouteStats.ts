import { div, h2 } from "@dolanske/cascade"
import { RouteProps, TrackmaniaMap, TrackmaniaPlayer } from "../types"
import ProcessMaps from "../components/stats/MapStats"
import ProcessPlayers from "../components/stats/PlayerStats"

type Props = RouteProps<[
  TrackmaniaMap[],
  TrackmaniaPlayer[]
]>

export default div().setup((ctx, props: Props) => {
  const [$maps, $players] = props.$data

  ctx.class('container').class('route-stats')
  ctx.nest(
    h2('Countries'),
    ProcessPlayers($players),
    h2('Maps'),
    ProcessMaps($maps)
  )
})