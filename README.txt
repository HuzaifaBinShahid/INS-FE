# Instagram Automation - Frontend & Backend Setup

## 🚀 Quick Start Guide

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 3: Configure Environment Variables

Create `backend/.env` file:

```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Step 4: Start Backend Server

```bash
cd backend
npm start
```

Backend runs on: `http://localhost:5000`

### Step 5: Start Frontend (in new terminal)

```bash
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:3000`

## 🔐 Default Login

**Username:** `admin`  
**Password:** `admin123`

⚠️ **Change password after first login!**

## 📁 Project Structure

```
Inst-profile/
├── frontend/          # React frontend
│   ├── src/
│   │   ├── pages/     # Page components
│   │   ├── components/ # Reusable components
│   │   ├── contexts/  # React contexts
│   │   └── services/  # API services
│   └── package.json
├── backend/           # Express.js backend
│   ├── routes/        # API routes
│   ├── middleware/    # Auth middleware
│   └── server.js      # Main server file
└── src/              # Automation system (existing)
```

## 🔒 Security Features

- ✅ **Zero Credential Storage** - Passwords NOT stored in files
- ✅ **Session-Only** - Credentials exist only in memory during automation
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Password Hashing** - bcrypt for admin passwords

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/change-password` - Change password

### Accounts
- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Add account (no password stored)
- `PUT /api/accounts/:username` - Update account
- `DELETE /api/accounts/:username` - Delete account

### Automation
- `POST /api/automation/run/:username` - Run automation (password required in request)
- `POST /api/automation/run-all` - Run for all accounts

### Reports
- `GET /api/reports/daily` - Get daily reports
- `GET /api/reports/weekly` - Get weekly reports
- `GET /api/reports/download/:type` - Download report

### Logs
- `GET /api/logs` - Get error logs

### Dashboard
- `GET /api/dashboard/stats` - Get statistics
- `GET /api/dashboard/recent-activity` - Get recent activity

## 🎨 Frontend Features

- ✅ Dashboard - Overview with statistics
- ✅ Accounts - Manage Instagram accounts
- ✅ Reports - View and download reports
- ✅ Logs - View error logs
- ✅ Settings - Configure automation
- ✅ Mobile Responsive - Works on all devices

## 🔧 Development Commands

### Backend
```bash
cd backend
npm start      # Start server
npm run dev    # Auto-reload on changes
```

### Frontend
```bash
cd frontend
npm run dev    # Development server
npm run build  # Production build
```

## 🚨 Important Notes

1. **Credentials Security**: Passwords are NEVER stored. Enter through UI each time.
2. **Default Password**: Change admin password after first login.
3. **JWT Secret**: Change JWT_SECRET in production.
4. **Ports**: Backend (5000), Frontend (3000)

## 📝 Next Steps

1. Install dependencies (backend & frontend)
2. Start backend server
3. Start frontend dev server
4. Login with default credentials
5. Change password
6. Add Instagram accounts through UI
7. Run automation through interface

---

**Tech Stack:** React 18, Vite, Tailwind CSS, Express.js, JWT, bcrypt

