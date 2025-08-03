"use client";

import { type ReactNode } from "react";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
}

export function ResponsiveContainer({
  children,
  className = "",
  maxWidth = "full",
  padding = "md",
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  };

  const paddingClasses = {
    none: "",
    sm: "px-2 py-2 sm:px-4 sm:py-4",
    md: "px-4 py-4 sm:px-6 sm:py-6",
    lg: "px-6 py-6 sm:px-8 sm:py-8",
  };

  return (
    <div 
      className={`
        mx-auto w-full
        ${maxWidthClasses[maxWidth]}
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface GridContainerProps {
  children: ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number; 
    desktop?: number;
    large?: number;
  };
  gap?: "sm" | "md" | "lg";
  className?: string;
}

export function GridContainer({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3, large: 4 },
  gap = "md",
  className = "",
}: GridContainerProps) {
  const gapClasses = {
    sm: "gap-2",
    md: "gap-4", 
    lg: "gap-6",
  };

  const gridClasses = `
    grid
    grid-cols-${columns.mobile || 1}
    ${columns.tablet ? `md:grid-cols-${columns.tablet}` : ""}
    ${columns.desktop ? `lg:grid-cols-${columns.desktop}` : ""}
    ${columns.large ? `xl:grid-cols-${columns.large}` : ""}
    ${gapClasses[gap]}
  `;

  return (
    <div className={`${gridClasses} ${className}`}>
      {children}
    </div>
  );
}

interface FlexContainerProps {
  children: ReactNode;
  direction?: "row" | "col";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
  gap?: "sm" | "md" | "lg";
  className?: string;
  responsive?: {
    mobile?: Partial<Pick<FlexContainerProps, "direction" | "align" | "justify">>;
    tablet?: Partial<Pick<FlexContainerProps, "direction" | "align" | "justify">>;
    desktop?: Partial<Pick<FlexContainerProps, "direction" | "align" | "justify">>;
  };
}

export function FlexContainer({
  children,
  direction = "row",
  align = "start",
  justify = "start", 
  wrap = false,
  gap = "md",
  className = "",
  responsive,
}: FlexContainerProps) {
  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6", 
  };

  const directionClasses = {
    row: "flex-row",
    col: "flex-col",
  };

  const alignClasses = {
    start: "items-start",
    center: "items-center", 
    end: "items-end",
    stretch: "items-stretch",
  };

  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end", 
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  };

  const responsiveClasses = responsive ? [
    responsive.mobile?.direction && `${directionClasses[responsive.mobile.direction]}`,
    responsive.mobile?.align && `${alignClasses[responsive.mobile.align]}`,
    responsive.mobile?.justify && `${justifyClasses[responsive.mobile.justify]}`,
    responsive.tablet?.direction && `md:${directionClasses[responsive.tablet.direction]}`,
    responsive.tablet?.align && `md:${alignClasses[responsive.tablet.align]}`,
    responsive.tablet?.justify && `md:${justifyClasses[responsive.tablet.justify]}`,
    responsive.desktop?.direction && `lg:${directionClasses[responsive.desktop.direction]}`,
    responsive.desktop?.align && `lg:${alignClasses[responsive.desktop.align]}`, 
    responsive.desktop?.justify && `lg:${justifyClasses[responsive.desktop.justify]}`,
  ].filter(Boolean).join(" ") : "";

  const flexClasses = `
    flex
    ${!responsive ? directionClasses[direction] : ""}
    ${!responsive ? alignClasses[align] : ""}
    ${!responsive ? justifyClasses[justify] : ""}
    ${wrap ? "flex-wrap" : ""}
    ${gapClasses[gap]}
    ${responsiveClasses}
  `;

  return (
    <div className={`${flexClasses} ${className}`}>
      {children}
    </div>
  );
}

// Responsive utilities
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  large: 1280,
} as const;

export function useResponsive() {
  // In a real implementation, this would use window.matchMedia
  // For SSR compatibility, we'd need proper hydration handling
  return {
    isMobile: false,
    isTablet: false, 
    isDesktop: true,
    isLarge: true,
  };
}