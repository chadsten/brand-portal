"use client";

import { useState, useRef, useEffect } from 'react';
import { useLazyImage } from '~/hooks/usePerformanceOptimization';

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
  blurDataURL?: string;
  quality?: number;
  priority?: boolean;
  sizes?: string;
  loading?: 'lazy' | 'eager';
}

export function LazyImage({
  src,
  alt,
  placeholder,
  className = "",
  width,
  height,
  onLoad,
  onError,
  blurDataURL,
  loading = 'lazy',
  priority = false,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const {
    ref: observerRef,
    src: lazySrc,
    isLoaded: isLazyLoaded,
    isError: isLazyError,
    isInView,
  } = useLazyImage(src, {
    threshold: 0.1,
    rootMargin: '50px',
  });

  // Combine refs
  const setRefs = (node: HTMLImageElement | null) => {
    imgRef.current = node;
    observerRef(node);
  };

  useEffect(() => {
    if (isLazyLoaded) {
      setIsLoaded(true);
      onLoad?.();
    }
  }, [isLazyLoaded, onLoad]);

  useEffect(() => {
    if (isLazyError) {
      setHasError(true);
      onError?.();
    }
  }, [isLazyError, onError]);

  // Generate placeholder based on dimensions
  const generatePlaceholder = () => {
    if (placeholder) return placeholder;
    if (blurDataURL) return blurDataURL;
    
    // Generate a simple SVG placeholder
    const w = width || 400;
    const h = height || 300;
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-family="sans-serif" font-size="14">
          Loading...
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const shouldLoad = priority || isInView;

  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-base-200 text-base-content/50 ${className}`}
        style={{ width, height }}
        role="img"
        aria-label={`Failed to load image: ${alt}`}
      >
        <div className="text-center">
          <div className="text-2xl mb-2">📷</div>
          <div className="text-sm">Image not available</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-base-200">
          <img
            src={generatePlaceholder()}
            alt=""
            className="w-full h-full object-cover opacity-50"
            aria-hidden="true"
          />
          {!shouldLoad && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse w-8 h-8 bg-base-300 rounded-full"></div>
            </div>
          )}
        </div>
      )}

      {/* Actual image */}
      {shouldLoad && (
        <img
          ref={setRefs}
          src={lazySrc}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ width, height }}
          loading={loading}
          onLoad={() => {
            setIsLoaded(true);
            onLoad?.();
          }}
          onError={() => {
            setHasError(true);
            onError?.();
          }}
        />
      )}

      {/* Loading indicator */}
      {shouldLoad && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-base-100">
          <div className="flex items-center gap-2 text-base-content/50">
            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Progressive image component with multiple quality levels
interface ProgressiveImageProps extends LazyImageProps {
  srcSet?: {
    low: string;
    medium: string;
    high: string;
  };
  autoQuality?: boolean;
}

export function ProgressiveImage({
  srcSet,
  autoQuality = true,
  ...props
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('low');

  useEffect(() => {
    if (!srcSet) {
      setCurrentSrc(props.src);
      return;
    }

    // Determine quality based on connection and device capabilities
    const getOptimalQuality = (): 'low' | 'medium' | 'high' => {
      if (!autoQuality) return 'high';

      // Check connection type
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const effectiveType = connection?.effectiveType;

        switch (effectiveType) {
          case 'slow-2g':
          case '2g':
            return 'low';
          case '3g':
            return 'medium';
          case '4g':
          default:
            return 'high';
        }
      }

      // Fallback to device memory if available
      if ('deviceMemory' in navigator) {
        const deviceMemory = (navigator as any).deviceMemory;
        if (deviceMemory < 4) return 'medium';
      }

      return 'high';
    };

    const optimalQuality = getOptimalQuality();
    setQuality(optimalQuality);
    setCurrentSrc(srcSet[optimalQuality]);

    // Progressive loading: start with low quality, then upgrade
    if (optimalQuality !== 'low') {
      // Load low quality first
      const lowImg = new Image();
      lowImg.onload = () => {
        setCurrentSrc(srcSet.low);
        
        // Then load the optimal quality
        const optimalImg = new Image();
        optimalImg.onload = () => {
          setCurrentSrc(srcSet[optimalQuality]);
        };
        optimalImg.src = srcSet[optimalQuality];
      };
      lowImg.src = srcSet.low;
    }
  }, [srcSet, autoQuality, props.src]);

  return <LazyImage {...props} src={currentSrc} />;
}

// Image gallery with lazy loading and virtualization
interface LazyImageGalleryProps {
  images: Array<{
    id: string;
    src: string;
    alt: string;
    thumbnail?: string;
    width?: number;
    height?: number;
  }>;
  onImageClick?: (image: { id: string; src: string; alt: string }) => void;
  className?: string;
  columns?: number;
  gap?: number;
}

export function LazyImageGallery({
  images,
  onImageClick,
  className = "",
  columns = 3,
  gap = 16,
}: LazyImageGalleryProps) {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap}px`,
  };

  return (
    <div className={`w-full ${className}`} style={gridStyle}>
      {images.map((image) => (
        <div
          key={image.id}
          className="relative group cursor-pointer"
          onClick={() => onImageClick?.(image)}
        >
          <LazyImage
            src={image.thumbnail || image.src}
            alt={image.alt}
            className="w-full h-48 object-cover rounded-lg transition-transform group-hover:scale-105"
            width={image.width}
            height={image.height}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                <span className="text-xl">👁️</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}