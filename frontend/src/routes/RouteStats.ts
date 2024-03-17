import { div, h2 } from "@dolanske/cascade"
import { RouteProps, TrackmaniaMap, TrackmaniaPlayer } from "../types"
import MapStatistics from "../components/stats/MapStats"
import CountryStatistics from "../components/stats/CountryStats"

type Props = RouteProps<[
  TrackmaniaMap[],
  TrackmaniaPlayer[]
]>

export default div().setup((ctx, props: Props) => {
  const [$maps, $players] = props.$data

  ctx.class('container').class('route-stats')
  ctx.nest(
    h2('Countries'),
    CountryStatistics($players),
    h2('Maps'),
    MapStatistics($maps)
  )
})