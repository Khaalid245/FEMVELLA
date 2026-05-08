/**
 * WhatsApp integration utilities for Femvelle
 */

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '';
const DEFAULT_MESSAGE = "Hello Femvelle, I would like assistance with your collection.";

/** True only when a number is configured — use to conditionally render CTAs. */
export const isWhatsAppConfigured = (): boolean => WHATSAPP_NUMBER.length > 0;

/**
 * Generate WhatsApp URL with prefilled message.
 * Returns null when no number is configured so callers can skip rendering.
 */
export const generateWhatsAppURL = (message: string = DEFAULT_MESSAGE): string | null => {
  if (!isWhatsAppConfigured()) return null;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

/**
 * Open WhatsApp in new tab with prefilled message.
 * No-op when number is not configured.
 */
export const openWhatsApp = (message?: string): void => {
  const url = generateWhatsAppURL(message);
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Get formatted WhatsApp number for display.
 * Returns empty string when not configured.
 */
export const getFormattedWhatsAppNumber = (): string => {
  if (!isWhatsAppConfigured()) return '';
  if (WHATSAPP_NUMBER.startsWith('91') && WHATSAPP_NUMBER.length === 12) {
    return `+91 ${WHATSAPP_NUMBER.slice(2, 7)} ${WHATSAPP_NUMBER.slice(7)}`;
  }
  return `+${WHATSAPP_NUMBER}`;
};

export { WHATSAPP_NUMBER, DEFAULT_MESSAGE };