# LinkVault

Simple, secure file and text sharing with local storage.

## Features

Upload text or files  
Password protection  
One-time view links  
Max view limits  
Custom expiry dates  
Auto-cleanup of expired content  
Authentication and user accounts  
User-based access control (owner-only links)  
Manual delete option  
Optional file type validation  
Local file storage (no external services)  

## Quick Start

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (open in new terminal)
cd frontend
npm install
```

### 2. Setup Environment

```bash
cd backend
cp .env.example .env
# Edit .env if needed 
```

### 3. Start MongoDB

```bash
Used MongoDB Atlas
```

### 4. Run the App

```bash
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory,in new terminal)
npm run dev
```

### 5. Open Browser

Go to http://localhost:3000

## Project Structure

```
linkvault/
├── backend/
│   ├── server.js         # Main server entrypoint
│   ├── config/           # Environment + DB config
│   ├── controllers/      # Route handlers
│   ├── jobs/             # Background cleanup job
│   ├── middleware/       # Auth + error middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # Express route modules
│   ├── services/         # Business logic utilities
│   ├── uploads/          # Uploaded files stored here
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/        # HomePage, ViewPage
│   │   ├── api.js        # API calls
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## API Endpoints

```
POST   /api/upload/text          - Upload text
POST   /api/upload/file          - Upload file
GET    /api/share/:id/check      - Check if share exists
POST   /api/share/:id            - Get share content
GET    /api/share/:id/download   - Download uploaded file (token required)
DELETE /api/share/:id            - Delete share (owner auth or delete token)
POST   /api/auth/register        - Register user
POST   /api/auth/login           - Login user
GET    /api/auth/me              - Current logged-in user
POST   /api/auth/logout          - Logout current session
GET    /api/my/shares            - List shares created by logged-in user
```

## Configuration

Edit `backend/.env`:

```env
PORT=5000                                      # Backend port
MONGODB_URI=mongodb+srv://userid:<db_password>@linkvault.aniqh8s.mongodb.net/?appName=Linkvault  # MongoDB connection
UPLOADS_DIR=./uploads                          # Where files are stored
ALLOWED_MIME_TYPES=                            # Optional CSV MIME allowlist
```

## Features Explained

### Password Protection
Add password when uploading. Viewers must enter it to access.

### One-Time View
Content deleted after first view.

### Max Views
Limit how many times content can be viewed.

### Custom Expiry
Set specific expiration date/time. Default: 10 minutes.

### Auto-Cleanup
Background job deletes expired content every 5 minutes.

### Manual Delete
Share creator can delete content using a delete token returned at upload time.

### Authentication and Accounts
Users can register/login and manage their own created shares.

### Owner-Only Access
Logged-in users can create links restricted to their own account.

## Design Decisions

- `shareId` is generated with `nanoid` and used as the public link identifier.
- Files are stored locally in `backend/uploads` for zero-cost storage and simple development setup.
- File download is routed through `/api/share/:id/download` with a short-lived token to prevent direct file path access.
- Auth uses local DB-backed sessions with bearer tokens and 7-day expiry.
- Optional file type validation can be enabled through `ALLOWED_MIME_TYPES` in `.env`.
- Expiration is enforced in two ways:
  - Runtime checks on every access request.
  - Periodic cleanup job that removes expired DB records and files.
- Optional security controls (password, one-time view, max views, owner-only) are enforced in backend logic.

## Assumptions

- MongoDB is available (local instance or Atlas).
- Link secrecy is part of access control (no public listing/search endpoint exists).
- Creator manually keeps the delete token after upload for manual deletion.

## Limitations

- Passwords are hashed with `crypto.scrypt`; however, no MFA/email verification is implemented.
- Cleanup runs every 5 minutes, so expired records may exist briefly before background deletion.
- File type allowlisting is opt-in (disabled by default to keep base "any file format" behavior).


## File Storage

Files stored in `backend/uploads/` directory.  
Automatically cleaned up when:
- Content expires
- Max views reached
- One-time view accessed
- Manually deleted


## Tech Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Multer (file uploads)
- Local file storage

**Frontend:**
- React + Vite
- React Router
- Tailwind CSS
- Axios
