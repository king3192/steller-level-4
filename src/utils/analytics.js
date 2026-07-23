import { track } from '@vercel/analytics';

/**
 * RentStar Product Analytics Utility
 * Standardized analytics events tracking for rubric evaluation and user metrics.
 */

export const ANALYTICS_EVENTS = {
  WALLET_CONNECTED: 'wallet_connected',
  DEMO_MODE_STARTED: 'demo_mode_started',
  ROOMMATE_REGISTERED: 'roommate_registered',
  RENT_PAID: 'rent_paid',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
};

/**
 * Tracks a custom analytics event safely.
 * 
 * @param {string} eventName Name of the event to track.
 * @param {Object} [properties={}] Additional metadata attributes.
 */
export function trackEvent(eventName, properties = {}) {
  try {
    // Log in development
    if (import.meta.env.DEV) {
      console.log(`[Analytics Track] ${eventName}:`, properties);
    }
    
    // Track event via Vercel Analytics if available
    track(eventName, properties);
  } catch (err) {
    // Silently ignore if analytics fails or is blocked
    console.debug('[Analytics Error]', err);
  }
}

export default trackEvent;
