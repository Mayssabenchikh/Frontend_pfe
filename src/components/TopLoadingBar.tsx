import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const HIDE_DELAY_MS = 900;
const TOP_LOADING_START_EVENT = "skillify:top-loading-start";

export function triggerTopLoadingBar() {
  window.dispatchEvent(new Event(TOP_LOADING_START_EVENT));
}

export function TopLoadingBar() {
  const location = useLocation();
  const [active, setActive] = useState(false);
  const [barKey, setBarKey] = useState(0);

  useEffect(() => {
    const start = () => {
      setActive(true);
      setBarKey((k) => k + 1);

      const timer = window.setTimeout(() => {
        setActive(false);
      }, HIDE_DELAY_MS);

      return () => window.clearTimeout(timer);
    };

    const stopTimer = start();
    const onStart = () => {
      if (stopTimer) stopTimer();
      start();
    };

    window.addEventListener(TOP_LOADING_START_EVENT, onStart);
    return () => {
      window.removeEventListener(TOP_LOADING_START_EVENT, onStart);
      if (stopTimer) stopTimer();
    };
  }, [location.pathname, location.search, location.hash]);

  return (
    <div className={`top-loading-bar${active ? " active" : ""}`} aria-hidden="true">
      <div key={barKey} className="top-loading-bar__fill" />
    </div>
  );
}
