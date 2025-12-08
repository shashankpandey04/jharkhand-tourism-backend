# 🏞️ Jharkhand Tourism Backend

A **production-grade** tourism platform backend built with **Node.js**, **Express**, and **MongoDB** for exploring and managing places, hotels, blogs, reviews, and user interactions related to Jharkhand tourism.

---

## 🚀 Features

### 🔐 Authentication & Authorization
- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Email-based login & registration
- Role-based access control (RBAC)
- User profile management
- Password change & reset

### 👥 User Roles
- **user** — Browse content, write reviews, submit feedback
- **hotel_owner** — List and manage own hotels
- **contributor** — Write and submit blog posts
- **moderator** — Review and approve content
- **admin** — Full system access

### 🏨 Hotel Management System
- Hotel owners add/update listings
- Admin/moderator approval workflow
- Rich hotel details (amenities, pricing, policies)
- Multiple image uploads via Cloudinary
- Hotel ratings and reviews system
- Geospatial search (nearby hotels)
- Featured hotels promotion

### ⭐ Reviews & Ratings
- User reviews with ratings (1-5 stars)
- Review approval workflow
- Helpful/not helpful voting
- Rating distribution analytics
- Verified reviews badge

### 📰 Blog & Travel Guides
- Contributors write travel content
- Draft, pending, and published states
- Auto-generated blog slugs
- Featured content support
- Category organization
- Like system for readers
- Read time calculation
- Content moderation

### 🗺️ Places Directory
- Tourist destination listings
- Multiple categories (Waterfall, Temple, etc.)
- Entry fee information
- Best time to visit guidance
- Image galleries
- Geospatial search
- Accessibility information

### ✉️ Feedback System
- User feedback collection
- Admin dashboard for feedback management
- Priority and status tracking
- Response system for users
- Internal notes for staff
- Statistics and analytics

### 💳 Booking & Payment System
- User hotel reservations with date ranges
- Real-time availability checking
- Booking confirmation & cancellation
- Secure payment processing integration
- Payment status tracking and receipts
- Booking history management

### 📦 Packages & Rooms
- Hotel package bundles and offerings
- Room inventory management
- Room type categorization
- Occupancy tracking
- Dynamic pricing support

### 🗓️ Travel Itineraries
- Create custom travel plans
- Multi-day itinerary builder
- Place integration in itineraries
- Timeline management

### 💬 Comments & Interactions
- Nested comments on places and blogs
- User engagement tracking
- Comment moderation

### 🔒 Security & Performance
- Helmet.js for security headers
- CORS protection
- Rate limiting (200 requests/15 min)
- XSS protection
- NoSQL injection prevention (sanitization)
- Compression enabled
- httpOnly secure cookies

---

## 📂 Project Structure

```
jharkhand-tourism-backend/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── cloudinary.js      # Image upload configuration
│   │
│   ├── controllers/
│   │   ├── auth.controller.js       # Authentication logic
│   │   ├── hotel.controller.js      # Hotel operations
│   │   ├── room.controller.js       # Room management
│   │   ├── booking.controller.js    # Booking operations
│   │   ├── payment.controller.js    # Payment processing
│   │   ├── package.controller.js    # Package management
│   │   ├── review.controller.js     # Review management
│   │   ├── blog.controller.js       # Blog operations
│   │   ├── place.controller.js      # Place management
│   │   └── feedback.controller.js   # Feedback handling
│   │
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   ├── errorHandler.js    # Error handling
│   │   ├── roles.js           # Role-based access
│   │   └── validator.js       # Request validation
│   │
│   ├── models/
│   │   ├── User.js            # User schema
│   │   ├── Hotel.js           # Hotel schema
│   │   ├── Room.js            # Room schema
│   │   ├── Booking.js         # Booking schema
│   │   ├── Payment.js         # Payment schema
│   │   ├── Package.js         # Package schema
│   │   ├── Review.js          # Review schema
│   │   ├── Blog.js            # Blog schema
│   │   ├── Place.js           # Place schema
│   │   ├── Itinerary.js       # Itinerary schema
│   │   ├── Feedback.js        # Feedback schema
│   │   └── Comment.js         # Comment schema
│   │
│   ├── routes/
│   │   ├── auth.js            # Auth endpoints
│   │   ├── hotel.js           # Hotel endpoints
│   │   ├── room.js            # Room endpoints
│   │   ├── booking.js         # Booking endpoints
│   │   ├── payment.js         # Payment endpoints
│   │   ├── package.js         # Package endpoints
│   │   ├── review.js          # Review endpoints
│   │   ├── blog.js            # Blog endpoints
│   │   ├── place.js           # Place endpoints
│   │   └── feedback.js        # Feedback endpoints
│   │
│   ├── utils/
│   │   ├── auth.validation.js       # Auth validation schemas
│   │   ├── hotel.validation.js      # Hotel validation schemas
│   │   ├── place.validation.js      # Place validation schemas
│   │   └── validation.schemas.js    # General validation rules
│   │
│   ├── app.js                 # Express app setup
│   └── constant.js            # Constants
│
├── docs/
│   ├── API_DOCUMENTATION.md           # Complete API documentation
│   ├── BOOKING_SYSTEM_COMPLETE.md     # Booking system details
│   ├── MODULE_DOCUMENTATION.md        # Module documentation
│   ├── PROJECT_COMPLETION.md          # Project completion status
│   └── QUICK_REFERENCE.md             # Quick reference guide
│
├── index.js                   # Server entry point
├── package.json               # Dependencies
├── README.md                  # This file
└── .env.example               # Environment variables template
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 16+ |
| **Framework** | Express.js |
| **Database** | MongoDB with Mongoose |
| **Authentication** | JWT + bcrypt |
| **Image Storage** | Cloudinary |
| **Security** | Helmet, CORS, Rate Limiting |
| **Validation** | Custom middleware |
| **Dev Tools** | Nodemon, Prettier, ESLint |

---

## 📋 Prerequisites

- Node.js 16.x or higher
- MongoDB 4.4 or higher
- Cloudinary account (for image uploads)
- npm or yarn

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/shashankpandey04/jharkhand-tourism-backend.git
cd jharkhand-tourism-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/jharkhand-tourism

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Client
CLIENT_URL=http://localhost:5173
```

### 4. Start MongoDB

```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (update MONGO_URI in .env)
```

### 5. Run the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:5000`

---

## 🧪 Testing

### Test the API health check:

```bash
curl http://localhost:5000/api
```

### Register a user:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass@123",
    "confirmPassword": "SecurePass@123"
  }'
```

### Login:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass@123"
  }'
```

### Get all hotels:

```bash
curl "http://localhost:5000/api/hotels?city=Ranchi&minPrice=2000&maxPrice=10000"
```

---

## 📚 API Documentation

Complete API documentation with examples is available in **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

#### Hotels
- `GET /api/hotels` - List all hotels (with filters)
- `POST /api/hotels` - Create hotel (hotel_owner)
- `GET /api/hotels/:id` - Get hotel details
- `PUT /api/hotels/:id` - Update hotel (owner)
- `DELETE /api/hotels/:id` - Delete hotel (owner)

#### Rooms
- `GET /api/rooms` - List all rooms
- `POST /api/rooms` - Create room (hotel_owner)
- `GET /api/rooms/:id` - Get room details
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

#### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

#### Payments
- `POST /api/payments` - Process payment
- `GET /api/payments/:bookingId` - Get payment details
- `PUT /api/payments/:id/status` - Update payment status

#### Packages
- `GET /api/packages` - List all packages
- `POST /api/packages` - Create package
- `GET /api/packages/:id` - Get package details
- `PUT /api/packages/:id` - Update package
- `DELETE /api/packages/:id` - Delete package

#### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/:hotelId/reviews` - Get hotel reviews
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

#### Blogs
- `GET /api/blogs` - Get all published blogs
- `POST /api/blogs` - Create blog (contributor)
- `GET /api/blogs/:id` - Get blog details
- `POST /api/blogs/:id/submit` - Submit for approval
- `POST /api/blogs/:id/like` - Like blog

#### Places
- `GET /api/places` - List all places
- `POST /api/places` - Add place
- `GET /api/places/:id` - Get place details
- `GET /api/places/city/:city` - Places by city

#### Feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback` - Get all feedback (admin)
- `PUT /api/feedback/:id/status` - Update status (admin)

---

## 🔑 Authentication

### JWT Flow

1. User registers/logs in
2. Server generates access token (7 days) and refresh token (30 days)
3. Tokens stored in httpOnly cookies
4. Client sends access token in `Authorization: Bearer <token>` header
5. Server verifies token and processes request

### Token Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📊 Database Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum),
  phone: String,
  avatar: String,
  isVerified: Boolean,
  lastLogin: Date,
  timestamps: true
}
```

### Hotel
```javascript
{
  name: String,
  description: String,
  owner: ObjectId (ref: User),
  location: { address, city, coordinates },
  pricePerNight: Number,
  amenities: [String],
  images: [{ url, publicId, alt }],
  rating: { average, count },
  status: String (enum),
  reviews: [ObjectId],
  timestamps: true
}
```

### Review
```javascript
{
  title: String,
  content: String,
  rating: Number (1-5),
  author: ObjectId (ref: User),
  hotel: ObjectId (ref: Hotel),
  status: String (enum),
  helpful: Number,
  notHelpful: Number,
  timestamps: true
}
```

### Blog
```javascript
{
  title: String,
  slug: String (unique),
  content: String,
  author: ObjectId (ref: User),
  category: String,
  status: String (enum),
  viewCount: Number,
  likes: Number,
  tags: [String],
  publishedAt: Date,
  readTime: Number,
  timestamps: true
}
```

### Place
```javascript
{
  name: String,
  slug: String (unique),
  description: String,
  location: { city, coordinates },
  category: String,
  entryFee: Number,
  images: [{ url, publicId }],
  verified: Boolean,
  viewCount: Number,
  timestamps: true
}
```

### Feedback
```javascript
{
  name: String,
  email: String,
  subject: String,
  message: String,
  category: String,
  status: String (enum),
  priority: String (enum),
  assignedTo: ObjectId (ref: User),
  responses: [{ responder, message, date }],
  timestamps: true
}
```

### Room
```javascript
{
  hotel: ObjectId (ref: Hotel),
  roomType: String,
  roomNumber: String,
  capacity: Number,
  basePrice: Number,
  images: [{ url, publicId }],
  amenities: [String],
  isAvailable: Boolean,
  timestamps: true
}
```

### Booking
```javascript
{
  user: ObjectId (ref: User),
  room: ObjectId (ref: Room),
  checkInDate: Date,
  checkOutDate: Date,
  totalGuests: Number,
  totalPrice: Number,
  status: String (enum),
  specialRequests: String,
  timestamps: true
}
```

### Payment
```javascript
{
  booking: ObjectId (ref: Booking),
  amount: Number,
  paymentMethod: String,
  transactionId: String,
  status: String (enum),
  paymentDate: Date,
  timestamps: true
}
```

### Package
```javascript
{
  name: String,
  description: String,
  price: Number,
  duration: Number,
  places: [ObjectId (ref: Place)],
  hotels: [ObjectId (ref: Hotel)],
  images: [{ url, publicId }],
  itinerary: [String],
  status: String (enum),
  timestamps: true
}
```

### Itinerary
```javascript
{
  title: String,
  user: ObjectId (ref: User),
  startDate: Date,
  endDate: Date,
  places: [ObjectId (ref: Place)],
  activities: [{ day, description }],
  notes: String,
  timestamps: true
}
```

---

## 🔒 Security Features

✅ **HTTPS/TLS** - Use in production  
✅ **Password Hashing** - bcrypt with salt rounds  
✅ **JWT Expiration** - Tokens expire (7 days access, 30 days refresh)  
✅ **Rate Limiting** - 200 requests per 15 minutes per IP  
✅ **CORS** - Configured for frontend URL  
✅ **XSS Protection** - XSS-clean middleware  
✅ **NoSQL Injection** - mongo-sanitize middleware  
✅ **HTTP Headers** - Helmet.js  
✅ **Input Validation** - Server-side validation  
✅ **Role-based Access** - Middleware checks  

---

## 🚀 Deployment

### Environment Setup

Before deployment:

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure Cloudinary securely
4. Set proper CORS origins
5. Use MongoDB Atlas (managed service)
6. Enable HTTPS/TLS

### Deploy on Heroku

```bash
# Install Heroku CLI
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set MONGO_URI=your_mongodb_url
heroku config:set JWT_SECRET=your_secret
heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name

# Deploy
git push heroku main
```

---

## 📈 Performance Tips

- Use CDN for Cloudinary images
- Enable MongoDB indexes
- Implement pagination (default limit: 10)
- Cache frequently accessed data
- Use compression middleware
- Monitor database queries
- Set up monitoring/logging

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Check MongoDB is running: `mongod`
- Verify MONGO_URI in .env
- Check MongoDB credentials if using Atlas

### Cloudinary Upload Failed
- Verify API credentials
- Check image size (max 10MB)
- Ensure folder name is valid

### JWT Errors
- Token may be expired - refresh it
- Check JWT_SECRET is the same
- Clear cookies and re-login

### CORS Issues
- Add frontend URL to CORS origins in app.js
- Check cookies: credentials: true

---

## 📞 Support & Contribution

### Report Issues
- GitHub: [Issues](https://github.com/shashankpandey04/jharkhand-tourism-backend/issues)

### Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

**Shashank Pandey**
- GitHub: [@shashankpandey04](https://github.com/shashankpandey04)

---

**Last Updated:** December 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅

---

## 📖 Documentation

For more detailed information, refer to the documentation files:
- **[API Documentation](./docs/API_DOCUMENTATION.md)** - Complete API endpoint reference
- **[Booking System](./docs/BOOKING_SYSTEM_COMPLETE.md)** - Booking and payment system details
- **[Module Documentation](./docs/MODULE_DOCUMENTATION.md)** - Individual module guides
- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Quick lookup guide
- **[Project Completion](./docs/PROJECT_COMPLETION.md)** - Project status and features
