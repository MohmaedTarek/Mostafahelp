import React, { useState } from 'react';
import { importExcelFile } from '../utils/excelimporter';
import { mergePlacesData } from '../utils/dataimporter';
import { getPlacesData } from './placesdata';

const DataUploader = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Reset states
    setIsUploading(true);
    setUploadResult(null);
    setError(null);
    
    try {
      // Parse the Excel file
      const importedData = await importExcelFile(file);
      
      // Count items by category
      const countByCategory = Object.entries(importedData).reduce((acc, [category, items]) => {
        acc[category] = items.length;
        return acc;
      }, {});
      
      // Get existing data
      const existingData = getPlacesData();
      
      // Merge the data
      const mergedData = mergePlacesData(existingData, importedData);
      
      // Here you would save the merged data to your app state or localStorage
      // For example:
      // localStorage.setItem('placesData', JSON.stringify(mergedData));
      
      // Set result
      setUploadResult({
        filename: file.name,
        totalImported: Object.values(countByCategory).reduce((a, b) => a + b, 0),
        categories: countByCategory
      });
      
      // You can also emit an event or call a callback to notify the parent component
      if (typeof onDataImported === 'function') {
        onDataImported(mergedData);
      }
      
    } catch (err) {
      console.error('Error importing data:', err);
      setError(`Failed to import data: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="data-uploader">
      <div className="upload-container">
        <h3>Import Place Data</h3>
        <p>Upload Excel files containing restaurant, cafe, hotel, or monument data.</p>
        
        <div className="file-input-wrapper">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            id="file-upload"
            className="file-input"
          />
          <label htmlFor="file-upload" className="file-label">
            {isUploading ? 'Uploading...' : 'Choose File'}
          </label>
        </div>
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        {uploadResult && (
          <div className="success-message">
            <h4>Upload Successful!</h4>
            <p>Imported {uploadResult.totalImported} places from {uploadResult.filename}</p>
            
            <div className="category-summary">
              <h5>Imported by category:</h5>
              <ul>
                {Object.entries(uploadResult.categories).map(([category, count]) => (
                  <li key={category}>
                    <strong>{category}:</strong> {count} places
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .data-uploader {
          margin: 20px 0;
          padding: 20px;
          border-radius: 8px;
          background-color: #f8f9fa;
        }
        
        .upload-container {
          max-width: 600px;
          margin: 0 auto;
        }
        
        .file-input-wrapper {
          margin: 20px 0;
        }
        
        .file-input {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          border: 0;
        }
        
        .file-label {
          display: inline-block;
          padding: 10px 20px;
          background-color: #1a73e8;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .file-label:hover {
          background-color: #1557b0;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .error-message {
          margin-top: 15px;
          padding: 10px 15px;
          background-color: #ffebee;
          border-left: 4px solid #f44336;
          border-radius: 4px;
        }
        
        .success-message {
          margin-top: 15px;
          padding: 15px;
          background-color: #e8f5e9;
          border-left: 4px solid #4caf50;
          border-radius: 4px;
        }
        
        .category-summary {
          margin-top: 10px;
        }
        
        .category-summary ul {
          padding-left: 20px;
        }
      `}</style>
    </div>
  );
};

export default DataUploader;