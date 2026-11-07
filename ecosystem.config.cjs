// PM2 config for production. Holds no secrets: all settings come from
// /etc/wonga/env (KEY=value lines, root-only), or WONGA_ENV_FILE if set.
const fs = require('fs');

const envFile = process.env.WONGA_ENV_FILE || '/etc/wonga/env';

function readEnv(file) {
	const env = {};
	for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
		const line = raw.trim();
		if (!line || line.startsWith('#')) continue;
		const i = line.indexOf('=');
		if (i === -1) continue;
		let value = line.slice(i + 1).trim();
		if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
		env[line.slice(0, i).trim()] = value;
	}
	return env;
}

const env = readEnv(envFile);
for (const key of ['DATABASE_URL', 'UPLOADS_DIR', 'ORIGIN', 'CRON_SECRET']) {
	if (!env[key]) throw new Error(`${key} missing from ${envFile}`);
}

module.exports = {
	apps: [
		{
			name: 'wonga',
			script: './build/index.js',
			cwd: __dirname,
			env: { NODE_ENV: 'production', ...env },
			instances: 1,
			exec_mode: 'fork',
			autorestart: true,
			watch: false,
			max_memory_restart: '1G'
		}
	]
};
