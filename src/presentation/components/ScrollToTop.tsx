import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const main = document.getElementById("layout-main-scroll");
    if (main) {
      main.scrollTo({ top: 0, left: 0 });
      return;
    }
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
