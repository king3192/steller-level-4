/**
 * Shortens / formats a Stellar public key or transaction hash to a readable format (e.g. GAAA...A123).
 * 
 * @param {string} address The full Stellar public key or transaction hash.
 * @param {number} [startChars=4] Number of characters to keep at the start.
 * @param {number} [endChars=4] Number of characters to keep at the end.
 * @returns {string} Formatted address string, or empty string.
 */
export function shortenAddress(address, startChars = 4, endChars = 4) {
  if (!address || typeof address !== 'string' || address.length < (startChars + endChars)) {
    return '';
  }
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}

/**
 * Alias for shortenAddress, used for formatting addresses and transaction hashes.
 */
export const formatAddress = shortenAddress;

/**
 * Formats a raw XLM balance string/number to exactly 7 decimal places.
 * 
 * @param {string|number} amount Raw balance amount.
 * @returns {string} Formatted XLM balance.
 */
export function formatXLM(amount) {
  const parsed = parseFloat(amount);
  if (isNaN(parsed)) {
    return '0.0000000';
  }
  return parsed.toLocaleString(undefined, {
    minimumFractionDigits: 7,
    maximumFractionDigits: 7,
  });
}
