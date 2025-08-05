// Input sanitization utilities for XSS prevention
import * as DOMPurify from 'isomorphic-dompurify';

export interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripTags?: boolean;
}

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(
  input: string | null | undefined,
  options: SanitizationOptions = {}
): string {
  if (!input) return '';
  
  const {
    allowedTags = [],
    allowedAttributes = [],
    stripTags = true
  } = options;
  
  if (stripTags) {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  }
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes
  });
}

/**
 * Sanitize plain text content
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/data:/gi, '') // Remove data: URLs
    .trim();
}

/**
 * Sanitize user name for display
 */
export function sanitizeUserName(name: string | null | undefined): string {
  if (!name) return 'Unknown User';
  
  return sanitizeText(name).substring(0, 100); // Limit length
}

/**
 * Sanitize asset title
 */
export function sanitizeAssetTitle(title: string | null | undefined): string {
  if (!title) return 'Untitled Asset';
  
  return sanitizeText(title).substring(0, 255); // Limit length
}

/**
 * Sanitize asset description
 */
export function sanitizeAssetDescription(description: string | null | undefined): string {
  if (!description) return '';
  
  return sanitizeText(description).substring(0, 1000); // Limit length
}

/**
 * Sanitize tag content
 */
export function sanitizeTag(tag: string | null | undefined): string {
  if (!tag) return '';
  
  return sanitizeText(tag)
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '') // Only allow alphanumeric, dash, underscore
    .substring(0, 50); // Limit length
}

/**
 * Sanitize array of tags
 */
export function sanitizeTags(tags: (string | null | undefined)[]): string[] {
  if (!Array.isArray(tags)) return [];
  
  return tags
    .map(sanitizeTag)
    .filter(tag => tag.length > 0)
    .slice(0, 50); // Limit number of tags
}

/**
 * Validate and sanitize image URLs
 */
export function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  try {
    const parsedUrl = new URL(url);
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null;
    }
    
    // Remove any script-like query parameters
    const sanitizedUrl = parsedUrl.href.replace(/javascript:/gi, '');
    
    return sanitizedUrl;
  } catch {
    return null;
  }
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(fileName: string | null | undefined): string {
  if (!fileName) return 'unknown-file';
  
  return fileName
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid file name characters
    .replace(/\.\./g, '') // Remove directory traversal
    .substring(0, 255); // Limit length
}