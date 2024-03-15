export function debounce(callback: Function, delay: number) {
  let timer: any
  return function () {
    clearTimeout(timer)
    timer = setTimeout(() => {
      callback();
    }, delay)
  }
}