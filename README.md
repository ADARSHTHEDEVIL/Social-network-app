# Social Network

A full-stack social network web application built with Django REST Framework and React.
Users can sign up, build a profile, share posts with images and documents, react and
comment on posts, share their profile across social platforms, and message each other
privately with encrypted storage.

**Live demo:** https://social-network-app-gold-alpha.vercel.app
**API:** https://social-network-backend-a9wg.onrender.com

---

## Features

- **Authentication** — Email-based signup/login with JWT access & refresh tokens
- **Profile management** — Edit name and date of birth inline, upload/view profile picture
- **Posts** — Create posts with text, images, and documents (PDF, Word, Excel, PowerPoint)
- **Reactions** — Like/Dislike with toggle behavior (one reaction per user per post)
- **Comments** — Comment threads on individual posts
- **Share Profile** — Share your profile link to WhatsApp, Facebook, X, LinkedIn,
  Telegram, Email, or copy the link directly
- **Private messaging** — One-to-one chat with:
  - Message content encrypted at rest (Fernet symmetric encryption)
  - A local PIN lock on the chat screen for device privacy
  - Polling-based updates (new messages appear automatically every few seconds)
- **Document viewer** — Non-image documents open in-browser via an embedded viewer
  instead of forcing a download
- **Responsive design** — Works across desktop and mobile

---

## Tech Stack

**Backend**
- Django 6 + Django REST Framework
- PostgreSQL
- JWT authentication (`djangorestframework-simplejwt`)
- Cloudinary (media storage in production)
- `cryptography` (Fernet encryption for private messages)

**Frontend**
- React (Vite)
- Tailwind CSS
- Axios (with request/response interceptors for auth)
- React Router

**Deployment**
- Backend + PostgreSQL: [Render](https://render.com)
- Frontend: [Vercel](https://vercel.com)
- Media storage: [Cloudinary](https://cloudinary.com)

---

## Project Structure

```
social_network/
├── accounts/              # Custom User model, auth, profile, private messaging
│   ├── models.py            # User, Message
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── posts/                  # Posts, reactions, comments
│   ├── models.py            # Post, PostReaction, Comment
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── config/                 # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── frontend/                # React application
│   └── src/
│       ├── api/axios.js       # Axios instance with JWT interceptors
│       └── pages/
│           ├── Signup.jsx
│           ├── Login.jsx
│           ├── Profile.jsx
│           └── Chat.jsx
├── manage.py
├── requirements.txt
├── Procfile                 # Render deployment config
└── .env                     # Local environment variables (not committed)
```

---

## Getting Started (Local Setup)

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL

### 1. Clone the repository
```bash
git clone https://github.com/ADARSHTHEDEVIL/Social-network-app.git
cd Social-network-app
```

### 2. Backend setup
```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

Create a `.env` file in the project root:
```
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=social_network_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
MESSAGE_ENCRYPTION_KEY=generate-with-command-below

# Optional — only needed if you want media files stored on Cloudinary locally.
# Without this, images/documents save to the local media/ folder instead.
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

Generate an encryption key for private messages:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Set up the database:
```bash
psql -U postgres
CREATE DATABASE social_network_db;
CREATE USER your_db_user WITH PASSWORD 'your_db_password';
GRANT ALL PRIVILEGES ON DATABASE social_network_db TO your_db_user;
```

Run migrations:
```bash
python manage.py migrate
python manage.py createsuperuser   # optional, for Django admin access
```

Start the backend:
```bash
python manage.py runserver
```
Runs at `http://127.0.0.1:8000/`

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:5173/`

### 4. Open the app
Visit `http://localhost:5173/signup`

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| POST | `/api/signup/` | No | Create a new account |
| POST | `/api/login/` | No | Log in, returns JWT tokens |
| GET | `/api/profile/` | Yes | Get current user's profile |
| PATCH | `/api/profile/` | Yes | Update profile (email is read-only) |
| GET | `/api/posts/` | Yes | List all posts |
| POST | `/api/posts/` | Yes | Create a post (supports image + document) |
| DELETE | `/api/posts/<id>/` | Yes | Delete your own post |
| POST | `/api/posts/<id>/react/` | Yes | Like/dislike a post (toggles) |
| GET | `/api/posts/<id>/comments/` | Yes | List comments on a post |
| POST | `/api/posts/<id>/comments/` | Yes | Add a comment |
| DELETE | `/api/comments/<id>/` | Yes | Delete your own comment |
| GET | `/api/conversations/` | Yes | List all conversations with unread counts |
| GET | `/api/conversations/<user_id>/` | Yes | Get message history with a user |
| POST | `/api/conversations/<user_id>/` | Yes | Send a message |
| GET | `/api/users/search/?q=` | Yes | Search users by name or email |

All protected endpoints require an `Authorization: Bearer <access_token>` header.

---

## Key Design Decisions

- **Custom User model** with email as the login field, set up before the first
  migration (required, since `AUTH_USER_MODEL` cannot change on an existing database).
- **JWT over session auth** — the frontend and backend are deployed on separate domains
  (Vercel and Render), so a stateless token-based approach avoids cross-domain cookie
  complications.
- **`PostReaction` as a dedicated table** with a `unique_together` constraint on
  `(post, user)`, rather than simple counters — this enforces one reaction per user per
  post at the database level and allows switching between like/dislike.
- **Server-side ownership checks** — deleting a post or comment verifies
  `author == request.user` in the view; hiding buttons in the UI is a convenience, not
  the actual security boundary.
- **Private messages encrypted at rest** using Fernet symmetric encryption. The
  encryption key lives only in an environment variable, never in code or the database.
- **Chat PIN lock is a client-side privacy convenience**, not a security mechanism —
  the real security for private messages comes from JWT authentication and encryption
  at rest.

---

## Known Limitations

- Private chat uses polling (checks for new messages every few seconds) rather than
  true real-time WebSockets, which would require Django Channels and a message broker.
- Render's free tier spins down after inactivity, causing a cold-start delay (~30-60s)
  on the first request after idle time.
- Document uploads require Cloudinary to be configured; without it, they fall back to
  local disk storage (fine for local development, not suitable for the ephemeral
  filesystem on most free hosting tiers).

---

## License

This project was built as a learning exercise / assignment submission.
