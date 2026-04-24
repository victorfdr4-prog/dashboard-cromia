import ReactGA from "react-ga4";

// Initialize GA4 with a placeholder ID
// This should be replaced with a real Measurement ID via environment variables if possible
export const initGA = () => {
  const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "G-XXXXXXXXXX";
  ReactGA.initialize(GA_ID);
};

export const trackEvent = (category: string, action: string, label?: string) => {
  ReactGA.event({
    category,
    action,
    label,
  });
};

export const trackPageView = (path: string) => {
  ReactGA.send({ hitType: "pageview", page: path });
};
