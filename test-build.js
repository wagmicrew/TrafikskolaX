const { exec } = require('child_process');
const fs = require('fs');

console.log('Starting build...');

const child = exec('npm run build', (error, stdout, stderr) => {
  fs.writeFileSync('build-output.txt', stdout + '\n\n' + stderr);
  
  if (error) {
    console.error('Build failed with error:', error.message);
    // Extract the last part of the error message
    const lines = stderr.split('\n');
    const relevantLines = lines.slice(-100).join('\n');
    console.log('\n--- Last 100 lines of error output ---\n');
    console.log(relevantLines);
  } else {
    console.log('Build succeeded!');
  }
});

child.stdout.on('data', (data) => {
  process.stdout.write(data);
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
});
