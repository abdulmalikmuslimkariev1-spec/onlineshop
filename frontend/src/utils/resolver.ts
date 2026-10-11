import { BRANDING } from '../config/branding';

export enum AppContext {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN',
  OPERATOR = 'OPERATOR',
  COURIER = 'COURIER',
}

export const isSingleDomainOrPreview = (): boolean => {
  if (typeof window === 'undefined') return true;
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('ais-dev') ||
    hostname.includes('ais-pre') ||
    hostname.includes('run.app') ||
    hostname.includes('vercel.app') ||
    hostname.includes('netlify.app') ||
    hostname.includes('github.io') ||
    hostname.includes('pages.dev') ||
    hostname.includes('onrender.com') ||
    !hostname.includes('.')
  );
};

export const resolveAppContext = (): AppContext => {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  const { domains } = BRANDING;

  // 1. Path-based context routing (works on Vercel and single domain hosting)
  if (
    pathname.startsWith('/superadmin') || 
    pathname.startsWith('/admin') ||
    pathname === '/banners' ||
    pathname === '/users' ||
    pathname === '/admins' ||
    pathname === '/settings'
  ) {
    return AppContext.SUPERADMIN;
  }
  if (pathname.startsWith('/operator')) {
    return AppContext.OPERATOR;
  }
  if (pathname.startsWith('/courier') || pathname.startsWith('/my-orders')) {
    return AppContext.COURIER;
  }

  // 2. Query parameter override
  const searchParams = new URLSearchParams(window.location.search);
  const devContext = searchParams.get('context');
  if (devContext && Object.values(AppContext).includes(devContext as AppContext)) {
    localStorage.setItem('preview_context', devContext);
    return devContext as AppContext;
  }

  // 3. Subdomain-based context routing
  if (hostname === domains.superadmin || hostname.startsWith('superadmin.')) {
    return AppContext.SUPERADMIN;
  }
  if (hostname === domains.admin || hostname.startsWith('admin.')) {
    return AppContext.ADMIN;
  }
  if (hostname === domains.operator || hostname.startsWith('operator.')) {
    return AppContext.OPERATOR;
  }
  if (hostname === domains.courier || hostname.startsWith('courier.')) {
    return AppContext.COURIER;
  }

  // 4. Stored preview context fallback for single domain
  if (isSingleDomainOrPreview()) {
    const storedContext = localStorage.getItem('preview_context');
    if (storedContext && Object.values(AppContext).includes(storedContext as AppContext)) {
      return storedContext as AppContext;
    }
  }

  return AppContext.CUSTOMER;
};

export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (isSingleDomainOrPreview()) {
    return '/api';
  }
  return `https://${BRANDING.domains.api}/api`;
};

export const getBaseUrl = (): string => {
  return `https://${BRANDING.domains.api}`;
};

