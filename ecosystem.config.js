module.exports = {
  apps: [{
    name: 'trafikskolax',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/trafikskolax',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/trafikskolax-error.log',
    out_file: '/var/log/pm2/trafikskolax-out.log',
    log_file: '/var/log/pm2/trafikskolax-combined.log',
    time: true
  }]
}
