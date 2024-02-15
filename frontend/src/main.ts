import { eru } from '@dolanske/eru'
import './style.css'
import { createApp } from '@dolanske/pantry'
import RouteList from './routes/RouteList'
import type { TrackmaniaMap } from './types'

// import RouteMapDetail from './routes/RouteMapDetail'

export const maps = eru('https://records.hivecom.net/api/maps').route('/')

export const app = createApp({
  '/': {
    component: RouteList,
    loader: () => maps.get<TrackmaniaMap[]>(),
  },
  // '/map/:id': {
  //   loader: ({ id }) => maps.get<TrackmaniaMap>(id),
  //   component: RouteMapDetail,
  // },
})

app.run('#app')
