const fs = require('fs');
const path = require('path');

// Path to the appsData.js file
const dataFilePath = path.join(__dirname, '../../src/data/appsData.js');

// Function to load data from the JavaScript file
const loadData = () => {
  try {
    // Clear module cache to ensure we get fresh data
    delete require.cache[require.resolve(dataFilePath)];

    // Require the module directly
    const data = require(dataFilePath);
    // Return the data object directly
    return data;
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
};

// Function to save data back to the JavaScript file
const saveData = (data) => {
  try {
    // Convert data to a nicely formatted JavaScript object string
    const dataString = JSON.stringify(data, null, 2)
      .replace(/"(\w+)":/g, '$1:') // Remove quotes from keys
      .replace(/\\"/g, '"'); // Unescape quotes properly

    // Create the full file content using CommonJS syntax
    const fileContent = `module.exports = ${dataString};\n`;

    // Write to file
    fs.writeFileSync(dataFilePath, fileContent);
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
};

module.exports = {
  loadData,
  saveData
};