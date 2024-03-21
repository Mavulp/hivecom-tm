import { div, p, span, table, tr, th, td, thead, tbody, strong } from "@dolanske/cascade"
import { RouteProps, TrackmaniaPlayer } from "../types"
import Player from "../components/Player"
import { timeAgo } from "../util/time"
import { computed, ref } from "@vue/reactivity"
import { searchInStr } from "../util/search-in"
import InputSearch from "../components/form/InputSearch"
import { Link } from "@dolanske/pantry"

export default div('div').setup((ctx, props: RouteProps<TrackmaniaPlayer[]>) => {
  const $players = props.$data
  const search = ref('')
  const toRender = computed(() => {
    return $players
      .filter(item => searchInStr([item.name], search.value))
      .sort((a, b) => a.records > b.records ? -1 : 1);
  })

  ctx.class('container').class('route-players')
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
        tbody().for(toRender, (item, index) => {
          const { name, country, records, maps, latest } = item
          console.log(latest)
          return tr().nest([
            td().nest([
              span(`#${index + 1}`).class('player-position'),
              Player().props({ player: name, country })
            ]),
            latest ? td().nest(
              Link('/records',
                [
                  p().class('latest-record').nest(
                    strong(latest.time),
                    span(latest.map_name)
                  ),
                  span(timeAgo(Number(`${latest.unix_date}000`)))
                ], { hash: latest.id })
            ) : td(),
            td(maps),
            td(records),
          ])
        })
      ),
    )
  )
})