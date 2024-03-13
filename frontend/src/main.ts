import './style/index.scss'
import { createApp } from '@dolanske/pantry'
import RouteList from './routes/RouteList'
import type { TrackmaniaMap } from './types'
import Navigation from './components/Navigation'
import { $ } from "@dolanske/cascade"
import { maps } from './api'

export const app = createApp({
  '/records': {
    default: true,
    component: RouteList,
    loader: () => maps.get<TrackmaniaMap[]>(),
  },
  '/stats': $.span('Statistics'),
  '/players': $.span('Players')
})

app.run('#router')

// Mount navigation outside of the router boundary so it persists between
// page navigations.
Navigation().mount("#nav")
