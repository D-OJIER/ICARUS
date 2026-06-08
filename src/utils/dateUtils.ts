/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Safely converts a Date object to local YYYY-MM-DD string without timezone shifting.
 */
export function getLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns today's date formatted as local YYYY-MM-DD.
 */
export function getTodayLocalDateString(): string {
  return getLocalDateString(new Date());
}
