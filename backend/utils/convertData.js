// Script to convert appsData.js to appsData.json
const fs = require('fs');
const path = require('path');

// Read the JS file
const jsFilePath = path.join(__dirname, '../../src/data/appsData.js');
const jsContent = fs.readFileSync(jsFilePath, 'utf8');

// Extract the data (remove export statement and wrap in parentheses for evaluation)
const dataMatch = jsContent.match(/export\s+default\s+(.*)/s);
if (dataMatch && dataMatch[1]) {
  // Clean up the data string to make it valid JSON
  let dataString = dataMatch[1];
  
  // Remove any trailing semicolons or extra characters
  dataString = dataString.trim().replace(/;$/, '');
  
  try {
    // Write to JSON file
    const jsonFilePath = path.join(__dirname, '../data/appsData.json');
    fs.writeFileSync(jsonFilePath, JSON.stringify(eval(dataString), null, 2));
    console.log('Successfully converted appsData.js to appsData.json');
  } catch (error) {
    console.error('Error converting data:', error);
  }
} else {
  console.error('Could not extract data from appsData.js');
}