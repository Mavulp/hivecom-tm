import { div, p, span, table, tr, th, td, thead, tbody, strong } from "@dolanske/cascade"
import { RouteProps, TrackmaniaPlayer, TrackmaniaRecord } from "../types"
import RecordList from "../components/RecordList"
import Player from "../components/Player"
import { timeAgo } from "../util/time"
import { computed, ref } from "@vue/reactivity"
import { searchInStr } from "../util/search-in"
import InputSearch from "../components/form/InputSearch"

export default div('div').setup((ctx, props: RouteProps<[TrackmaniaRecord[], TrackmaniaPlayer[]]>) => {
  // const $records = props.$data[0]
  const $players = props.$data[1]
  const search = ref('')
  const sorted = $players.sort((a, b) => a.records > b.records ? -1 : 1);
  const toRender = computed(() => {
    return $players.filter(item => searchInStr([item.name], search.value))
  })

  ctx.class('container').class('c-mid').class('route-players')
  ctx.nest(
    div().class('filter-wrap').class('players').nest(
      InputSearch().props({
        placeholder: 'Search players',
        label: 'Search',
        modelValue: search
      })
    ),
    div().class('route-players-container').nest(
      table().nest(
        thead(
          tr([
            th('Player'),
            th('Latest record'),
            th('Maps played'),
            th('Records'),
          ])
        ),
        // TODO (cascade) unref item
        tbody().for(toRender, (item, index) => {
          const { name, country, records, maps, latest } = item as unknown as TrackmaniaPlayer
          return tr().nest([
            td().nest([
              span(`#${index + 1}`).class('player-position'),
              Player().props({ player: name, country })
            ]),
            latest ? td().nest(
              p().class('latest-record').nest(
                strong(latest.time),
                span(latest.map_name)
              ),
              span(timeAgo(Number(`${latest.unix_date}000`)))
            ) : td(),
            td(maps),
            td(records),
          ])
        })
      ),
    )
  )
})