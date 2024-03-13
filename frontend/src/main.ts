import './style/index.scss'
import { createApp } from '@dolanske/pantry'
import RouteList from './routes/RouteList'
import type { TrackmaniaMap, TrackmaniaPlayer } from './types'
import Navigation from './components/Navigation'
import { span } from "@dolanske/cascade"
import { maps, players } from './api'

export const app = createApp({
  '/records': {
    default: true,
    component: RouteList,
    loader: () => {
      return Promise.all([
        maps.get<TrackmaniaMap[]>(),
        players.get<TrackmaniaPlayer[]>()
      ])
    },
  },
  '/stats': span('Statistics'),
  '/players': span('Players')
})

app.run('#router')

// Mount navigation outside of the router boundary so it persists between
// page navigations.
Navigation().mount("#nav")
