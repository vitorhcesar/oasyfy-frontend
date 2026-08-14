import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const DESKTOP_QUERY = `(min-width: ${MOBILE_BREAKPOINT}px)`;

function readIsDesktop() {
  return (
    typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches
  );
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

/** SPA-safe: starts with the real viewport so mobile never mounts desktop chrome. */
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState(readIsDesktop);

  React.useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setIsDesktop(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}
