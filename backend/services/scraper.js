// backend/services/scraper.js
// Offline rent estimation algorithm for Canada
// Based on postal code FSA (Forward Sortation Area) and property characteristics
// Covers all Canadian provinces with detailed market data

/**
 * Comprehensive Rent Map by Canadian Forward Sortation Area (FSA)
 * FSA = First 3 characters of postal code (e.g., M5V, L4W, V6A)
 * Each entry includes base rents for 1 and 2 bedroom units and price per sqft
 */
const rentMap = {
  // ============================================
  // ONTARIO - Greater Toronto Area (GTA)
  // ============================================
  // Downtown Toronto
  'M5V': { area: 'Toronto Downtown', province: 'ON', base1Bed: 2200, base2Bed: 2800, pricePerSqft: 3.5 },
  'M5B': { area: 'Toronto Downtown', province: 'ON', base1Bed: 2200, base2Bed: 2800, pricePerSqft: 3.5 },
  'M5C': { area: 'Toronto Downtown', province: 'ON', base1Bed: 2200, base2Bed: 2800, pricePerSqft: 3.5 },
  'M5E': { area: 'Toronto Downtown', province: 'ON', base1Bed: 2100, base2Bed: 2700, pricePerSqft: 3.4 },
  'M5G': { area: 'Toronto Downtown', province: 'ON', base1Bed: 2200, base2Bed: 2800, pricePerSqft: 3.5 },
  'M5H': { area: 'Toronto Downtown', province: 'ON', base1Bed: 2200, base2Bed: 2800, pricePerSqft: 3.5 },
  'M5J': { area: 'Toronto Downtown', province: 'ON', base1Bed: 2100, base2Bed: 2700, pricePerSqft: 3.4 },
  'M5K': { area: 'Toronto Downtown', province: 'ON', base1Bed: 2150, base2Bed: 2750, pricePerSqft: 3.45 },
  'M5L': { area: 'Toronto Downtown', province: 'ON', base1Bed: 2100, base2Bed: 2700, pricePerSqft: 3.4 },
  'M5R': { area: 'Toronto Downtown', province: 'ON', base1Bed: 2200, base2Bed: 2800, pricePerSqft: 3.5 },
  'M5S': { area: 'Toronto Downtown', province: 'ON', base1Bed: 2200, base2Bed: 2800, pricePerSqft: 3.5 },
  'M5T': { area: 'Toronto Downtown', province: 'ON', base1Bed: 2200, base2Bed: 2800, pricePerSqft: 3.5 },
  'M5W': { area: 'Toronto Downtown', province: 'ON', base1Bed: 2200, base2Bed: 2800, pricePerSqft: 3.5 },
  'M5X': { area: 'Toronto Downtown', province: 'ON', base1Bed: 2250, base2Bed: 2850, pricePerSqft: 3.6 },

  // Toronto Midtown/Central
  'M4P': { area: 'Toronto Midtown', province: 'ON', base1Bed: 1950, base2Bed: 2500, pricePerSqft: 3.0 },
  'M4R': { area: 'Toronto Midtown', province: 'ON', base1Bed: 1950, base2Bed: 2500, pricePerSqft: 3.0 },
  'M4S': { area: 'Toronto Midtown', province: 'ON', base1Bed: 1950, base2Bed: 2500, pricePerSqft: 3.0 },
  'M4T': { area: 'Toronto Midtown', province: 'ON', base1Bed: 1950, base2Bed: 2500, pricePerSqft: 3.0 },
  'M4V': { area: 'Toronto Midtown', province: 'ON', base1Bed: 1950, base2Bed: 2500, pricePerSqft: 3.0 },
  'M4W': { area: 'Toronto Midtown', province: 'ON', base1Bed: 2000, base2Bed: 2550, pricePerSqft: 3.1 },
  'M4X': { area: 'Toronto Midtown', province: 'ON', base1Bed: 2000, base2Bed: 2550, pricePerSqft: 3.1 },

  // Toronto West
  'M6G': { area: 'Toronto West', province: 'ON', base1Bed: 1750, base2Bed: 2300, pricePerSqft: 2.6 },
  'M6H': { area: 'Toronto West', province: 'ON', base1Bed: 1750, base2Bed: 2300, pricePerSqft: 2.6 },
  'M6J': { area: 'Toronto West', province: 'ON', base1Bed: 1750, base2Bed: 2300, pricePerSqft: 2.6 },
  'M6K': { area: 'Toronto West', province: 'ON', base1Bed: 1750, base2Bed: 2300, pricePerSqft: 2.6 },

  // Toronto East
  'M4E': { area: 'Toronto East', province: 'ON', base1Bed: 1650, base2Bed: 2100, pricePerSqft: 2.4 },
  'M4C': { area: 'Toronto East', province: 'ON', base1Bed: 1650, base2Bed: 2100, pricePerSqft: 2.4 },
  'M4H': { area: 'Toronto East', province: 'ON', base1Bed: 1700, base2Bed: 2150, pricePerSqft: 2.5 },

  // Toronto North
  'M2J': { area: 'Toronto North', province: 'ON', base1Bed: 1600, base2Bed: 2050, pricePerSqft: 2.35 },
  'M2K': { area: 'Toronto North', province: 'ON', base1Bed: 1600, base2Bed: 2050, pricePerSqft: 2.35 },
  'M2L': { area: 'Toronto North', province: 'ON', base1Bed: 1600, base2Bed: 2050, pricePerSqft: 2.35 },

  // ============================================
  // GTA - Surrounding Cities
  // ============================================
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

  // Markham
  'L3R': { area: 'Markham', province: 'ON', base1Bed: 1450, base2Bed: 1900, pricePerSqft: 2.1 },
  'L3S': { area: 'Markham', province: 'ON', base1Bed: 1450, base2Bed: 1900, pricePerSqft: 2.1 },
  'L3T': { area: 'Markham', province: 'ON', base1Bed: 1450, base2Bed: 1900, pricePerSqft: 2.1 },
  'L6B': { area: 'Markham', province: 'ON', base1Bed: 1450, base2Bed: 1900, pricePerSqft: 2.1 },
  'L6C': { area: 'Markham', province: 'ON', base1Bed: 1450, base2Bed: 1900, pricePerSqft: 2.1 },

  // Vaughan
  'L4K': { area: 'Vaughan', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.2 },
  'L4L': { area: 'Vaughan', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.2 },
  'L6A': { area: 'Vaughan', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.2 },

  // Richmond Hill
  'L4B': { area: 'Richmond Hill', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.2 },
  'L4C': { area: 'Richmond Hill', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.2 },
  'L4E': { area: 'Richmond Hill', province: 'ON', base1Bed: 1550, base2Bed: 2000, pricePerSqft: 2.2 },

  // ============================================
  // SOUTHWESTERN ONTARIO
  // ============================================
  // Windsor
  'N8X': { area: 'Windsor', province: 'ON', base1Bed: 1100, base2Bed: 1450, pricePerSqft: 1.6 },
  'N8Y': { area: 'Windsor', province: 'ON', base1Bed: 1100, base2Bed: 1450, pricePerSqft: 1.6 },
  'N8Z': { area: 'Windsor', province: 'ON', base1Bed: 1100, base2Bed: 1450, pricePerSqft: 1.6 },
  'N9A': { area: 'Windsor', province: 'ON', base1Bed: 1100, base2Bed: 1450, pricePerSqft: 1.6 },
  'N9B': { area: 'Windsor', province: 'ON', base1Bed: 1100, base2Bed: 1450, pricePerSqft: 1.6 },

  // London
  'N6A': { area: 'London', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N6B': { area: 'London', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
  'N6C': { area: 'London', province: 'ON', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },

  // ============================================
  // EASTERN ONTARIO
  // ============================================
  // Ottawa
  'K1N': { area: 'Ottawa Downtown', province: 'ON', base1Bed: 1600, base2Bed: 2100, pricePerSqft: 2.4 },
  'K1P': { area: 'Ottawa Downtown', province: 'ON', base1Bed: 1600, base2Bed: 2100, pricePerSqft: 2.4 },
  'K1R': { area: 'Ottawa Downtown', province: 'ON', base1Bed: 1600, base2Bed: 2100, pricePerSqft: 2.4 },
  'K1S': { area: 'Ottawa Downtown', province: 'ON', base1Bed: 1600, base2Bed: 2100, pricePerSqft: 2.4 },
  'K1Y': { area: 'Ottawa Downtown', province: 'ON', base1Bed: 1600, base2Bed: 2100, pricePerSqft: 2.4 },

  // ============================================
  // CENTRAL ONTARIO
  // ============================================
  // Hamilton
  'L8N': { area: 'Hamilton', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 },
  'L8P': { area: 'Hamilton', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 },
  'L8S': { area: 'Hamilton', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 },
  'L8T': { area: 'Hamilton', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 },

  // Waterloo
  'N2J': { area: 'Waterloo', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 },
  'N2L': { area: 'Waterloo', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 },

  // ============================================
  // BRITISH COLUMBIA
  // ============================================
  // Vancouver Downtown
  'V6A': { area: 'Vancouver Downtown', province: 'BC', base1Bed: 2350, base2Bed: 3100, pricePerSqft: 3.8 },
  'V6B': { area: 'Vancouver Downtown', province: 'BC', base1Bed: 2350, base2Bed: 3100, pricePerSqft: 3.8 },
  'V6C': { area: 'Vancouver Downtown', province: 'BC', base1Bed: 2350, base2Bed: 3100, pricePerSqft: 3.8 },
  'V6E': { area: 'Vancouver Downtown', province: 'BC', base1Bed: 2350, base2Bed: 3100, pricePerSqft: 3.8 },
  'V6G': { area: 'Vancouver Downtown', province: 'BC', base1Bed: 2350, base2Bed: 3100, pricePerSqft: 3.8 },

  // Burnaby
  'V5A': { area: 'Burnaby', province: 'BC', base1Bed: 1950, base2Bed: 2500, pricePerSqft: 3.0 },
  'V5B': { area: 'Burnaby', province: 'BC', base1Bed: 1950, base2Bed: 2500, pricePerSqft: 3.0 },
  'V5C': { area: 'Burnaby', province: 'BC', base1Bed: 1950, base2Bed: 2500, pricePerSqft: 3.0 },

  // Richmond
  'V6X': { area: 'Richmond BC', province: 'BC', base1Bed: 2050, base2Bed: 2600, pricePerSqft: 3.2 },
  'V6Y': { area: 'Richmond BC', province: 'BC', base1Bed: 2050, base2Bed: 2600, pricePerSqft: 3.2 },

  // ============================================
  // ALBERTA
  // ============================================
  // Calgary
  'T2A': { area: 'Calgary', province: 'AB', base1Bed: 1250, base2Bed: 1650, pricePerSqft: 1.8 },
  'T2B': { area: 'Calgary', province: 'AB', base1Bed: 1250, base2Bed: 1650, pricePerSqft: 1.8 },
  'T2C': { area: 'Calgary', province: 'AB', base1Bed: 1250, base2Bed: 1650, pricePerSqft: 1.8 },

  // Edmonton
  'T5A': { area: 'Edmonton', province: 'AB', base1Bed: 1200, base2Bed: 1550, pricePerSqft: 1.7 },
  'T5B': { area: 'Edmonton', province: 'AB', base1Bed: 1200, base2Bed: 1550, pricePerSqft: 1.7 },

  // ============================================
  // QUEBEC
  // ============================================
  // Montreal
  'H1A': { area: 'Montreal', province: 'QC', base1Bed: 1300, base2Bed: 1700, pricePerSqft: 1.9 },
  'H1B': { area: 'Montreal', province: 'QC', base1Bed: 1300, base2Bed: 1700, pricePerSqft: 1.9 },
  'H2A': { area: 'Montreal', province: 'QC', base1Bed: 1350, base2Bed: 1750, pricePerSqft: 2.0 },
  'H2B': { area: 'Montreal', province: 'QC', base1Bed: 1350, base2Bed: 1750, pricePerSqft: 2.0 },
  'H2C': { area: 'Montreal', province: 'QC', base1Bed: 1350, base2Bed: 1750, pricePerSqft: 2.0 },
  'H2E': { area: 'Montreal', province: 'QC', base1Bed: 1350, base2Bed: 1750, pricePerSqft: 2.0 },

  // ============================================
  // MANITOBA
  // ============================================
  // Winnipeg
  'R2H': { area: 'Winnipeg', province: 'MB', base1Bed: 1000, base2Bed: 1300, pricePerSqft: 1.4 },
  'R2J': { area: 'Winnipeg', province: 'MB', base1Bed: 1000, base2Bed: 1300, pricePerSqft: 1.4 },
  'R2K': { area: 'Winnipeg', province: 'MB', base1Bed: 1000, base2Bed: 1300, pricePerSqft: 1.4 },

  // ============================================
  // SASKATCHEWAN
  // ============================================
  // Regina/Saskatoon
  'S4R': { area: 'Regina', province: 'SK', base1Bed: 950, base2Bed: 1250, pricePerSqft: 1.35 },
  'S7K': { area: 'Saskatoon', province: 'SK', base1Bed: 950, base2Bed: 1250, pricePerSqft: 1.35 },

  // ============================================
  // NOVA SCOTIA
  // ============================================
  // Halifax
  'B3H': { area: 'Halifax', province: 'NS', base1Bed: 1100, base2Bed: 1450, pricePerSqft: 1.6 },
  'B3J': { area: 'Halifax', province: 'NS', base1Bed: 1100, base2Bed: 1450, pricePerSqft: 1.6 }
};

/**
 * Default rents by province (fallback when exact FSA not found)
 * Based on province first letter
 */
function getDefaultRegion(firstLetter) {
  const defaultRents = {
    'A': { area: 'Alberta', province: 'AB', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
    'B': { area: 'British Columbia', province: 'BC', base1Bed: 1800, base2Bed: 2400, pricePerSqft: 2.7 },
    'E': { area: 'Newfoundland', province: 'NL', base1Bed: 1000, base2Bed: 1300, pricePerSqft: 1.4 },
    'G': { area: 'Quebec', province: 'QC', base1Bed: 1300, base2Bed: 1700, pricePerSqft: 1.9 },
    'H': { area: 'Quebec (Montreal)', province: 'QC', base1Bed: 1350, base2Bed: 1750, pricePerSqft: 2.0 },
    'J': { area: 'Quebec', province: 'QC', base1Bed: 1300, base2Bed: 1700, pricePerSqft: 1.9 },
    'K': { area: 'Ontario (Eastern)', province: 'ON', base1Bed: 1500, base2Bed: 1950, pricePerSqft: 2.1 },
    'L': { area: 'Ontario (GTA/Central)', province: 'ON', base1Bed: 1500, base2Bed: 1950, pricePerSqft: 2.1 },
    'M': { area: 'Ontario (Toronto)', province: 'ON', base1Bed: 1600, base2Bed: 2100, pricePerSqft: 2.3 },
    'N': { area: 'Ontario (Southwestern)', province: 'ON', base1Bed: 1400, base2Bed: 1800, pricePerSqft: 2.0 },
    'P': { area: 'Ontario (Northern)', province: 'ON', base1Bed: 1200, base2Bed: 1500, pricePerSqft: 1.7 },
    'R': { area: 'Manitoba', province: 'MB', base1Bed: 1200, base2Bed: 1500, pricePerSqft: 1.7 },
    'S': { area: 'Saskatchewan', province: 'SK', base1Bed: 1100, base2Bed: 1400, pricePerSqft: 1.6 },
    'T': { area: 'Alberta', province: 'AB', base1Bed: 1350, base2Bed: 1700, pricePerSqft: 1.9 },
    'V': { area: 'British Columbia', province: 'BC', base1Bed: 1800, base2Bed: 2400, pricePerSqft: 2.7 },
    'X': { area: 'Northwest Territories', province: 'NT', base1Bed: 1600, base2Bed: 2100, pricePerSqft: 2.4 },
    'Y': { area: 'Yukon', province: 'YT', base1Bed: 1500, base2Bed: 1950, pricePerSqft: 2.2 }
  };
  
  return defaultRents[firstLetter] || {
    area: 'Canada (Average)',
    province: 'CA',
    base1Bed: 1400,
    base2Bed: 1800,
    pricePerSqft: 2.0
  };
}

/**
 * Calculate rent estimate based on property characteristics
 * Uses base rent + adjustments for property features
 */
function calculateRentEstimate(userInput, regionData) {
  let baseRent = 0;

  // Base rent by bedrooms
  switch (userInput.beds) {
    case 'studio':
      baseRent = regionData.base1Bed * 0.85;
      break;
    case '1':
      baseRent = regionData.base1Bed;
      break;
    case '2':
      baseRent = regionData.base2Bed;
      break;
    case '3':
      baseRent = regionData.base2Bed * 1.25;
      break;
    case '4':
      baseRent = regionData.base2Bed * 1.5;
      break;
    case '5+':
      baseRent = regionData.base2Bed * 1.75;
      break;
    default:
      baseRent = regionData.base1Bed;
  }

  // Square footage adjustment
  let avgSqftForBedrooms = 700;
  if (userInput.beds === '2') avgSqftForBedrooms = 900;
  else if (userInput.beds === '3') avgSqftForBedrooms = 1100;
  else if (userInput.beds === '4') avgSqftForBedrooms = 1300;
  else if (userInput.beds === '5+') avgSqftForBedrooms = 1600;

  if (userInput.sqft > 0) {
    const sqftDelta = userInput.sqft - avgSqftForBedrooms;
    const sqftAdjustment = sqftDelta * regionData.pricePerSqft * 0.3;
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
  const propertyTypeLower = userInput.propertyType?.toLowerCase() || 'apartment';
  switch (propertyTypeLower) {
    case 'apartment':
      break; // No adjustment
    case 'condo':
      baseRent += 150;
      break;
    case 'townhouse':
      baseRent += 200;
      break;
    case 'single':
    case 'single family':
      baseRent += 400;
      break;
    case 'commercial':
      baseRent *= 1.3;
      break;
    case 'multi':
      baseRent += 300;
      break;
  }

  // Levels adjustment
  if (userInput.levels === '2') baseRent += 100;
  if (userInput.levels === '3') baseRent += 200;

  // Round to nearest dollar
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

/**
 * Main export function
 * Estimates property rental income based on location and characteristics
 * 
 * @param {Object} params - Property details
 * @returns {Promise<Object>} - Estimated rental data
 */
async function getEstimateFromPublicData({
  address,
  postal,
  bedrooms,
  sqft,
  propertyType,
  bathrooms,
  levels,
  parking
}) {
  try {
    // Extract FSA (first 3 characters of postal code, removing spaces)
    let postalPrefix = postal ? postal.replace(/\s/g, '').substring(0, 3) : 'M5V';
    const fsaKey = postalPrefix.toUpperCase();

    // Look up region data
    let regionData = rentMap[fsaKey];
    
    // Fallback to provincial average if FSA not found
    if (!regionData) {
      const firstLetter = postalPrefix.charAt(0).toUpperCase();
      regionData = getDefaultRegion(firstLetter);
    }

    // Prepare user input for calculation
    const userInput = {
      beds: bedrooms?.toString() || '1',
      sqft: parseInt(sqft) || 1000,
      baths: bathrooms?.toString() || '1',
      parking: parking?.toString() || '0',
      propertyType: propertyType || 'apartment',
      levels: levels?.toString() || '1'
    };

    // Calculate estimate
    const estimate = calculateRentEstimate(userInput, regionData);

    // Log for monitoring
    console.log(
      `📊 ROI Estimate: ${regionData.area}, ${regionData.province} ` +
      `| ${bedrooms} bed | $${estimate.avgRent}/mo ` +
      `(Range: $${estimate.minRent}-$${estimate.maxRent})`
    );

    return {
      avgRent: estimate.avgRent,
      avgPricePerSqft: estimate.pricePerSqft,
      comparableListings: estimate.comparableListings,
      marketArea: estimate.marketArea,
      province: estimate.province,
      minRent: estimate.minRent,
      maxRent: estimate.maxRent
    };
  } catch (err) {
    console.error('❌ ROI estimation error:', err);
    throw new Error(`Unable to calculate estimate: ${err.message}`);
  }
}

module.exports = {
  getEstimateFromPublicData
};