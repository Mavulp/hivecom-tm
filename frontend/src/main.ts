import './style/index.scss'
import { createApp } from '@dolanske/pantry'
import RouteList from './routes/RouteList'
import type { TrackmaniaMap, TrackmaniaPlayer } from './types'
import Navigation from './components/Navigation'
import { getRecords, maps, players, } from './api'
import RoutePlayers from './routes/RoutePlayers'

export const app = createApp({
  '/records': {
    default: true,
    component: RouteList,
    loader: () => {
      return Promise.all([
        getRecords(),
        maps.get<TrackmaniaMap[]>(),
        players.get<TrackmaniaPlayer[]>(),
      ])
    },
  },
  // '/stats': span('Statistics'),
  '/players': {
    component: RoutePlayers,
    loader: () => {
      return Promise.all([
        getRecords(),
        players.get<TrackmaniaPlayer[]>(),
      ])
    }
  }
})

app.run('#router')

// Mount navigation outside of the router boundary so it persists between
// page navigations.
Navigation().mount("#nav")
