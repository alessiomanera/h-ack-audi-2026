import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind class names with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const pointsFormatter = new Intl.NumberFormat('it-IT')

/** 1150 -> "1.150" */
export function formatPoints(points: number): string {
  return pointsFormatter.format(points)
}

/** ISO date -> "10 ott 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}
