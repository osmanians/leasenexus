// backend/services/scraper.js
// Offline rent estimation algorithm – Ontario only
// Based on CMHC, Rentals.ca, and local market data (2025–2026)

// ============================================================
// ONTARIO RENT MAP (by Forward Sortation Area - FSA)
// ============================================================
const rentMap = {
  // ===== WINDSOR / ESSEX COUNTY =====
  // Windsor (N8N, N8P, N8R, N8S, N8T, N8W, N8X, N8Y, N9A, N9B, N9C, N9E, N9G, N9J, N9K, N9V, N9Y)
  'N8N': { area: 'Windsor', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N8P': { area: 'Windsor', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N8R': { area: 'Windsor', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N8S': { area: 'Windsor', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N8T': { area: 'Windsor', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N8W': { area: 'Windsor', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N8X': { area: 'Windsor', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N8Y': { area: 'Windsor', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N9A': { area: 'Windsor', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N9B': { area: 'Windsor', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N9C': { area: 'Windsor', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N9E': { area: 'Windsor', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N9G': { area: 'Windsor', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N9J': { area: 'Windsor', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N9K': { area: 'Windsor', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N9V': { area: 'Windsor', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N9Y': { area: 'Windsor', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  
  // ===== LEAMINGTON (N8H) =====
  'N8H': { area: 'Leamington', province: 'ON', base1Bed: 1200, base2Bed: 1500, pricePerSqft: 1.7 },
  
  // ===== CHATHAM (N7L, N7M, N7T) =====
  'N7L': { area: 'Chatham', province: 'ON', base1Bed: 1150, base2Bed: 1450, pricePerSqft: 1.6 },
  'N7M': { area: 'Chatham', province: 'ON', base1Bed: 1150, base2Bed: 1450, pricePerSqft: 1.6 },
  'N7T': { area: 'Chatham', province: 'ON', base1Bed: 1150, base2Bed: 1450, pricePerSqft: 1.6 },
  
  // ===== AMHERSTBURG (N9V) already included in Windsor, but we add specific =====
  'N9V': { area: 'Amherstburg', province: 'ON', base1Bed: 1250, base2Bed: 1550, pricePerSqft: 1.8 },
  
  // ===== KINGSVILLE (N9Y) – also in Windsor, but refine =====
  'N9Y': { area: 'Kingsville', province: 'ON', base1Bed: 1200, base2Bed: 1500, pricePerSqft: 1.7 },
  
  // ===== TILBURY (N0P) =====
  'N0P': { area: 'Tilbury', province: 'ON', base1Bed: 1100, base2Bed: 1400, pricePerSqft: 1.5 },
  
  // ===== LONDON (N5V, N5W, N5X, N5Y, N6A, N6B, N6C, N6E, N6G, N6H, N6K, N6L, N6M, N6N, N6P) =====
  'N5V': { area: 'London', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N5W': { area: 'London', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N5X': { area: 'London', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N5Y': { area: 'London', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N6A': { area: 'London', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N6B': { area: 'London', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N6C': { area: 'London', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N6E': { area: 'London', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N6G': { area: 'London', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N6H': { area: 'London', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N6K': { area: 'London', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N6L': { area: 'London', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N6M': { area: 'London', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N6N': { area: 'London', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N6P': { area: 'London', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  
  // ===== TORONTO DOWNTOWN =====
  'M5B': { area: 'Downtown Toronto', province: 'ON', base1Bed: 2200, base2Bed: 2800, pricePerSqft: 3.5 },
  'M5C': { area: 'Downtown Toronto', province: 'ON', base1Bed: 2200, base2Bed: 2800, pricePerSqft: 3.5 },
  'M5G': { area: 'Downtown Toronto', province: 'ON', base1Bed: 2200, base2Bed: 2800, pricePerSqft: 3.5 },
  'M5H': { area: 'Downtown Toronto', province: 'ON', base1Bed: 2200, base2Bed: 2800, pricePerSqft: 3.5 },
  'M5J': { area: 'Downtown Toronto', province: 'ON', base1Bed: 2200, base2Bed: 2800, pricePerSqft: 3.5 },
  'M5R': { area: 'Downtown Toronto', province: 'ON', base1Bed: 2200, base2Bed: 2800, pricePerSqft: 3.5 },
  'M5S': { area: 'Downtown Toronto', province: 'ON', base1Bed: 2200, base2Bed: 2800, pricePerSqft: 3.5 },
  'M5T': { area: 'Downtown Toronto', province: 'ON', base1Bed: 2200, base2Bed: 2800, pricePerSqft: 3.5 },
  'M5V': { area: 'Downtown Toronto', province: 'ON', base1Bed: 2200, base2Bed: 2800, pricePerSqft: 3.5 },
  'M5W': { area: 'Downtown Toronto', province: 'ON', base1Bed: 2200, base2Bed: 2800, pricePerSqft: 3.5 },
  
  // Toronto Midtown
  'M4P': { area: 'Toronto Midtown', province: 'ON', base1Bed: 1950, base2Bed: 2500, pricePerSqft: 3.0 },
  'M4R': { area: 'Toronto Midtown', province: 'ON', base1Bed: 1950, base2Bed: 2500, pricePerSqft: 3.0 },
  'M4S': { area: 'Toronto Midtown', province: 'ON', base1Bed: 1950, base2Bed: 2500, pricePerSqft: 3.0 },
  'M4T': { area: 'Toronto Midtown', province: 'ON', base1Bed: 1950, base2Bed: 2500, pricePerSqft: 3.0 },
  'M4V': { area: 'Toronto Midtown', province: 'ON', base1Bed: 1950, base2Bed: 2500, pricePerSqft: 3.0 },
  
  // Toronto West
  'M6G': { area: 'Toronto West', province: 'ON', base1Bed: 1750, base2Bed: 2300, pricePerSqft: 2.6 },
  'M6H': { area: 'Toronto West', province: 'ON', base1Bed: 1750, base2Bed: 2300, pricePerSqft: 2.6 },
  'M6J': { area: 'Toronto West', province: 'ON', base1Bed: 1750, base2Bed: 2300, pricePerSqft: 2.6 },
  'M6K': { area: 'Toronto West', province: 'ON', base1Bed: 1750, base2Bed: 2300, pricePerSqft: 2.6 },
  
  // Toronto East
  'M4C': { area: 'Toronto East', province: 'ON', base1Bed: 1650, base2Bed: 2100, pricePerSqft: 2.4 },
  'M4E': { area: 'Toronto East', province: 'ON', base1Bed: 1650, base2Bed: 2100, pricePerSqft: 2.4 },
  
  // Mississauga
  'L4W': { area: 'Mississauga', province: 'ON', base1Bed: 1500, base2Bed: 1950, pricePerSqft: 2.2 },
  'L5A': { area: 'Mississauga', province: 'ON', base1Bed: 1500, base2Bed: 1950, pricePerSqft: 2.2 },
  'L5B': { area: 'Mississauga', province: 'ON', base1Bed: 1500, base2Bed: 1950, pricePerSqft: 2.2 },
  'L5C': { area: 'Mississauga', province: 'ON', base1Bed: 1500, base2Bed: 1950, pricePerSqft: 2.2 },
  'L5K': { area: 'Mississauga', province: 'ON', base1Bed: 1500, base2Bed: 1950, pricePerSqft: 2.2 },
  'L5M': { area: 'Mississauga', province: 'ON', base1Bed: 1500, base2Bed: 1950, pricePerSqft: 2.2 },
  
  // Brampton
  'L6S': { area: 'Brampton', province: 'ON', base1Bed: 1300, base2Bed: 1700, pricePerSqft: 1.9 },
  'L6T': { area: 'Brampton', province: 'ON', base1Bed: 1300, base2Bed: 1700, pricePerSqft: 1.9 },
  'L6V': { area: 'Brampton', province: 'ON', base1Bed: 1300, base2Bed: 1700, pricePerSqft: 1.9 },
  'L6W': { area: 'Brampton', province: 'ON', base1Bed: 1300, base2Bed: 1700, pricePerSqft: 1.9 },
  'L6Z': { area: 'Brampton', province: 'ON', base1Bed: 1300, base2Bed: 1700, pricePerSqft: 1.9 },
  
  // Oakville
  'L6H': { area: 'Oakville', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.3 },
  'L6J': { area: 'Oakville', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.3 },
  'L6K': { area: 'Oakville', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.3 },
  'L6M': { area: 'Oakville', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.3 },
  
  // Markham
  'L3R': { area: 'Markham', province: 'ON', base1Bed: 1450, base2Bed: 1900, pricePerSqft: 2.1 },
  'L3S': { area: 'Markham', province: 'ON', base1Bed: 1450, base2Bed: 1900, pricePerSqft: 2.1 },
  'L3T': { area: 'Markham', province: 'ON', base1Bed: 1450, base2Bed: 1900, pricePerSqft: 2.1 },
  'L6B': { area: 'Markham', province: 'ON', base1Bed: 1450, base2Bed: 1900, pricePerSqft: 2.1 },
  'L6C': { area: 'Markham', province: 'ON', base1Bed: 1450, base2Bed: 1900, pricePerSqft: 2.1 },
  'L6E': { area: 'Markham', province: 'ON', base1Bed: 1450, base2Bed: 1900, pricePerSqft: 2.1 },
  
  // Vaughan
  'L4K': { area: 'Vaughan', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.2 },
  'L4L': { area: 'Vaughan', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.2 },
  'L6A': { area: 'Vaughan', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.2 },
  
  // Richmond Hill
  'L4B': { area: 'Richmond Hill', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.2 },
  'L4C': { area: 'Richmond Hill', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.2 },
  'L4E': { area: 'Richmond Hill', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.2 },
  
  // Waterloo Region (Kitchener-Waterloo-Cambridge)
  'N2J': { area: 'Waterloo', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 },
  'N2L': { area: 'Waterloo', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 },
  'N2M': { area: 'Waterloo', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 },
  'N2N': { area: 'Waterloo', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 },
  'N2T': { area: 'Waterloo', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 },
  'N2V': { area: 'Waterloo', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 },
  
  // Hamilton
  'L8N': { area: 'Hamilton', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 },
  'L8P': { area: 'Hamilton', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 },
  'L8S': { area: 'Hamilton', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 },
  'L8T': { area: 'Hamilton', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 },
  'L8V': { area: 'Hamilton', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 },
  'L8W': { area: 'Hamilton', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 },
  
  // Ottawa
  'K1N': { area: 'Ottawa Downtown', province: 'ON', base1Bed: 1600, base2Bed: 2100, pricePerSqft: 2.4 },
  'K1P': { area: 'Ottawa Downtown', province: 'ON', base1Bed: 1600, base2Bed: 2100, pricePerSqft: 2.4 },
  'K1R': { area: 'Ottawa Downtown', province: 'ON', base1Bed: 1600, base2Bed: 2100, pricePerSqft: 2.4 },
  'K1S': { area: 'Ottawa Downtown', province: 'ON', base1Bed: 1600, base2Bed: 2100, pricePerSqft: 2.4 },
  'K1Y': { area: 'Ottawa Downtown', province: 'ON', base1Bed: 1600, base2Bed: 2100, pricePerSqft: 2.4 },
  'K1Z': { area: 'Ottawa Downtown', province: 'ON', base1Bed: 1600, base2Bed: 2100, pricePerSqft: 2.4 },
  
  // St. Catharines / Niagara
  'L2M': { area: 'St. Catharines', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'L2N': { area: 'St. Catharines', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'L2P': { area: 'St. Catharines', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'L2R': { area: 'St. Catharines', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'L2S': { area: 'St. Catharines', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'L2T': { area: 'St. Catharines', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'L2V': { area: 'St. Catharines', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'L2W': { area: 'St. Catharines', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  
  // Barrie
  'L4M': { area: 'Barrie', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.2 },
  'L4N': { area: 'Barrie', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.2 },
  'L4V': { area: 'Barrie', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.2 },
  'L9J': { area: 'Barrie', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.2 },
  
  // Guelph
  'N1E': { area: 'Guelph', province: 'ON', base1Bed: 1500, base2Bed: 1950, pricePerSqft: 2.1 },
  'N1G': { area: 'Guelph', province: 'ON', base1Bed: 1500, base2Bed: 1950, pricePerSqft: 2.1 },
  'N1H': { area: 'Guelph', province: 'ON', base1Bed: 1500, base2Bed: 1950, pricePerSqft: 2.1 },
  'N1K': { area: 'Guelph', province: 'ON', base1Bed: 1500, base2Bed: 1950, pricePerSqft: 2.1 },
  'N1L': { area: 'Guelph', province: 'ON', base1Bed: 1500, base2Bed: 1950, pricePerSqft: 2.1 },
  
  // Kingston
  'K7K': { area: 'Kingston', province: 'ON', base1Bed: 1450, base2Bed: 1850, pricePerSqft: 2.0 },
  'K7L': { area: 'Kingston', province: 'ON', base1Bed: 1450, base2Bed: 1850, pricePerSqft: 2.0 },
  'K7M': { area: 'Kingston', province: 'ON', base1Bed: 1450, base2Bed: 1850, pricePerSqft: 2.0 },
  'K7P': { area: 'Kingston', province: 'ON', base1Bed: 1450, base2Bed: 1850, pricePerSqft: 2.0 },
  
  // Peterborough
  'K9H': { area: 'Peterborough', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'K9J': { area: 'Peterborough', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'K9K': { area: 'Peterborough', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'K9L': { area: 'Peterborough', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  
  // Sudbury
  'P3A': { area: 'Sudbury', province: 'ON', base1Bed: 1250, base2Bed: 1600, pricePerSqft: 1.8 },
  'P3B': { area: 'Sudbury', province: 'ON', base1Bed: 1250, base2Bed: 1600, pricePerSqft: 1.8 },
  'P3C': { area: 'Sudbury', province: 'ON', base1Bed: 1250, base2Bed: 1600, pricePerSqft: 1.8 },
  'P3E': { area: 'Sudbury', province: 'ON', base1Bed: 1250, base2Bed: 1600, pricePerSqft: 1.8 },
  'P3G': { area: 'Sudbury', province: 'ON', base1Bed: 1250, base2Bed: 1600, pricePerSqft: 1.8 },
  
  // Thunder Bay
  'P7A': { area: 'Thunder Bay', province: 'ON', base1Bed: 1200, base2Bed: 1500, pricePerSqft: 1.7 },
  'P7B': { area: 'Thunder Bay', province: 'ON', base1Bed: 1200, base2Bed: 1500, pricePerSqft: 1.7 },
  'P7C': { area: 'Thunder Bay', province: 'ON', base1Bed: 1200, base2Bed: 1500, pricePerSqft: 1.7 },
  'P7E': { area: 'Thunder Bay', province: 'ON', base1Bed: 1200, base2Bed: 1500, pricePerSqft: 1.7 },
  'P7G': { area: 'Thunder Bay', province: 'ON', base1Bed: 1200, base2Bed: 1500, pricePerSqft: 1.7 }
};

// ============================================================
// ONTARIO DEFAULT FALLBACK (for any postal code starting with K, L, M, N, P)
// ============================================================
function getOntarioDefault(firstLetter) {
  const defaults = {
    'K': { area: 'Eastern Ontario', province: 'ON', base1Bed: 1450, base2Bed: 1850, pricePerSqft: 2.0 },
    'L': { area: 'Central Ontario', province: 'ON', base1Bed: 1500, base2Bed: 1950, pricePerSqft: 2.1 },
    'M': { area: 'Toronto Area', province: 'ON', base1Bed: 1800, base2Bed: 2300, pricePerSqft: 2.6 },
    'N': { area: 'Southwestern Ontario', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
    'P': { area: 'Northern Ontario', province: 'ON', base1Bed: 1200, base2Bed: 1500, pricePerSqft: 1.7 }
  };
  return defaults[firstLetter] || { area: 'Ontario', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 };
}

// ============================================================
// CORE RENT CALCULATION ENGINE
// ============================================================
function calculateRentEstimate(userInput, regionData) {
  let baseRent = 0;
  
  switch(userInput.beds) {
    case 'studio': baseRent = regionData.base1Bed * 0.85; break;
    case '1': baseRent = regionData.base1Bed; break;
    case '2': baseRent = regionData.base2Bed; break;
    case '3': baseRent = regionData.base2Bed * 1.25; break;
    case '4': baseRent = regionData.base2Bed * 1.5; break;
    case '5+': baseRent = regionData.base2Bed * 1.75; break;
    default: baseRent = regionData.base1Bed;
  }
  
  // Square footage adjustment
  let avgSqftForBedrooms = 700;
  if (userInput.beds === '2') avgSqftForBedrooms = 900;
  else if (userInput.beds === '3') avgSqftForBedrooms = 1100;
  else if (userInput.beds === '4') avgSqftForBedrooms = 1300;
  else if (userInput.beds === '5+') avgSqftForBedrooms = 1600;
  
  if (userInput.sqft > 0) {
    const sqftAdjustment = (userInput.sqft - avgSqftForBedrooms) * regionData.pricePerSqft * 0.3;
    baseRent += sqftAdjustment;
  }
  
  // Bathroom adjustment
  if (userInput.baths) {
    const bathValue = parseFloat(userInput.baths);
    if (bathValue >= 2) baseRent += 150;
    if (bathValue >= 3) baseRent += 200;
  }
  
  // Parking adjustment
  if (userInput.parking && userInput.parking !== '0' && userInput.parking !== 'no') {
    let parkingSpaces = 1;
    if (userInput.parking === '2') parkingSpaces = 2;
    else if (userInput.parking === '3+' || userInput.parking === '3') parkingSpaces = 3;
    baseRent += 100 * parkingSpaces;
  }
  
  // Property type adjustment
  switch(userInput.propertyType) {
    case 'condo': baseRent += 150; break;
    case 'townhouse': baseRent += 200; break;
    case 'single': baseRent += 400; break;
    case 'commercial': baseRent *= 1.3; break;
    case 'multi': baseRent += 300; break;
  }
  
  // Levels adjustment
  if (userInput.levels === '2') baseRent += 100;
  if (userInput.levels === '3') baseRent += 200;
  
  baseRent = Math.round(baseRent);
  
  return {
    avgRent: baseRent,
    minRent: Math.round(baseRent * 0.9),
    maxRent: Math.round(baseRent * 1.1),
    pricePerSqft: regionData.pricePerSqft,
    marketArea: regionData.area,
    province: regionData.province,
    comparableListings: 15
  };
}

// ============================================================
// MAIN EXPORTED FUNCTION
// ============================================================
async function getEstimateFromPublicData({ address, postal, bedrooms, sqft, propertyType, bathrooms, levels, parking }) {
  // Extract first 3 characters of postal code (ignore spaces) – only Ontario
  let postalPrefix = postal ? postal.replace(/\s/g, '').substring(0, 3) : 'N5V';
  const fsaKey = postalPrefix.toUpperCase();
  
  // Look up region data
  let regionData = rentMap[fsaKey];
  if (!regionData) {
    const firstLetter = postalPrefix.charAt(0).toUpperCase();
    // For Ontario, only letters K, L, M, N, P are valid. Anything else falls back to default Ontario.
    if (['K','L','M','N','P'].includes(firstLetter)) {
      regionData = getOntarioDefault(firstLetter);
    } else {
      // If postal code starts with anything else (shouldn't happen for Ontario, but fallback)
      regionData = { area: 'Ontario', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 };
    }
  }
  
  // Prepare user input object
  const userInput = {
    beds: bedrooms || '1',
    sqft: parseInt(sqft) || 1000,
    baths: bathrooms || '1',
    parking: parking || '0',
    propertyType: propertyType || 'apartment',
    levels: levels || '1'
  };
  
  const estimate = calculateRentEstimate(userInput, regionData);
  
  console.log(`📊 [Ontario Estimate] ${regionData.area}: $${estimate.avgRent} ($${estimate.minRent}-$${estimate.maxRent})`);
  
  return {
    avgRent: estimate.avgRent,
    avgPricePerSqft: estimate.pricePerSqft,
    comparableListings: estimate.comparableListings,
    marketArea: estimate.marketArea,
    province: estimate.province,
    minRent: estimate.minRent,
    maxRent: estimate.maxRent
  };
}

module.exports = { getEstimateFromPublicData };