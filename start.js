const { spawn } = require('child_process');
const path = require('path');

console.log('\n=============================================================');
console.log('🌾 Starting Kissan Saathi Prototype (Backend + Frontend)...');
console.log('=============================================================\n');

const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  shell: true,
  stdio: 'inherit'
});

const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  shell: true,
  stdio: 'inherit'
});

function cleanup() {
  console.log('\nStopping servers...');
  backend.kill();
  frontend.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
