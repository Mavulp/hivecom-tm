import { Country, getCountry } from "../../countries";
import { TrackmaniaPlayer } from "../../types";
import { ul, li, div, span, strong, canvas } from "@dolanske/cascade"
import { getFlagHTML } from "../Icon";
import Chart from 'chart.js/auto'
import { partialPercentage } from "../../util/common";
import InputSelect from "../form/InputSelect";
import { ref } from "@vue/reactivity";

type CountryStats = Record<string, {
  country: Country,
  records: number
  players: TrackmaniaPlayer[]
}>

// TODO implement switching of what you're sorting on (players, records)

export default function ProcessPlayers(data: TrackmaniaPlayer[]) {
  // Sorting and rendering
  const sortingOptions = ['Players', 'Records']
  const sortingOn = ref(sortingOptions[0])
  //

  const countriesRaw = data.reduce<CountryStats>((group, item) => {
    if (group[item.country]) {
      group[item.country].players.push(item)
      group[item.country].records += item.records
    } else {
      group[item.country] = {
        country: getCountry(item.country.toUpperCase() as any),
        records: item.records,
        players: [item]
      }
    }
    return group
  }, {})

  // Sort dataset and remove invalid countries
  const countriesSorted = Object
    .values(countriesRaw)
    .filter((item) => item.country)
    .sort((a, b) => a.players.length > b.players.length ? -1 : 1)

  // Summed up totals from the dataset
  const total = countriesSorted.reduce((group, item) => {
    group.players += item.players.length
    group.records += item.records
    return group
  }, { records: 0, players: 0 })

  return div().class('split-wrapper').nest(
    div(
      canvas().id('player-chart').setup((ctx) => {
        let chart;
        ctx.onMount(() => {
          chart = new Chart(
            ctx.el as HTMLCanvasElement,
            {
              type: 'pie',
              options: {
                plugins: {
                  legend: {
                    display: false
                  }
                }
              },
              data: {
                labels: countriesSorted.map(item => item.country.name),
                datasets: [{
                  label: 'Players',
                  data: countriesSorted.map(item => item.players.length)
                }]
              }
            }
          )
        })
      })
    ).class('chart-wrap'),
    ul().class('player-stats').for(countriesSorted, (country) => {
      return li().nest(
        div().class('title').nest(
          span().html(getFlagHTML(country.country.code, 32)),
          span(country.country.name)
        ),
        div().class('numbers').nest(
          div().nest(
            span('Players'),
            strong(`${country.players.length} (${partialPercentage(country.players.length, total.players)}%)`)
          ),
          div().nest(
            span('Records'),
            strong(`${country.records} (${partialPercentage(country.records, total.records)}%)`)
          )
        )
      )
    }),
    InputSelect().style('width', '116px').props({
      placeholder: 'Sorting on',
      options: sortingOptions,
      modelValue: sortingOn,
      single: true,
      showSelected: true,
    }).attr('data-title-left', 'Sort by')
  )
}