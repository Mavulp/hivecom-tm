import type { TrackmaniaMap, TrackmaniaPlayer } from './types'
import { createApp } from '@dolanske/pantry'
import { getRecords, maps, players } from './api'
import Navigation from './components/Navigation'
import RouteList from './routes/RouteList'
import RoutePlayers from './routes/RoutePlayers'
import RouteStats from './routes/RouteStats'
import './style/index.scss'

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
  '/stats': {
    component: RouteStats,
    loader: () => {
      return Promise.all([
        maps.get<TrackmaniaMap[]>(),
        players.get<TrackmaniaPlayer[]>(),
      ])
    },
  },
  '/players': {
    component: RoutePlayers,
    loader: () => players.get<TrackmaniaPlayer[]>(),
  },
})

app.run('#router')

// Mount navigation outside of the router boundary so it persists between
// page navigations.
Navigation().mount('#nav')
