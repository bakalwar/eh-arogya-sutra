const { spawn } = require('child_process');
const path = require('path');

console.log('Starting E.H. Arogya Sutra Development Environment...');

// Function to start a process and pipe output
function startProcess(name, command, args, options = {}) {
    console.log(`Starting ${name}...`);
    const proc = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        ...options
    });

    proc.on('error', (err) => {
        console.error(`Failed to start ${name}:`, err);
    });

    return proc;
}

// 1. Start API (Backend)
const api = startProcess('API Server', 'npm', ['run', 'dev:api']);

// 2. Start Vite (Frontend)
const web = startProcess('Vite Frontend', 'npm', ['run', 'dev:web']);

// 3. Start Expert Engine (Python)
const expert = startProcess('Expert Engine', 'npm', ['run', 'expert-engine']);

// Handle process termination
process.on('SIGINT', () => {
    console.log('\nStopping all processes...');
    api.kill();
    web.kill();
    expert.kill();
    process.exit();
});