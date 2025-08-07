module.exports = {
  apps: [
    {
      name: 'dintrafikskolax-dev',
      cwd: '/var/www/dintrafikskolax_dev',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        NEXTAUTH_URL: 'https://dev.dintrafikskolahlm.se',
        NEXT_PUBLIC_APP_URL: 'https://dev.dintrafikskolahlm.se'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/dintrafikskolax-dev-error.log',
      out_file: '/var/log/pm2/dintrafikskolax-dev-out.log',
      log_file: '/var/log/pm2/dintrafikskolax-dev-combined.log',
      time: true,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'dintrafikskolax-prod',
      cwd: '/var/www/dintrafikskolax_prod',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        NEXTAUTH_URL: 'https://dintrafikskolahlm.se',
        NEXT_PUBLIC_APP_URL: 'https://dintrafikskolahlm.se'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/dintrafikskolax-prod-error.log',
      out_file: '/var/log/pm2/dintrafikskolax-prod-out.log',
      log_file: '/var/log/pm2/dintrafikskolax-prod-combined.log',
      time: true,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
