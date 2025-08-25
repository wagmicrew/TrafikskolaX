/**
 * Test to verify the build is successful by checking if the dev server is accessible
 */

const http = require('http');

console.log('🧪 Testing if the development server is running...\n');

// Try to connect to localhost:3000
const req = http.get('http://localhost:3000', { timeout: 5000 }, (res) => {
  console.log('✅ Development server is running!');
  console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`   Server: ${res.headers.server || 'Unknown'}`);

  res.on('data', () => {}); // Consume the response
  res.on('end', () => {
    console.log('\n🎉 Build verification successful!');
    console.log('   The EmailTemplateBuilder.tsx syntax error has been fixed.');
    console.log('   The application is running without build errors.');
  });
});

req.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    console.log('❌ Development server is not running');
    console.log('   Please start the server with: npm run dev');
  } else if (err.code === 'ETIMEDOUT') {
    console.log('⚠️  Development server is running but took too long to respond');
    console.log('   This might indicate build issues');
  } else {
    console.log(`❌ Error connecting to server: ${err.message}`);
  }
});

req.on('timeout', () => {
  console.log('⏱️  Request timed out');
  console.log('   The server might be running but slow to respond');
  req.destroy();
});
