import { useEffect, useRef, useCallback } from 'react';

const useIdleTimer = ({ timeout = 15 * 60 * 1000, onIdle, isEnabled = true }) => {
  const timeoutRef = useRef(null);
  const onIdleRef = useRef(onIdle);

  // Update the callback ref when onIdle changes
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  const resetTimer = useCallback(() => {
    if (!isEnabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onIdleRef.current?.();
    }, timeout);
  }, [timeout, isEnabled]);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      clearTimer();
      return;
    }

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    const resetTimerOnActivity = () => {
      resetTimer();
    };

    // Start the timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, resetTimerOnActivity, true);
    });

    // Cleanup
    return () => {
      clearTimer();
      events.forEach((event) => {
        document.removeEventListener(event, resetTimerOnActivity, true);
      });
    };
  }, [resetTimer, clearTimer, isEnabled]);

  return { resetTimer, clearTimer };
};

export default useIdleTimer;