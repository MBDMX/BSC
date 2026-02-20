/**
 * Utility functions for consistent number formatting across the application
 */

/**
 * Round a number to 2 decimal places
 * @param num - The number to round
 * @returns The rounded number
 */
export const roundToTwo = (num: number): number => {
    return Math.round(num * 100) / 100;
};

/**
 * Format a quantity with specified decimal places
 * @param qty - The quantity to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with fixed decimal places
 */
export const formatQuantity = (qty: number, decimals: number = 2): string => {
    return roundToTwo(qty).toFixed(decimals);
};

/**
 * Format a monetary value with 2 decimal places and currency
 * @param amount - The amount to format
 * @param currency - Currency symbol (default: 'DT')
 * @returns Formatted string with currency
 */
export const formatCurrency = (amount: number, currency: string = 'DT'): string => {
    return `${formatQuantity(amount, 2)} ${currency}`;
};

/**
 * Parse a string to a rounded number
 * @param value - String value to parse
 * @returns Rounded number or 0 if invalid
 */
export const parseRounded = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : roundToTwo(parsed);
};
