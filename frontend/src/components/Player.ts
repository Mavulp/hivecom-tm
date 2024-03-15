import { reusable } from '@dolanske/cascade'

interface Props {
  player: string,
  country: string,
}

export default reusable('span', (ctx, props: Props) => {
  ctx.class('player-item')
  ctx.html(`<img src="https://flagsapi.com/${props.country.toUpperCase()}/flat/24.png"> ${props.player}`)
})