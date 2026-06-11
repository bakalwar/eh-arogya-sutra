const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Vite Frontend (Safe Mode)...');

const vite = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..', 'frontend'),
    stdio: 'inherit',
    shell: true
});

vite.on('exit', (code) => {
    if (code !== 0) {
        console.error(`Vite exited with code ${code}`);
    }
});