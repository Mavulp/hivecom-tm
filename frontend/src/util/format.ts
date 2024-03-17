export function pad(number: number) {
  return number < 10 ? `0${number}` : `${number}`
}

// Convert timestampts in MM:SS.SSS to milliseconds
export function convertTimeToMs(timestamp: string) {
  const [minutes, rest] = timestamp.split(':')
  const [seconds, milliseconds] = rest.split('.')

  let time = Number(milliseconds)
  time += Number(seconds) * 1000
  time += Number(minutes) * 60 * 1000
  return time
}