import React, { useState, useRef, useEffect } from 'react';
import { Skeleton } from './skeleton';

interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, hasLoaded]);

  const defaultFallback = (
    <div className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );

  return (
    <div ref={elementRef} className={className}>
      {isVisible ? children : (fallback || defaultFallback)}
    </div>
  );
};

// Hook for image lazy loading
export const useLazyImage = (src: string) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.unobserve(img);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(img);

    return () => {
      observer.unobserve(img);
    };
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    setIsError(false);
  };

  const handleError = () => {
    setIsError(true);
    setIsLoaded(false);
  };

  return {
    imgRef,
    imageSrc,
    isLoaded,
    isError,
    handleLoad,
    handleError,
  };
};

// Lazy image component
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  placeholder?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  fallback,
  placeholder,
  className,
  ...props
}) => {
  const { imgRef, imageSrc, isLoaded, isError, handleLoad, handleError } = useLazyImage(src);

  if (isError) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        {fallback || <span className="text-muted-foreground text-sm">Failed to load</span>}
      </div>
    );
  }

  return (
    <div className="relative">
      <img
        ref={imgRef}
        src={imageSrc || placeholder || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
        alt={alt}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      {!isLoaded && imageSrc && (
        <div className={`absolute inset-0 bg-muted animate-pulse ${className}`} />
      )}
    </div>
  );
};