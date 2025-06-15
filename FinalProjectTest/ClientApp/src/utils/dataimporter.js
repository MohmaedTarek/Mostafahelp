// src/utils/dataImporter.js

/**
 * Processes place data from any category to ensure consistency
 * @param {Array} data - Raw data array (restaurants, cafes, hotels, monuments)
 * @param {String} category - Category name (restaurant, cafe, hotel, monument)
 * @returns {Array} Processed data with consistent properties
 */
export const processPlaceData = (data, category) => {
    if (!data || !Array.isArray(data)) {
      console.error(`Invalid data provided for category: ${category}`);
      return [];
    }
    
    // Normalize category name (singular form for consistency)
    const normalizedCategory = category.endsWith('s') 
      ? category.slice(0, -1) 
      : category;
    
    return data.map(place => {
      // Generate image URL if missing
      let imageUrl = place.imageUrl || place.image;
      
      // If no valid image URL exists, create one using Unsplash
      if (!imageUrl || !imageUrl.startsWith('http')) {
        const searchTerm = encodeURIComponent(
          place.name.split(' ')[0] || normalizedCategory
        );
        imageUrl = `https://source.unsplash.com/300x200/?${normalizedCategory},${searchTerm}`;
      }
      
      // Fix distance if missing or invalid
      const distance = place.distance || "N/A";
      
      // Fix open status if missing
      const openStatus = place.openStatus || 
        (normalizedCategory === 'hotel' ? 'Open 24 hours' : 'Call for hours');
      
      // Fix or add other category-specific fields
      let additional = {};
      if (normalizedCategory === 'hotel') {
        additional.amenities = place.amenities || [];
      } else if (['restaurant', 'cafe'].includes(normalizedCategory)) {
        additional.cuisine = place.cuisine || 'Various';
      } else if (normalizedCategory === 'monument') {
        additional.historicalPeriod = place.historicalPeriod || 'Historic';
      }
      
      // Return standardized place object
      return {
        id: place.id || `${normalizedCategory}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: place.name || 'Unnamed Place',
        rating: place.rating || 0,
        reviewCount: place.reviewCount || 0,
        priceLevel: typeof place.priceLevel === 'number' ? place.priceLevel : 1,
        distance,
        openStatus,
        category: normalizedCategory,
        image: imageUrl,
        imageUrl,
        address: place.address || '',
        location: place.location || { lat: null, lng: null },
        ...additional
      };
    });
  };
  
  /**
   * Imports place data from Excel/CSV/JSON and formats it for the application
   * @param {Object} importedData - Object containing data for each category
   * @returns {Object} Processed data ready for the application
   */
  export const importPlacesData = (importedData) => {
    const result = {};
    
    // Process each category
    for (const [category, data] of Object.entries(importedData)) {
      if (Array.isArray(data)) {
        result[category] = processPlaceData(data, category);
      }
    }
    
    return result;
  };
  
  /**
   * Merges new data with existing data, preferring new data when duplicates exist
   * @param {Object} existingData - Existing places data
   * @param {Object} newData - New places data to merge in
   * @returns {Object} Merged data
   */
  export const mergePlacesData = (existingData, newData) => {
    const result = { ...existingData };
    
    // For each category in new data
    for (const [category, places] of Object.entries(newData)) {
      if (!result[category]) {
        result[category] = [];
      }
      
      // Create a set of existing IDs for fast lookup
      const existingIds = new Set(result[category].map(place => place.id));
      
      // Add new places, overwrite existing ones by ID
      places.forEach(place => {
        const index = result[category].findIndex(p => p.id === place.id);
        if (index >= 0) {
          // Update existing place
          result[category][index] = { ...result[category][index], ...place };
        } else {
          // Add new place
          result[category].push(place);
        }
      });
    }
    
    return result;
  };
  
  export default {
    processPlaceData,
    importPlacesData,
    mergePlacesData
  };