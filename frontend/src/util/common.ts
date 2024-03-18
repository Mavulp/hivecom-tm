// Percentage value out of total
export function partialPercentage(partial: number, total: number) {
  return ((100 * partial) / total).toFixed(1);
}

export const PieOptions = {
  type: 'pie',
  options: {
    plugins: {
      legend: {
        display: false
      }
    }
  }
} as const