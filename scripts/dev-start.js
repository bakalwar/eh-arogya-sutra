const { spawn } = require('child_process');
const path = require('path');
const { readLocalDevConfig } = require('./local-dev-guard');

const cfg = readLocalDevConfig();
process.env.EH_LOCAL_DEV = process.env.EH_LOCAL_DEV || '1';
process.env.APP_ENV = process.env.APP_ENV || 'local';
process.env.EH_VITE_DEV_URL = process.env.EH_VITE_DEV_URL || cfg.viteDevUrl;
process.env.EH_EXPERT_ENGINE_URL = process.env.EH_EXPERT_ENGINE_URL || cfg.pythonApiUrl;
process.env.EH_PYTHON_API_URL = process.env.EH_PYTHON_API_URL || cfg.pythonApiUrl;
process.env.EH_API_URL = process.env.EH_API_URL || cfg.pythonApiUrl;

console.log('Starting E.H. Arogya Sutra Development Environment (local mode)...');
console.log(`  Node API:   ${cfg.nodeApiUrl}`);
console.log(`  Python API: ${cfg.pythonApiUrl}`);
console.log(`  Vite UI:    ${cfg.viteDevUrl}`);

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