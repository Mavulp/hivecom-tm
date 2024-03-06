export interface TrackmaniaMap {
  id: number
  name: string
  named_styled: string
  author: string
  records: TrackmaniaRecord[]
}

export interface TrackmaniaRecord {
  mapId: number
  player: string
  country: string
  time: string
  date: string
  unixDate: number
}

export interface RouteProps<T> {
  [key: string]: unknown
  $data: T
  $params: Record<string, string>
}
