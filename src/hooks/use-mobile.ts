import { useEffect, useState } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
}

export function useDeviceDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /mobile|android|iphone|ipad|ipod|blackberry|windows phone/g.test(userAgent);
      const isIOSDevice = /iphone|ipad|ipod/g.test(userAgent);
      const isAndroidDevice = /android/g.test(userAgent);

      setIsMobile(isMobileDevice);
      setIsIOS(isIOSDevice);
      setIsAndroid(isAndroidDevice);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isIOS, isAndroid };
}
