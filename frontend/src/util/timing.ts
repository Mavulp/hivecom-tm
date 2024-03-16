// Execute frequent calls with a delay
export function throttle(mainFunction: Function, delay: number) {
  let timerFlag: number | null = null;
  return (...args: any[]) => {
    if (timerFlag === null) {
      mainFunction(...args);
      timerFlag = setTimeout(() => {
        timerFlag = null;
      }, delay);
    }
  };
}

// Pause repeated execution until after delay is passes 
export function debounce(callback: Function, delay: number) {
  let timer: any
  return function () {
    clearTimeout(timer)
    timer = setTimeout(() => {
      callback();
    }, delay)
  }
}
