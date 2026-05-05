import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const HIDE_DELAY_MS = 900;

export function TopLoadingBar() {
  const location = useLocation();
  const [active, setActive] = useState(false);
  const [barKey, setBarKey] = useState(0);

  useEffect(() => {
    setActive(true);
    setBarKey((k) => k + 1);

    const timer = window.setTimeout(() => {
      setActive(false);
    }, HIDE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search, location.hash]);

  return (
    <div className={`top-loading-bar${active ? " active" : ""}`} aria-hidden="true">
      <div key={barKey} className="top-loading-bar__fill" />
    </div>
  );
}
