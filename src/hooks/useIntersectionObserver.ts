import { useEffect, useRef, useCallback, useState } from 'react';

interface IntersectionObserverOptions {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
}

/**
 * Custom hook for lazy loading với Intersection Observer
 * Giúp chỉ render elements khi chúng xuất hiện trong viewport
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverOptions = {}
) {
  const targetRef = useRef<HTMLDivElement>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        callback();
      }
    },
    [callback]
  );

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: options.threshold || 0.1,
      root: options.root || null,
      rootMargin: options.rootMargin || '0px',
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersection, options.threshold, options.root, options.rootMargin]);

  return targetRef;
}

/**
 * Custom hook for detecting if element is visible
 */
export function useIsVisible(options: IntersectionObserverOptions = {}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: options.threshold || 0.1,
        root: options.root || null,
        rootMargin: options.rootMargin || '50px',
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options.threshold, options.root, options.rootMargin]);

  return [targetRef, isVisible] as const;
}
