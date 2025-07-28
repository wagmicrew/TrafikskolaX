# TrafikskolaX

A modern driving school management system built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Git
- SSH access to dev.dintrafikskolahlm.se (for deployment)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/wagmicrew/TrafikskolaX.git
cd Trafikskolax
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🚀 Deployment

### Initial Setup (Run Once)

1. Generate SSH key for deployment:
```powershell
.\scripts\deploy-trafikskolax.ps1 keygen
```

2. Add the public key to the server's authorized_keys

3. Setup the remote server:
```powershell
.\scripts\deploy-trafikskolax.ps1 setup
```

### Deploy to Production

To deploy changes to dev.dintrafikskolahlm.se:

```powershell
# Push to GitHub and deploy
.\scripts\deploy-trafikskolax.ps1 full

# Or separately:
.\scripts\deploy-trafikskolax.ps1 push   # Push to GitHub
.\scripts\deploy-trafikskolax.ps1 deploy # Deploy to server
```

## 📁 Project Structure

```
Trafikskolax/
├── app/            # Next.js app directory
├── components/     # React components
├── lib/            # Utility functions
├── public/         # Static assets
├── scripts/        # Deployment scripts
├── styles/         # Global styles
└── ecosystem.config.js # PM2 configuration
```

## 🛠️ Tech Stack

- **Framework:** Next.js 15.2.4
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3.4
- **UI Components:** Radix UI
- **Forms:** React Hook Form + Zod
- **Deployment:** PM2 + Nginx

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🌐 Production Details

- **URL:** https://dev.dintrafikskolahlm.se
- **Server Path:** /var/www/trafikskolax
- **PM2 App Name:** trafikskolax
- **Port:** 3000 (proxied through Nginx)

## 🔧 Server Management

### Restart Application
```bash
ssh trafikskolax@dev.dintrafikskolahlm.se
pm2 restart trafikskolax
```

### View Logs
```bash
ssh trafikskolax@dev.dintrafikskolahlm.se
pm2 logs trafikskolax
```

### Monitor Application
```bash
ssh trafikskolax@dev.dintrafikskolahlm.se
pm2 monit
```

## 📝 License

This project is proprietary and confidential.

---

Built with ❤️ by WagmiCrew
