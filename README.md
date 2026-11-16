# Relay — AI-Powered Executive Email Workspace

A full-stack MERN implementation for the Humanity Founders AI Full-Stack Engineer Intern task. The app keeps the dashboard experience and adds a Node/Express API, MongoDB persistence, Google OAuth + Gmail integration, and live LLM-powered triage, summaries and reply drafting.

## Included features

- Executive inbox with the three requested triage queues: **Assistant to reply**, **Client to reply**, and **No reply needed**.
- Gmail account connection using Google OAuth 2.0; reads real inbox messages and can send email after the user reviews it.
- Inbox synchronization and MongoDB persistence for connected user and email metadata/content.
- LLM-powered email classification, priority, confidence, rationale, summary and recommended next step.
- AI-generated reply drafts and summaries, plus email-specific AI Q&A and manually correctable categories. Drafts are never sent automatically.
- Manual category filters, search, message detail, compose and send.
- Demo preview with sample messages before credentials are configured.
- Server-side API keys and Google OAuth secrets; optional AES-256-GCM encryption for Google tokens stored in MongoDB.

## Technology

- Frontend: React 18 + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- AI: OpenAI API (configurable model name)
- Email: Gmail API + Google OAuth 2.0

## Requirements

- Node.js 18 or newer and npm
- MongoDB local instance or MongoDB Atlas connection string
- Google Cloud project with Gmail API enabled and OAuth 2.0 Web application credentials
- OpenAI API key for live AI functions

## Setup (Windows PowerShell or terminal)

1. Extract the ZIP and open the `relay-updated` folder in VS Code.
2. Install root dependencies:

   ```bash
   npm install
   ```

3. Install backend and frontend dependencies:

   ```bash
   npm install --prefix server
   npm install --prefix client
   ```

4. Copy `server/.env.example` to `server/.env` and fill in your own values:

   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173
   MONGODB_URI=mongodb://127.0.0.1:27017/relay_email_assistant
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_MODEL=gpt-4o-mini
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
   OAUTH_STATE_SECRET=use_a_long_random_secret
   TOKEN_ENCRYPTION_KEY=optional_64_character_hex_key
   ```

   `TOKEN_ENCRYPTION_KEY` is optional for local testing. To enable token encryption, provide exactly 64 hexadecimal characters (32 bytes). Keep this value safe: losing it makes encrypted refresh tokens unreadable.

5. Configure Google OAuth:
   - Open Google Cloud Console and create/select a project.
   - Enable **Gmail API**.
   - Configure the OAuth consent screen and add your Google account as a test user while the app is in Testing mode.
   - Create an OAuth Client ID of type **Web application**.
   - Add this Authorized redirect URI exactly: `http://localhost:5000/api/auth/google/callback`.
   - Copy the Client ID and Client Secret into `server/.env`.
   - The requested scopes are `openid`, `email`, `profile`, `gmail.readonly`, and `gmail.send`.

6. Start MongoDB. If using Atlas, create a database user, allow your development IP, and paste the Atlas connection string into `MONGODB_URI`.
7. Start both apps from the project root:

   ```bash
   npm run dev
   ```

8. Open `http://localhost:5173`. Select **Connect Gmail**, authorize the Google account, and then click **Sync inbox**. Add the OpenAI key to enable AI analysis, summary and draft generation.

The frontend runs on port 5173 and the API runs on port 5000.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API/database/config status |
| GET | `/api/auth/google` | Begin Google OAuth |
| GET | `/api/auth/google/callback` | OAuth callback |
| GET | `/api/account` | Connected account |
| POST | `/api/sync` | Sync recent Gmail messages |
| GET | `/api/emails` | List stored messages |
| PATCH | `/api/emails/:id` | Update category/priority/read/starred fields |
| POST | `/api/emails/:id/analyze` | AI triage and classification |
| POST | `/api/emails/:id/summarize` | AI summary |
| POST | `/api/emails/:id/draft` | AI reply draft |
| POST | `/api/emails/:id/ask` | Ask a question about an email |
| POST | `/api/send` | Send reviewed email through Gmail |

Authenticated app API requests currently use the connected Mongo user ID in the `x-relay-user` header. This is a local internship-demo authentication shortcut, **not production-grade user authentication**. Replace it with secure server-side sessions or a verified identity provider before public deployment.

## Security and important notes

- Put real credentials only in `server/.env`. Never put API keys in React code, `VITE_` variables, screenshots, Git commits or a public repository.
- `.gitignore` excludes `.env` and dependencies. Commit `server/.env.example`, never `server/.env`.
- Gmail tokens are stored in MongoDB; set `TOKEN_ENCRYPTION_KEY` to encrypt them at rest. Protect database access and backups.
- This project requests Gmail read and send permissions. Use a test Google account during development and review the Google OAuth verification/testing requirements before external release.
- AI output can be wrong. A human must review every classification and draft. The app does not automatically send AI-generated replies.
- Gmail sync fetches up to 100 recent messages per request; this is a simple internship implementation, not incremental Pub/Sub sync.
- The account-ID header is only a development shortcut. Add real authentication, CSRF protection, rate limiting, audit logging, secure cookies, and per-user authorization before production.
- Do not upload `.env` or real email data in your submission ZIP/repository.

## Build and run separately

```bash
npm run build
npm start --prefix server
```

## Suggested submission walkthrough

1. Show the dashboard in preview mode.
2. Explain the three triage categories.
3. Connect a test Gmail account and sync messages.
4. Run AI analysis and show category, priority, summary and recommended action.
5. Generate a reply draft, edit it, and show the explicit human-review step before sending.
6. Explain the stack and where API keys are configured (`server/.env`, never frontend).

## Project structure

```text
relay-updated/
├── package.json
├── README.md
├── .gitignore
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/ (React UI)
└── server/
    ├── package.json
    ├── .env.example
    └── src/
        ├── index.js       # Express API
        ├── models.js      # MongoDB models
        ├── google.js      # OAuth, Gmail sync/send
        ├── ai.js          # OpenAI analysis/drafts/summaries
        └── security.js    # Optional token encryption
```
