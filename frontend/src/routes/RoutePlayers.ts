import { div, ul, li, span, table, tr, th, td, thead, tbody } from "@dolanske/cascade"
import { RouteProps, TrackmaniaPlayer, TrackmaniaRecord } from "../types"
import RecordList from "../components/RecordList"
import Player from "../components/Player"

export default div('div').setup((ctx, props: RouteProps<[TrackmaniaRecord[], TrackmaniaPlayer[]]>) => {
  const $records = props.$data[0]
  const $players = props.$data[1]

  const sorted = $players.sort((a, b) => a.records > b.records ? -1 : 1);

  ctx.class('container').class('c-mid').class('route-players')
  ctx.nest(
    // table(
    //   thead(
    //     tr([
    //       th('Player'),
    //       th('Player'),
    //       th('Player'),
    //       th('Player'),
    //     )
    //   )
    // )
    ul().for(sorted, (item, index) => {
      const { name, country } = item

      return li().nest(
        span(`#${index + 1}`).class('player-position'),
        Player().props({ player: name, country })
      )
    })
  )
})