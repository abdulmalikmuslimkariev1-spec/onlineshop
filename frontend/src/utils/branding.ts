import { BRANDING } from '../config/branding';

export interface DynamicBranding {
  storeName: string;
  websiteTitle: string;
  shortDescription: string;
  phone: string;
  email: string;
  currency: string;
  defaultLang: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

let activeBranding: DynamicBranding = {
  storeName: BRANDING.storeName,
  websiteTitle: BRANDING.websiteTitle,
  shortDescription: BRANDING.shortDescription,
  phone: BRANDING.contact.phone,
  email: "support@online.shop",
  currency: BRANDING.currency,
  defaultLang: "uz",
  logoUrl: BRANDING.logoUrl,
  faviconUrl: BRANDING.faviconUrl,
  primaryColor: BRANDING.theme.primaryColor,
  secondaryColor: BRANDING.theme.secondaryColor,
};

export const getBranding = (): DynamicBranding => {
  const cached = localStorage.getItem('central_branding');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return activeBranding;
    }
  }
  return activeBranding;
};

export const loadCentralBranding = async (): Promise<DynamicBranding> => {
  try {
    const res = await fetch('/api/admin/settings/branding').catch(() => null);
    if (res && res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json().catch(() => null);
        if (data) {
          const updated: DynamicBranding = {
            storeName: data.store_name || BRANDING.storeName,
            websiteTitle: data.website_title || BRANDING.websiteTitle,
            shortDescription: data.short_description || BRANDING.shortDescription,
            phone: data.phone || BRANDING.contact.phone,
            email: data.email || "support@online.shop",
            currency: data.currency || BRANDING.currency,
            defaultLang: data.default_lang || "uz",
            logoUrl: data.logo_url || BRANDING.logoUrl,
            faviconUrl: data.favicon_url || BRANDING.faviconUrl,
            primaryColor: data.primary_color || BRANDING.theme.primaryColor,
            secondaryColor: data.secondary_color || BRANDING.theme.secondaryColor,
          };
          activeBranding = updated;
          localStorage.setItem('central_branding', JSON.stringify(updated));
          applyDynamicStyle(updated);
          return updated;
        }
      }
    }
  } catch (e) {
    // Quiet fallback
  }
  
  applyDynamicStyle(activeBranding);
  return activeBranding;
};

const applyDynamicStyle = (b: DynamicBranding) => {
  // Update document title
  if (b.websiteTitle) {
    document.title = b.websiteTitle;
  } else if (b.storeName) {
    document.title = b.storeName;
  }

  // Update favicon
  const favicon = document.getElementById('favicon') as HTMLLinkElement;
  if (favicon && b.faviconUrl) {
    favicon.href = b.faviconUrl;
  }

  // Inject CSS variables
  let styleTag = document.getElementById('dynamic-branding-style');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'dynamic-branding-style';
    document.head.appendChild(styleTag);
  }
  styleTag.innerHTML = `
    :root {
      --color-primary: ${b.primaryColor};
      --color-secondary: ${b.secondaryColor};
    }
  `;
};
