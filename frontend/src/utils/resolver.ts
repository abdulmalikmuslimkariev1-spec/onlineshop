import { BRANDING } from '../config/branding';

export enum AppContext {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN',
  OPERATOR = 'OPERATOR',
  COURIER = 'COURIER',
}

export const resolveAppContext = (): AppContext => {
  const hostname = window.location.hostname;
  const { domains } = BRANDING;

  // Local development or Cloud Run preview check
  const isDevOrPreview = hostname === 'localhost' || 
                         hostname === '127.0.0.1' || 
                         hostname.includes('ais-dev') || 
                         hostname.includes('ais-pre') || 
                         hostname.includes('run.app');

  if (isDevOrPreview) {
    const searchParams = new URLSearchParams(window.location.search);
    const devContext = searchParams.get('context');
    if (devContext && Object.values(AppContext).includes(devContext as AppContext)) {
      localStorage.setItem('preview_context', devContext);
      return devContext as AppContext;
    }
    const pathname = window.location.pathname;
    if (pathname.startsWith('/superadmin') || pathname.startsWith('/admin')) {
      localStorage.setItem('preview_context', AppContext.SUPERADMIN);
      return AppContext.SUPERADMIN;
    }
    if (pathname.startsWith('/operator')) {
      localStorage.setItem('preview_context', AppContext.OPERATOR);
      return AppContext.OPERATOR;
    }
    if (pathname.startsWith('/courier')) {
      localStorage.setItem('preview_context', AppContext.COURIER);
      return AppContext.COURIER;
    }

    const storedContext = localStorage.getItem('preview_context');
    if (storedContext && Object.values(AppContext).includes(storedContext as AppContext)) {
      return storedContext as AppContext;
    }
  }

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

  return AppContext.CUSTOMER;
};

export const getBaseUrl = () => {
  return `https://${BRANDING.domains.api}`;
};
