"use client";

interface SkipToContentProps {
  targetId?: string;
  className?: string;
}

export function SkipToContent({ 
  targetId = "main-content",
  className = ""
}: SkipToContentProps) {
  const handleSkip = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      className={`sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${className}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleSkip(e);
        }
      }}
      onClick={(e) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }}
    >
      Skip to main content
    </a>
  );
}