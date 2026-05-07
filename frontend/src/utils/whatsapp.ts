/**
 * WhatsApp integration utilities for Femvelle
 */

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '917609958608';
const DEFAULT_MESSAGE = "Hello Femvelle, I would like assistance with your collection.";

/**
 * Generate WhatsApp URL with prefilled message
 */
export const generateWhatsAppURL = (message: string = DEFAULT_MESSAGE): string => {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
};

/**
 * Open WhatsApp in new tab with prefilled message
 */
export const openWhatsApp = (message?: string): void => {
  const url = generateWhatsAppURL(message);
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Get formatted WhatsApp number for display
 */
export const getFormattedWhatsAppNumber = (): string => {
  // Format: +91 76099 58608
  const number = WHATSAPP_NUMBER;
  if (number.startsWith('91')) {
    return `+91 ${number.slice(2, 7)} ${number.slice(7)}`;
  }
  return `+${number}`;
};

export { WHATSAPP_NUMBER, DEFAULT_MESSAGE };