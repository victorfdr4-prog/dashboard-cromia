import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as currency (BRL)
 */
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

/**
 * Format percentage
 */
export const formatPercent = (value: number) => {
  return `${value.toFixed(2)}%`;
};
