/**
 * Utility functions for handling template strings in translations
 */

export const interpolateTemplate = (template: string, params: Record<string, any>): string => {
  return template.replace(/\$\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() || match
  })
}

export const pluralize = (count: number, singular: string, plural?: string): string => {
  if (count === 1) {
    return singular
  }
  return plural || `${singular}s`
}

export const formatCurrency = (amount: number, currency = "$"): string => {
  return `${currency}${amount.toLocaleString()}`
}

export const formatPercentage = (value: number, decimals = 0): string => {
  return `${value.toFixed(decimals)}%`
}
