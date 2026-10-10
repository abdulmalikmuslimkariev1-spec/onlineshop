// Helper for managing customer product favorites in localStorage

const FAVORITES_KEY = 'customer_favorites';

export function getFavorites(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorite(productId: number): boolean {
  return getFavorites().includes(productId);
}

export function toggleFavorite(productId: number): boolean {
  const favorites = getFavorites();
  const index = favorites.indexOf(productId);
  let isFav = false;
  
  if (index >= 0) {
    favorites.splice(index, 1);
    isFav = false;
  } else {
    favorites.push(productId);
    isFav = true;
  }
  
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  window.dispatchEvent(new Event('favorites-updated'));
  return isFav;
}
