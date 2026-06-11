const { execSync } = require('child_process');

function freePort(port) {
    try {
        console.log(`Checking port ${port}...`);
        const stdout = execSync(`netstat -ano | findstr :${port}`).toString();
        const lines = stdout.split('\n');
        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length > 4) {
                const pid = parts[parts.length - 1];
                if (pid && pid !== '0') {
                    console.log(`Killing process ${pid} on port ${port}...`);
                    try {
                        execSync(`taskkill /F /PID ${pid}`);
                    } catch (e) {
                        console.error(`Failed to kill process ${pid}: ${e.message}`);
                    }
                }
            }
        }
    } catch (e) {
        // Port is likely free
    }
}

if (require.main === module) {
    freePort(5000);
    freePort(5173);
    freePort(8000);
    freePort(8001);
    freePort(8005);
}

module.exports = { freePort };