import * as XLSX from 'xlsx';
import { processPlaceData } from './dataimporter';

/**
 * Converts Excel column names to category keys
 * @param {String} columnName - Excel column name
 * @returns {String} Normalized category key
 */
const normalizeCategoryName = (columnName = '') => {
  const name = columnName.toLowerCase().trim();
  
  // Map common variations to standard category names
  const categoryMap = {
    'restaurant': 'restaurants',
    'restaurants': 'restaurants',
    'dining': 'restaurants',
    'food': 'restaurants',
    
    'cafe': 'cafes',
    'cafes': 'cafes',
    'coffee': 'cafes',
    'coffee shop': 'cafes',
    
    'hotel': 'hotels',
    'hotels': 'hotels',
    'accommodation': 'hotels',
    'lodging': 'hotels',
    
    'monument': 'monuments',
    'monuments': 'monuments',
    'attraction': 'monuments',
    'attractions': 'monuments',
    'site': 'monuments',
    'landmark': 'monuments'
  };
  
  return categoryMap[name] || name;
};

/**
 * Parses Excel file content into structured data by category
 * @param {ArrayBuffer} fileContent - Excel file content as ArrayBuffer
 * @returns {Object} Object with categories as keys and arrays of places as values
 */
export const parseExcelData = (fileContent) => {
  // Read the Excel file
  const workbook = XLSX.read(fileContent, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  // Determine the category column (look for a column named 'category', 'type', etc.)
  const categoryColumnName = Object.keys(jsonData[0] || {}).find(key => 
    ['category', 'type', 'place type', 'placetype'].includes(key.toLowerCase())
  );
  
  // If we don't have a category column, assume all data is for a single category
  if (!categoryColumnName && jsonData.length > 0) {
    // Try to determine category from sheet name or file name
    const guessedCategory = normalizeCategoryName(firstSheetName);
    return {
      [guessedCategory]: processPlaceData(jsonData, guessedCategory)
    };
  }
  
  // Group data by category
  const categorizedData = {};
  
  jsonData.forEach(row => {
    const category = row[categoryColumnName] 
      ? normalizeCategoryName(row[categoryColumnName]) 
      : 'uncategorized';
    
    if (!categorizedData[category]) {
      categorizedData[category] = [];
    }
    
    categorizedData[category].push(row);
  });
  
  // Process each category
  const result = {};
  for (const [category, data] of Object.entries(categorizedData)) {
    result[category] = processPlaceData(data, category);
  }
  
  return result;
};

/**
 * Handles the file upload and parsing
 * @param {File} file - The uploaded Excel file
 * @returns {Promise<Object>} Parsed and processed data
 */
export const importExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = parseExcelData(e.target.result);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export default {
  parseExcelData,
  importExcelFile
};