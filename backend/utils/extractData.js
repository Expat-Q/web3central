const fs = require('fs');
const path = require('path');

// Read the appsData.js file
const inputFile = path.join(__dirname, '../../src/data/appsData.js');
const outputFile = path.join(__dirname, '../data/appsData.json');

// Read the file content
let content = fs.readFileSync(inputFile, 'utf8');

// Remove the export statement and any comments at the beginning
content = content.replace(/^[\/\*].*$/gm, ''); // Remove comments
content = content.replace(/^\s*export\s+default\s+/, ''); // Remove export default
content = content.replace(/;\s*$/, ''); // Remove trailing semicolon

// Try to parse and write as JSON
try {
  // Evaluate the JavaScript object
  const data = eval(`(${content})`);
  
  // Write to JSON file
  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
  console.log('Successfully converted appsData.js to appsData.json');
} catch (error) {
  console.error('Error converting data:', error);
  console.log('Content preview:', content.substring(0, 200));
}