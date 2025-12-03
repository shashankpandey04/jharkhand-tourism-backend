# 🏞️ Jharkhand Tourism Backend

A role-based tourism platform backend built with **Node.js**, **Express**, and **MongoDB** to explore and manage places, hotels, blogs, and user interactions related to Jharkhand tourism.

---

## 🚀 Features

### 🔐 Authentication & Roles
- JWT-based auth
- Password hashing (bcrypt)
- User roles:
  - `user` — browse, review, comment
  - `hotel_owner` — list/manage own hotels
  - `contributor` — write blog posts
  - `moderator` — review/approve content
  - `admin` — full access

### 🏨 Hotel System
- Owners add hotels
- Admin/moderator approval
- Hotel images via Cloudinary
- Reviews & ratings

### 🗺️ Places to Visit
- Explore tourist spots
- Best time to visit
- Photos, descriptions

### 📰 Blogs & Travel Guides
- Contributors submit blogs
- Approval workflow
- Rich content

### ✉️ Feedback / Contact
- General user feedback
- Admin review panel

---

## 📂 Project Structure
server/
├── src
│ ├── config/ # DB, Cloudinary, etc.
│ ├── controllers/ # Business logic
│ ├── middleware/ # Auth, Roles, Validator
│ ├── models/ # Mongoose schemas
│ ├── routes/ # Express route definitions
│ ├── validations/ # Request validation
│ ├── utils/ # Helpers
│ ├── constants.js
│ ├── app.js
├── index.js
├── package.json
├── .env
└── README.md


---

## 🛠️ Tech Stack

**Backend:**
- Node.js
- Express.js
- MongoDB / Mongoose
- JWT
- Cloudinary
- Bcrypt
- Multer (File upload)

**Dev Tools**
- Nodemon
- ESLint / Prettier
- dotenv

---

## 📦 Installation

### 1️⃣ Clone the repository
```bash
git clone https://github.com/shashankpandey04/jharkhand-tourism-backend.git
cd jharkhand-tourism-backend
```

### 2️⃣ Install dependencies
```bash
npm install
```

### 3️⃣ Setup .env file
Create `.env` in root:
```ini
PORT=5000
MONGO_URI=your_mongo_connection_url
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=xyz
CLOUDINARY_API_KEY=123
CLOUDINARY_API_SECRET=abc
```

### ▶️ Run Project
> Development
```bash
npm run dev
```

> Production
```bash
npm start
```
