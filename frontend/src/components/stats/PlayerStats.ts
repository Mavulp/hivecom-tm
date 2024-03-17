import { Country, getCountry } from "../../countries";
import { TrackmaniaPlayer } from "../../types";
import { ul, li, div, span, strong, canvas, i } from "@dolanske/cascade"
import { getFlagHTML } from "../Icon";
import Chart from 'chart.js/auto'
import { partialPercentage } from "../../util/common";
import InputSelect from "../form/InputSelect";
import { computed, ref } from "@vue/reactivity";
import { watch, watchEffect } from "@vue-reactivity/watch";

type CountryStats = Record<string, {
  country: Country,
  records: number
  players: TrackmaniaPlayer[]
}>

// TODO implement switching of what you're sorting on (players, records)

export default function ProcessPlayers(data: TrackmaniaPlayer[]) {
  // Sorting and rendering
  const sortingOptions = ['Players', 'Records'] as const
  const sortingOn = ref<'Players' | 'Records'>(sortingOptions[0])
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
  const countriesSorted = computed(() => Object
    .values(countriesRaw)
    .filter((item) => item.country)
    .sort((a, b) => {
      if (sortingOn.value === 'Players') {
        return a.players.length > b.players.length ? -1 : 1
      }
      return a.records > b.records ? -1 : 1
    })
  )
  // Summed up totals from the dataset
  const total = computed(() => {
    return countriesSorted.value.reduce((group, item) => {
      group.players += item.players.length
      group.records += item.records
      return group
    }, { records: 0, players: 0 })
  })

  return div().class('split-wrapper').nest(
    div(
      canvas().id('player-chart').setup((ctx) => {
        let chart: Chart<'pie'> | undefined;
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
                labels: countriesSorted.value.map(item => item.country.name),
                datasets: [{
                  label: 'Players',
                  data: countriesSorted.value.map(item => item.players.length)
                }]
              }
            }
          )
        })

        // Update chart when datasets change
        watch(sortingOn, (on) => {
          if (chart) {
            if (on === 'Players') {
              chart.data = {
                labels: countriesSorted.value.map(item => item.country.name),
                datasets: [{
                  label: 'Players',
                  data: countriesSorted.value.map(item => item.players.length)
                }]
              }
            } else {
              chart.data = {
                labels: countriesSorted.value.map(item => item.country.name),
                datasets: [{
                  label: 'Records',
                  data: countriesSorted.value.map(item => item.records)
                }]
              }
            }

            console.log(chart.data)
            chart.update()
          }
        })
      })
    ).class('chart-wrap'),
    // @ts-expect-error will be fixed with Cascade unref
    ul().class('player-stats').for(countriesSorted, (country: CountryStats[string], index) => {
      return li().nest(
        div().class('title').nest(
          i(`#${index + 1}`),
          span().html(getFlagHTML(country.country.code, 32)),
          span(country.country.name)
        ),
        div().class('numbers').nest(
          div().nest(
            span('Players'),
            strong(`${country.players.length} (${partialPercentage(country.players.length, total.value.players)}%)`)
          ),
          div().nest(
            span('Records'),
            strong(`${country.records} (${partialPercentage(country.records, total.value.records)}%)`)
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