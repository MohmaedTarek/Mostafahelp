import xlsx from 'xlsx';
import fs from 'fs';

// Load the Excel file
const workbook = xlsx.readFile('hotels.xlsx'); // Replace with your Excel file name
const sheetName = workbook.SheetNames[0]; // Get the first sheet
const sheet = workbook.Sheets[sheetName];

// Convert the sheet to JSON
const jsonData = xlsx.utils.sheet_to_json(sheet);

// Add image URLs to each hotel
const updatedData = jsonData.map((hotel) => {
    return {
        ...hotel,
        imageUrl: `https://source.unsplash.com/300x200/?hotel,${encodeURIComponent(hotel.name)}` // Generate an image URL
    };
});

// Save the JSON data to a file
const outputFilePath = 'hotels.json'; // Output JSON file
fs.writeFileSync(outputFilePath, JSON.stringify(updatedData, null, 2));

console.log(`Excel file has been converted to JSON and saved as ${outputFilePath}`);