/**
 * Performance monitoring utilities for React Native
 */

import { useEffect, useRef } from 'react';

/**
 * Hook to detect excessive re-renders in development
 * @param componentName - Name of the component to monitor
 * @param threshold - Maximum allowed renders per second (default: 5)
 */
export function useRenderMonitor(componentName: string, threshold = 5) {
  const renderCount = useRef(0);
  const lastReset = useRef(Date.now());

  if (__DEV__) {
    renderCount.current++;
    
    const now = Date.now();
    const elapsed = now - lastReset.current;
    
    // Check every second
    if (elapsed >= 1000) {
      const rendersPerSecond = renderCount.current;
      
      if (rendersPerSecond > threshold) {
        console.warn(
          `⚠️ [Performance] ${componentName} rendered ${rendersPerSecond} times in 1 second (threshold: ${threshold})`
        );
      }
      
      renderCount.current = 0;
      lastReset.current = now;
    }
  }
}

/**
 * Debounce function to limit execution frequency
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution rate
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Log component mount/unmount in development
 */
export function useComponentLifecycle(componentName: string) {
  useEffect(() => {
    if (__DEV__) {
      console.log(`✅ [Lifecycle] ${componentName} mounted`);
    }
    
    return () => {
      if (__DEV__) {
        console.log(`❌ [Lifecycle] ${componentName} unmounted`);
      }
    };
  }, [componentName]);
}
