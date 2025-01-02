import type { TrackmaniaRecord } from './types'
import { eru } from '@dolanske/eru'

const api = eru('https://records.hivecom.net/api')

export const maps = api.route('/maps')
export const players = api.route('/players')

export async function getRecords() {
  const DAYS = 1.5
  const since = Math.floor(Date.now() / 1000) - (86400 * DAYS)
  const r = await api
    .route(`/records?since=${since}`)
    .get<TrackmaniaRecord[]>()
  return r.map(a => a.mapId)
}

export const FETCH_INTERVAL = 150000
export const country = eru('https://restcountries.com/v3.1/name').route('/')
