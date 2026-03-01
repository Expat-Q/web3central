const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function inspectData() {
  try {
    const response = await fetch('http://localhost:5000/api/tools');
    const data = await response.json();
    
    console.log('Data structure:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

inspectData();