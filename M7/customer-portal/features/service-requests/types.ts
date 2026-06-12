export interface StatRing {
  label: string
  value: string
  unit: string
  progress: number
  color: string
}

export interface StatusItem {
  label: string
  count: number
  done: boolean
  color: string
}
