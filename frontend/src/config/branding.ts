/**
 * Reusable Branding System
 * Centralized configuration for store identity and styling.
 * This file allows changing the entire store's brand with minimal effort.
 */

export const BRANDING = {
  storeName: "OnlineShop",
  websiteTitle: "OnlineShop",
  shortDescription: "Sizning barcha ehtiyojlaringiz uchun sifatli mahsulotlar markazi.",
  currency: "UZS",
  
  // Contact Information
  contact: {
    phone: "+998 00 000 00 00",
    address: "Toshkent shahri, Yunusobod tumani",
    telegramUsername: "@onlineshop_uz",
    telegramLink: "https://t.me/onlineshop_uz",
  },
  
  // Visual Identity
  theme: {
    primaryColor: "#0F172A", // Slate 900
    secondaryColor: "#334155", // Slate 700
    accentColor: "#3B82F6", // Blue 500
  },
  
  // Assets (Placeholders for now)
  logoUrl: "/logo.svg",
  faviconUrl: "/favicon.ico",
  
  // Domain Configuration
  domains: {
    base: import.meta.env.VITE_APP_DOMAIN || "online.shop",
    api: import.meta.env.VITE_API_DOMAIN || "api.online.shop",
    admin: import.meta.env.VITE_ADMIN_DOMAIN || "admin.online.shop",
    superadmin: import.meta.env.VITE_SUPERADMIN_DOMAIN || "superadmin.online.shop",
    operator: import.meta.env.VITE_OPERATOR_DOMAIN || "operator.online.shop",
    courier: import.meta.env.VITE_COURIER_DOMAIN || "courier.online.shop",
  }
};

export type BrandingConfig = typeof BRANDING;
