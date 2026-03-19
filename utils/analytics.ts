/**
 * Responsável por injetar de forma segura e reativa 
 * as tags de rastreamento do Google Analytics 4 e Meta Pixel.
 */

export const initAnalytics = (gaId?: string, pixelId?: string) => {
  // --- Google Analytics 4 ---
  if (gaId && !document.getElementById('ga4-script')) {
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    script1.id = 'ga4-script';
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}', { page_path: window.location.pathname });
    `;
    document.head.appendChild(script2);
  }

  // --- Meta Pixel ---
  if (pixelId && !document.getElementById('meta-pixel')) {
    const pixelScript = document.createElement('script');
    pixelScript.id = 'meta-pixel';
    pixelScript.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(pixelScript);
  }
};

export const trackPageView = (path: string) => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    // @ts-ignore
    window.gtag('config', window.gaMeasurementId, { page_path: path });
  }
  if (typeof window !== 'undefined' && 'fbq' in window) {
    // @ts-ignore
    window.fbq('track', 'PageView');
  }
};
