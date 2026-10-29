import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { subscribeToApiLoading } from '../api/apiLoading.js';
import './GlobalLoadingIndicator.css';

export default function GlobalLoadingIndicator() {
  const location = useLocation();
  const previousLocationKey = useRef(location.key);
  const navigationTimer = useRef(null);
  const [hasActiveRequest, setHasActiveRequest] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => subscribeToApiLoading((count) => {
    setHasActiveRequest(count > 0);
  }), []);

  useEffect(() => {
    if (previousLocationKey.current === location.key) return undefined;

    previousLocationKey.current = location.key;
    setIsNavigating(true);
    window.clearTimeout(navigationTimer.current);
    navigationTimer.current = window.setTimeout(() => {
      setIsNavigating(false);
    }, 350);

    return undefined;
  }, [location.key]);

  useEffect(() => () => window.clearTimeout(navigationTimer.current), []);

  const isLoading = hasActiveRequest || isNavigating;

  useEffect(() => {
    if (!isLoading) {
      const hideTimer = window.setTimeout(() => setIsVisible(false), 0);
      return () => window.clearTimeout(hideTimer);
    }

    const showTimer = window.setTimeout(() => setIsVisible(true), 120);
    return () => window.clearTimeout(showTimer);
  }, [isLoading]);

  if (!isVisible) return null;

  return (
    <div className="global-loading-indicator" role="status" aria-live="polite">
      <span className="global-loading-indicator__bar" aria-hidden="true" />
      <span className="global-loading-indicator__message">
        <span className="global-loading-indicator__spinner" aria-hidden="true" />
        Đang tải...
      </span>
    </div>
  );
}
