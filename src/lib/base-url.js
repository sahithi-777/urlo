const appBaseUrl = import.meta.env.PROD
  ? window.location.origin
  : "https://urlo-lilac.vercel.app";

export default appBaseUrl;
