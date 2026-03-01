const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAPI() {
  try {
    // Test adding a tool
    const response = await fetch('http://localhost:5000/api/tools/dex', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'test-tool',
        name: 'Test Tool',
        url: 'https://test.com',
        description: 'A test tool for testing purposes',
        category: 'dex',
        tags: ['Test', 'Demo'],
        builder: {
          name: 'Test Builder',
          handle: '@testbuilder',
          twitter: 'https://twitter.com/testbuilder',
          github: 'https://github.com/testbuilder'
        }
      }),
    });

    const result = await response.json();
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();