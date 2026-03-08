# Bitespeed Identity Reconciliation

A web service that identifies and links customer identities across multiple purchases based on shared email or phone number.

## 🔗 Live Demo
- **API:** https://bitespeed-identity-reconciliation-mjfs.onrender.com
- **Visualizer:** https://bitespeed-identity-reconciliation-mjfs.onrender.com
- **Swagger Docs:** https://bitespeed-identity-reconciliation-mjfs.onrender.com/api-docs

> ⚠️ Hosted on Render free tier — first request may take ~30s to wake up.

---

## 🛠️ Tech Stack
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **ORM/Migrations:** Prisma
- **Testing:** Jest
- **Frontend:** React + Vite

---

## 📡 API Reference

### `POST /identify`
Links a customer's identity based on email and/or phone number.

**Request:**
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [23]
  }
}
```

---

## 🔄 Identity Reconciliation Logic

- Every contact is either **primary** or **secondary**
- Contacts are linked if they share an email or phone number
- The **oldest** contact in a cluster is always the primary
- If two separate primary clusters get linked, the newer primary is **demoted** to secondary
- New information on an existing contact creates a new **secondary** contact

### Example

Two separate contacts exist:
```
id=11  email=george@hillvalley.edu  phone=919191  → primary
id=27  email=biffsucks@hillvalley.edu  phone=717171  → primary
```

Request comes in with:
```json
{ "email": "george@hillvalley.edu", "phoneNumber": "717171" }
```

Result — id=27 gets demoted, clusters merge under id=11:
```json
{
  "contact": {
    "primaryContatctId": 11,
    "emails": ["george@hillvalley.edu", "biffsucks@hillvalley.edu"],
    "phoneNumbers": ["919191", "717171"],
    "secondaryContactIds": [27]
  }
}
```

---

## 🚀 Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/identity-reconciliation
cd identity-reconciliation

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Fill in DATABASE_URL and TEST_DATABASE_URL

# 4. Run migrations
npx prisma migrate dev

# 5. Start dev server (backend + visualizer)
npm run dev
```

Backend runs on `http://localhost:3000`
Visualizer runs on `http://localhost:5173`

---

## 🧪 Running Tests

```bash
npm test
```

Tests cover:
- Creating a new primary contact
- Creating a secondary when new info matches existing contact
- Merging two separate primary clusters
- Exact match with no new info
- Only email provided
- Only phone number provided

---

## 📁 Project Structure

```
├── src/
│   ├── controllers/        # Request handlers
│   │   └── identifyController.js
│   ├── db/                 # Database connection
│   │   ├── index.js
│   │   └── testDb.js
│   ├── routes/             # Express routes
│   │   └── identify.js
│   ├── services/           # Business logic
│   │   └── contactService.js
│   ├── tests/              # Jest tests
│   │   └── identify.test.js
│   └── index.js            # Entry point
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Migration files
├── visualizer/             # React + Vite visualizer
├── .env.example
└── README.md
```

---

## 🌐 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `TEST_DATABASE_URL` | PostgreSQL connection string for tests |
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | Environment (`development` / `production` / `test`) |
