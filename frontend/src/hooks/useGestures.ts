import { useState, useEffect, useCallback, RefObject } from 'react';

// Touch gesture detection hook
export interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
  velocity: number;
}

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number;
  minSwipeVelocity?: number;
  preventDefaultTouchmove?: boolean;
}

export const useSwipeGesture = (
  elementRef: RefObject<HTMLElement>,
  options: UseSwipeGestureOptions = {}
) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance = 50,
    minSwipeVelocity = 0.3,
    preventDefaultTouchmove = false
  } = options;

  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number; time: number } | null>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.targetTouches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
    setTouchEnd(null);
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (preventDefaultTouchmove) {
      e.preventDefault();
    }
    const touch = e.targetTouches[0];
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
  }, [preventDefaultTouchmove]);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const deltaTime = touchEnd.time - touchStart.time;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;

    if (distance < minSwipeDistance || velocity < minSwipeVelocity) return;

    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

    if (isHorizontal) {
      if (deltaX > 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    } else {
      if (deltaY > 0) {
        onSwipeUp?.();
      } else {
        onSwipeDown?.();
      }
    }
  }, [touchStart, touchEnd, minSwipeDistance, minSwipeVelocity, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: !preventDefaultTouchmove });
    element.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
    };
  }, [elementRef, onTouchStart, onTouchMove, onTouchEnd, preventDefaultTouchmove]);

  return {
    touchStart,
    touchEnd,
    isSwipeInProgress: touchStart !== null && touchEnd !== null
  };
};

// Long press gesture hook
interface UseLongPressOptions {
  onLongPress: () => void;
  delay?: number;
  shouldPreventDefault?: boolean;
}

export const useLongPress = (options: UseLongPressOptions) => {
  const { onLongPress, delay = 500, shouldPreventDefault = true } = options;
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [timeout, setTimeout] = useState<NodeJS.Timeout | null>(null);
  const [target, setTarget] = useState<EventTarget | null>(null);

  const start = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (shouldPreventDefault && event.target) {
      event.target.addEventListener('touchend', preventDefault, { passive: false });
      event.target.addEventListener('click', preventDefault, { passive: false });
    }
    setTarget(event.target);
    const newTimeout = global.setTimeout(() => {
      onLongPress();
      setLongPressTriggered(true);
    }, delay);
    setTimeout(newTimeout);
  }, [onLongPress, delay, shouldPreventDefault]);

  const clear = useCallback((event: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
    if (timeout) {
      global.clearTimeout(timeout);
      setTimeout(null);
    }
    if (target && shouldPreventDefault) {
      target.removeEventListener('touchend', preventDefault);
      target.removeEventListener('click', preventDefault);
    }
    if (shouldTriggerClick && !longPressTriggered) {
      // Handle normal click
    }
    setLongPressTriggered(false);
    setTarget(null);
  }, [timeout, target, shouldPreventDefault, longPressTriggered]);

  const preventDefault = (event: Event) => {
    if (!event.defaultPrevented) {
      event.preventDefault();
    }
  };

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchEnd: (e: React.TouchEvent) => clear(e)
  };
};

// Pull to refresh hook
interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
}

export const usePullToRefresh = (
  elementRef: RefObject<HTMLElement>,
  options: UsePullToRefreshOptions
) => {
  const { onRefresh, threshold = 80, resistance = 2.5 } = options;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (elementRef.current?.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    }
  }, [elementRef]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startY === 0 || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;

    if (deltaY > 0 && elementRef.current?.scrollTop === 0) {
      e.preventDefault();
      const distance = Math.min(deltaY / resistance, threshold * 1.5);
      setPullDistance(distance);
    }
  }, [startY, isRefreshing, resistance, threshold, elementRef]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    setStartY(0);
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isRefreshing,
    pullDistance,
    isPulling: pullDistance > 0
  };
};

// Pinch to zoom hook
interface UsePinchZoomOptions {
  onZoom?: (scale: number) => void;
  minScale?: number;
  maxScale?: number;
  step?: number;
}

export const usePinchZoom = (
  elementRef: RefObject<HTMLElement>,
  options: UsePinchZoomOptions = {}
) => {
  const { onZoom, minScale = 0.5, maxScale = 3, step = 0.1 } = options;
  const [scale, setScale] = useState(1);
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);

  const getDistance = (touches: TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      setInitialDistance(getDistance(e.touches));
      setInitialScale(scale);
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && initialDistance > 0) {
      e.preventDefault();
      const currentDistance = getDistance(e.touches);
      const scaleChange = currentDistance / initialDistance;
      const newScale = Math.min(Math.max(initialScale * scaleChange, minScale), maxScale);
      
      setScale(newScale);
      onZoom?.(newScale);
    }
  }, [initialDistance, initialScale, minScale, maxScale, onZoom]);

  const handleTouchEnd = useCallback(() => {
    setInitialDistance(0);
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const zoomIn = useCallback(() => {
    const newScale = Math.min(scale + step, maxScale);
    setScale(newScale);
    onZoom?.(newScale);
  }, [scale, step, maxScale, onZoom]);

  const zoomOut = useCallback(() => {
    const newScale = Math.max(scale - step, minScale);
    setScale(newScale);
    onZoom?.(newScale);
  }, [scale, step, minScale, onZoom]);

  const resetZoom = useCallback(() => {
    setScale(1);
    onZoom?.(1);
  }, [onZoom]);

  return {
    scale,
    zoomIn,
    zoomOut,
    resetZoom
  };
};

// Haptic feedback utility
export const hapticFeedback = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30]);
    }
  },
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 5, 10]);
    }
  },
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 25, 50, 25, 50]);
    }
  }
};

// Touch target size validation
export const validateTouchTarget = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  const minSize = 44; // iOS HIG minimum touch target size
  return rect.width >= minSize && rect.height >= minSize;
};

// Safe area utilities for devices with notches
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0')
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);

    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
};