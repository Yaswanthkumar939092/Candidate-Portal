'use client';

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { RefreshCw, ArrowDown, Check } from 'lucide-react';
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
  maxDistance?: number;
  className?: string;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
  successText?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
  maxDistance = 120,
  className,
  refreshingText = "Refreshing...",
  pullText = "Pull to refresh",
  releaseText = "Release to refresh",
  successText = "Refreshed!"
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'pulling' | 'ready' | 'refreshing' | 'success'>('idle');
  const [startY, setStartY] = useState(0);
  const [canPull, setCanPull] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if user is at the top of the scrollable area
  const checkScrollPosition = useCallback(() => {
    if (contentRef.current) {
      const scrollTop = contentRef.current.scrollTop || window.pageYOffset || document.documentElement.scrollTop;
      setCanPull(scrollTop <= 0);
    }
  }, []);

  useEffect(() => {
    checkScrollPosition();

    const handleScroll = () => checkScrollPosition();

    // Listen to scroll events on the content container or window
    if (contentRef.current) {
      contentRef.current.addEventListener('scroll', handleScroll);
    } else {
      window.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (contentRef.current) {
        contentRef.current.removeEventListener('scroll', handleScroll);
      } else {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, [checkScrollPosition]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || !canPull || isRefreshing) return;

    const touch = e.touches[0];
    setStartY(touch.clientY);
    setRefreshStatus('pulling');
  }, [disabled, canPull, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || !canPull || isRefreshing || refreshStatus === 'idle') return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - startY;

    if (deltaY > 0) {
      // Prevent default scrolling when pulling down
      e.preventDefault();

      // Calculate pull distance with resistance
      const resistance = Math.max(0, 1 - (deltaY / maxDistance) * 0.5);
      const distance = Math.min(deltaY * resistance, maxDistance);

      setPullDistance(distance);

      if (distance >= threshold) {
        setRefreshStatus('ready');
        // Haptic feedback if available
        if ('vibrate' in navigator && refreshStatus !== 'ready') {
          navigator.vibrate(50);
        }
      } else {
        setRefreshStatus('pulling');
      }
    }
  }, [disabled, canPull, isRefreshing, refreshStatus, startY, threshold, maxDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || !canPull || isRefreshing) return;

    if (refreshStatus === 'ready') {
      setIsRefreshing(true);
      setRefreshStatus('refreshing');
      setPullDistance(threshold); // Keep it at threshold during refresh

      try {
        await onRefresh();
        setRefreshStatus('success');

        // Show success state briefly
        setTimeout(() => {
          setRefreshStatus('idle');
          setPullDistance(0);
          setIsRefreshing(false);
        }, 1000);
      } catch (error) {
        console.error('Refresh failed:', error);
        setRefreshStatus('idle');
        setPullDistance(0);
        setIsRefreshing(false);
      }
    } else {
      // Reset if not ready
      setRefreshStatus('idle');
      setPullDistance(0);
    }
  }, [disabled, canPull, isRefreshing, refreshStatus, threshold, onRefresh]);

  // Add event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const getRefreshIndicator = () => {
    const progress = Math.min(pullDistance / threshold, 1);

    switch (refreshStatus) {
      case 'pulling':
        return (
          <div className="flex flex-col items-center">
            <ArrowDown
              className={cn(
                "w-6 h-6 text-gray-400 transition-transform duration-200",
                progress > 0.8 && "rotate-180"
              )}
              style={{ transform: `rotate(${progress * 180}deg)` }}
            />
            <span className="text-sm text-gray-600 mt-1">{pullText}</span>
          </div>
        );

      case 'ready':
        return (
          <div className="flex flex-col items-center">
            <ArrowDown className="w-6 h-6 text-[#1993e5] rotate-180" />
            <span className="text-sm text-[#1993e5] mt-1 font-medium">{releaseText}</span>
          </div>
        );

      case 'refreshing':
        return (
          <div className="flex flex-col items-center">
            <RefreshCw className="w-6 h-6 text-[#1993e5] animate-spin" />
            <span className="text-sm text-[#1993e5] mt-1 font-medium">{refreshingText}</span>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center">
            <Check className="w-6 h-6 text-green-600" />
            <span className="text-sm text-green-600 mt-1 font-medium">{successText}</span>
          </div>
        );

      default:
        return null;
    }
  };

  const refreshIndicatorOpacity = Math.min(pullDistance / 50, 1);
  const refreshIndicatorScale = Math.min(0.8 + (pullDistance / threshold) * 0.2, 1);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      style={{ height: '100%' }}
    >
      {/* Refresh Indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 ease-out",
          "bg-gray-50 border-b"
        )}
        style={{
          height: `${Math.max(pullDistance, isRefreshing ? threshold : 0)}px`,
          opacity: refreshIndicatorOpacity,
          transform: `scale(${refreshIndicatorScale})`
        }}
      >
        {getRefreshIndicator()}
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${pullDistance}px)`,
          height: '100%',
          overflow: 'auto'
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Hook for programmatic refresh
export function usePullToRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async (refreshFn: () => Promise<void>) => {
    setIsRefreshing(true);
    try {
      await refreshFn();
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return { isRefreshing, refresh };
}

// Example usage component
export function PullToRefreshExample() {
  const [items, setItems] = useState([
    'Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5',
    'Item 6', 'Item 7', 'Item 8', 'Item 9', 'Item 10'
  ]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleRefresh = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Add new items to the top
    const newItems = [
      `New Item ${Date.now()}`,
      `Fresh Item ${Date.now() + 1}`,
      ...items.slice(0, 8) // Keep only first 8 old items
    ];

    setItems(newItems);
    setLastRefresh(new Date());
  };

  return (
    <div className="h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-4">
        <h1 className="text-xl font-bold">Pull to Refresh Demo</h1>
        <p className="text-sm text-gray-600">
          Pull down at the top to refresh the list
        </p>
        {lastRefresh && (
          <p className="text-xs text-gray-500 mt-1">
            Last refreshed: {lastRefresh.toLocaleTimeString()}
          </p>
        )}
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 space-y-3">
          {items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="p-4 bg-white rounded-lg shadow-sm border flex items-center justify-between"
            >
              <span className="font-medium">{item}</span>
              <span className="text-sm text-gray-500">#{index + 1}</span>
            </div>
          ))}

          {/* Add some extra content for scrolling */}
          <div className="pt-8 pb-4 text-center text-gray-500">
            <p className="text-sm">End of list</p>
          </div>
        </div>
      </PullToRefresh>
    </div>
  );
}

// Mobile-specific wrapper that only enables on touch devices
export function MobilePullToRefresh(props: PullToRefreshProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check if device supports touch
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  if (!isTouchDevice) {
    // On non-touch devices, just render children without pull-to-refresh
    return <div className={props.className}>{props.children}</div>;
  }

  return <PullToRefresh {...props} />;
}