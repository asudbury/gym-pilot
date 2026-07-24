import { createElement, type ReactNode } from 'react'

export type QuickLink = {
  id: string
  label: string
  path: string
  folder?: string
}

export type HomeFilters = {
  searchTerm: string
  selectedCategory: string | null
  showImages: boolean
}

export function normalizeHomeFilters(
  filters: Partial<HomeFilters> | null | undefined,
): HomeFilters {
  const selectedCategory = filters?.selectedCategory

  return {
    searchTerm:
      typeof filters?.searchTerm === 'string' ? filters.searchTerm : '',
    selectedCategory:
      selectedCategory === null ||
      selectedCategory === '' ||
      selectedCategory === 'All'
        ? null
        : typeof selectedCategory === 'string'
          ? selectedCategory
          : null,
    showImages:
      typeof filters?.showImages === 'boolean' ? filters.showImages : true,
  }
}

export function formatDashboardTimestamp(value?: string | null) {
  if (!value) {
    return null
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  const now = new Date()
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  )
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const startOfSevenDaysAgo = new Date(startOfToday)
  startOfSevenDaysAgo.setDate(startOfSevenDaysAgo.getDate() - 6)

  const formattedTime = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsedDate)

  if (parsedDate >= startOfToday) {
    return `Today, ${formattedTime}`
  }

  if (parsedDate >= startOfYesterday) {
    return `Yesterday, ${formattedTime}`
  }

  if (parsedDate >= startOfSevenDaysAgo) {
    const dayDifference = Math.floor(
      (startOfToday.getTime() - parsedDate.getTime()) / (24 * 60 * 60 * 1000),
    )
    return `${dayDifference} days ago`
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate)
}

export function renderDashboardTimestamp(
  value?: string | null,
  className = 'font-semibold text-slate-900 dark:text-slate-100',
): ReactNode {
  const formattedTimestamp = formatDashboardTimestamp(value)

  if (!formattedTimestamp) {
    return null
  }

  if (formattedTimestamp.startsWith('Today,')) {
    return createElement('span', { className }, formattedTimestamp)
  }

  return formattedTimestamp
}

export function getHashHomeUrl(
  locationHref = typeof window !== 'undefined'
    ? window.location.href
    : 'http://localhost/',
) {
  const targetUrl = new URL(
    locationHref,
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost/',
  )
  targetUrl.hash = '#/'
  return targetUrl.toString()
}
