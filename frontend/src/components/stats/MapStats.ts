import { TrackmaniaMap } from "../../types";
import { div, ul, li, strong, span } from "@dolanske/cascade"
import { convertTimeToMs } from "../../util/format";

function Cell(title: string, value: string | number) {
  return li().nest(
    strong(title),
    span(value)
  )
}

// TODO
// top 5 / 10 most played maps (based on records)

// TODO
// Longest map

// TODO 
// Shortest map

// TODO
// Longest map name

// TODO
// Craziest name (just based on how long name_styled is)

export default function ProcessMaps(data: TrackmaniaMap[]) {
  data = data.splice(0, 3)
  // Datasets
  const totalMaps = data.length
  // @ts-expect-error This will run in stable node 21
  const environments = Object.groupBy(data, ({ environment }) => environment)

  // const sortedByRecords = data.sort((a, b) => a.records.length > b.records.length ? -1 : 1)
  const sortedByTime = data.sort((a, b) => {
    const aVg = a.records.reduce((num, item) => num += convertTimeToMs(item.time), 0) / a.records.length
    const bVg = b.records.reduce((num, item) => num += convertTimeToMs(item.time), 0) / b.records.length
    return aVg > bVg ? 1 : -1
  })
  // const sortedByNameLength = data.sort((a, b) => a.name.length > b.name.length ? -1 : 1)
  // const sortedByStyledName = data.sort((a, b) => a.name_styled.length > b.name_styled.length ? -1 : 1)

  const longestMap = sortedByTime[0]
  const shortestMap = sortedByTime.at(-1) as TrackmaniaMap

  return div().class('maps-wrapper').nest(
    div().class('top-level-stats').nest(
      ul().nest(
        Cell('Maps', totalMaps),
        Cell('Shortest map', shortestMap.name),
        Cell('Longest map', longestMap.name)

      )
    )
  )
}