// Execute frequent calls with a delay
export function throttle(mainFunction: Function, delay: number) {
  let timerFlag: number | null = null
  return (...args: any[]) => {
    if (timerFlag === null) {
      mainFunction(...args)
      timerFlag = setTimeout(() => {
        timerFlag = null
      }, delay)
    }
  }
}
