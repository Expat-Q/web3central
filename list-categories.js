const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function listCategories() {
  try {
    const response = await fetch('http://localhost:5000/api/tools');
    const data = await response.json();
    
    console.log('Available categories:');
    Object.keys(data).forEach(category => {
      console.log(`- ${category}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

listCategories();