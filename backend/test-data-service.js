const { loadData } = require('./services/dataService');

console.log('Testing data service...');

const data = loadData();
console.log('Loaded data keys:', Object.keys(data));
console.log('Dex category exists:', !!data.dex);
console.log('Interoperability category exists:', !!data.interoperability);