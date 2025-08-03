"use client";

import { useEffect, useRef } from 'react';

interface ScreenReaderAnnouncementsProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearOnUnmount?: boolean;
}

export function ScreenReaderAnnouncements({ 
  message, 
  priority = 'polite',
  clearOnUnmount = true 
}: ScreenReaderAnnouncementsProps) {
  const announcementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (announcementRef.current && message) {
      // Clear previous message first to ensure screen reader picks up the change
      announcementRef.current.textContent = '';
      
      // Use a small delay to ensure the clear is processed
      const timer = setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = message;
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    return () => {
      if (clearOnUnmount && announcementRef.current) {
        announcementRef.current.textContent = '';
      }
    };
  }, [clearOnUnmount]);

  return (
    <div
      ref={announcementRef}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    />
  );
}

// Hook for managing screen reader announcements
export function useScreenReaderAnnouncement() {
  const announcementRef = useRef<string>('');

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Create or update announcement element
    let announcer = document.getElementById('screen-reader-announcer');
    
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'screen-reader-announcer';
      announcer.setAttribute('aria-live', priority);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.setAttribute('role', 'status');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    }

    // Clear and set new message
    announcer.textContent = '';
    setTimeout(() => {
      if (announcer) {
        announcer.textContent = message;
        announcer.setAttribute('aria-live', priority);
      }
    }, 100);

    announcementRef.current = message;
  };

  const clear = () => {
    const announcer = document.getElementById('screen-reader-announcer');
    if (announcer) {
      announcer.textContent = '';
    }
    announcementRef.current = '';
  };

  return { announce, clear, currentMessage: announcementRef.current };
}