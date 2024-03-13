export interface TrackmaniaMap {
  id: number
  name: string
  name_styled: string
  author: string
  records: TrackmaniaRecord[]
  environment: string
}

export interface TrackmaniaRecord {
  mapId: number
  player: string
  country: string
  time: string
  date: string
  unixDate: number
}

export interface TrackmaniaPlayer {
  name: string,
  country: string,
  maps: number,
  records: number,
  // TODO
  latest: {},
}

export interface RouteProps<T> {
  [key: string]: unknown
  $data: T
  $params: Record<string, string>
}
