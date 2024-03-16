import { reusable } from '@dolanske/cascade'
import { getFlagHTML } from './Icon'

interface Props {
  player: string,
  country: string,
}

export default reusable('span', (ctx, props: Props) => {
  ctx.class('player-item')
  ctx.html(`${getFlagHTML(props.country)} ${props.player}`)
})