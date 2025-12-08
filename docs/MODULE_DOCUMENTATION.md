# 📚 Module Documentation - Jharkhand Tourism Backend

Complete technical documentation for all modules in the backend system.

---

## Table of Contents

1. [Authentication Module](#authentication-module)
2. [Hotel Management Module](#hotel-management-module)
3. [Review System Module](#review-system-module)
4. [Blog Module](#blog-module)
5. [Places Module](#places-module)
6. [Feedback Module](#feedback-module)
7. [Core Middleware](#core-middleware)
8. [Utilities & Helpers](#utilities--helpers)

---

## Authentication Module

**Location:** `/src/controllers/auth.controller.js` | `/src/routes/auth.js` | `/src/middleware/auth.js`

### Overview

Handles user authentication, authorization, JWT token management, and user profile operations.

### Key Features

- User registration with validation
- Secure login with password comparison
- JWT token generation and refresh
- User profile management
- Password change functionality
- Admin user management

### Database Schema

```javascript
// User Model (/src/models/User.js)
{
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: String,
  avatar: String,
  role: {
    type: String,
    enum: ["user", "hotel_owner", "contributor", "moderator", "admin"],
    default: "user"
  },
  isVerified: Boolean,
  lastLogin: Date,
  deletedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Key Controllers

#### `register(req, res, next)`
**Purpose:** Create new user account

**Validation:**
- Name: 2-100 characters, letters only
- Email: Valid format, unique
- Password: Min 8 chars, must include uppercase, lowercase, number, special char
- Passwords must match

**Response:**
```javascript
{
  success: true,
  message: "User registered successfully",
  user: { ...userObject },
  token: "JWT_TOKEN"
}
```

#### `login(req, res, next)`
**Purpose:** Authenticate user and issue tokens

**Process:**
1. Find user by email
2. Compare password with bcrypt
3. Generate JWT tokens
4. Set httpOnly cookies
5. Return user + token

**Tokens:**
- Access Token: 7 days expiry
- Refresh Token: 30 days expiry

#### `getCurrentUser(req, res, next)`
**Purpose:** Retrieve current authenticated user's profile

**Protected:** Requires valid JWT token

**Response:** Complete user object (without password)

#### `updateProfile(req, res, next)`
**Purpose:** Update user profile information

**Fields:**
- name (optional)
- phone (optional, must be 10 digits)
- avatar (optional, URL)

**Protected:** Requires authentication

#### `changePassword(req, res, next)`
**Purpose:** Change user password

**Validation:**
- Current password must be correct
- New passwords must match
- Password strength requirements

**Protected:** Requires authentication

#### `getAllUsers(req, res, next)`
**Purpose:** List all users with filters

**Query Parameters:**
```
page: Number (default: 1)
limit: Number (default: 10)
role: String (filter by role)
search: String (search name or email)
```

**Protected:** Admin only

#### `updateUserRole(req, res, next)`
**Purpose:** Change user's role

**Body:**
```javascript
{
  role: "hotel_owner" // One of: user, hotel_owner, contributor, moderator, admin
}
```

**Protected:** Admin only

### Middleware Functions

#### `authenticate` (in `/src/middleware/auth.js`)
```javascript
export const authenticate = (req, res, next) => {
  // Checks Authorization header for Bearer token
  // Or authToken cookie
  // Verifies JWT signature
  // Sets req.user = decoded_token
}
```

#### `generateTokens` (in `/src/middleware/auth.js`)
```javascript
export const generateTokens = (userId, email, role) => {
  // Generates both access and refresh tokens
  // Returns { accessToken, refreshToken }
}
```

### Security Considerations

✅ Passwords hashed with bcrypt (10 salt rounds)  
✅ JWT signed with strong secret  
✅ Tokens stored in httpOnly, secure cookies  
✅ Email uniqueness enforced  
✅ Server-side password validation  
✅ Last login tracking  

### Error Handling

| Error | Status | Message |
|-------|--------|---------|
| Missing fields | 400 | "Please provide all required fields" |
| Email exists | 409 | "Email already registered" |
| Wrong password | 401 | "Invalid email or password" |
| Invalid token | 401 | "Invalid token. Please login again" |
| Token expired | 401 | "Token has expired. Please login again" |

---

## Hotel Management Module

**Location:** `/src/controllers/hotel.controller.js` | `/src/routes/hotel.js`

### Overview

Manages hotel listings, images, approvals, and ratings.

### Database Schema

```javascript
// Hotel Model (/src/models/Hotel.js)
{
  name: String (required, unique-ish),
  description: String (required, min 20 chars),
  owner: ObjectId (ref: User, required),
  location: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      type: "Point",
      coordinates: [longitude, latitude] // GeoJSON
    }
  },
  rating: {
    average: Number (0-5),
    count: Number
  },
  pricePerNight: Number (required),
  amenities: [String] (WiFi, Pool, Gym, etc.),
  images: [{
    url: String,
    publicId: String,
    alt: String
  }],
  rooms: {
    total: Number,
    available: Number
  },
  checkInTime: String (HH:MM),
  checkOutTime: String (HH:MM),
  policies: {
    cancellation: String,
    children: String,
    pets: String
  },
  status: String (pending, approved, rejected, suspended),
  rejectionReason: String,
  isFeatured: Boolean,
  reviews: [ObjectId],
  phone: String,
  website: String,
  email: String,
  tags: [String],
  deletedAt: Date
}
```

### Key Controllers

#### `createHotel(req, res, next)`
**Purpose:** Create new hotel listing

**Required Role:** hotel_owner, admin

**Body:**
```javascript
{
  name: "Hotel Name",
  description: "Detailed description...",
  location: {
    address: "123 Main St",
    city: "Ranchi",
    pincode: "834001"
  },
  pricePerNight: 5000,
  amenities: ["WiFi", "Pool"],
  phone: "9876543210",
  email: "info@hotel.com"
}
```

**Process:**
1. Validate all inputs
2. Create hotel document
3. Set status as "pending" (needs approval)
4. Return created hotel

**Status After Creation:** "pending" (requires admin approval)

#### `getAllHotels(req, res, next)`
**Purpose:** Get all approved hotels with advanced filtering

**Query Parameters:**
```
page: Number (default: 1)
limit: Number (default: 10)
city: String
minPrice: Number
maxPrice: Number
rating: Number (1-5)
amenities: String (comma-separated)
search: String
isFeatured: Boolean
```

**Response Includes:**
- Hotel details
- Owner information
- Associated reviews
- Pagination info

#### `getHotelById(req, res, next)`
**Purpose:** Get single hotel with full details

**Includes:**
- Owner details
- All reviews populated
- Images
- Rating statistics

**Side Effect:** Increments viewCount

#### `updateHotel(req, res, next)`
**Purpose:** Update hotel information

**Protected:** Owner or Admin

**Updateable Fields:**
- name
- description
- pricePerNight
- amenities
- location info
- policies

**Validation:** All updates re-validated

#### `uploadHotelImages(req, res, next)`
**Purpose:** Upload multiple hotel images

**Protected:** Owner or Admin

**Process:**
1. Validate files exist
2. Upload to Cloudinary
3. Store URLs in database
4. Return image metadata

**Limits:**
- Max 10MB per file
- Multiple files supported

#### `approveHotel(req, res, next)`
**Purpose:** Approve pending hotel (moderator only)

**Protected:** Moderator, Admin

**Action:** Changes status to "approved"

**Notification:** Should send email to hotel owner

#### `rejectHotel(req, res, next)`
**Purpose:** Reject hotel submission

**Protected:** Moderator, Admin

**Body:**
```javascript
{
  reason: "Rejection reason for owner..."
}
```

**Action:**
- Sets status to "rejected"
- Stores rejection reason

#### `searchNearbyHotels(req, res, next)`
**Purpose:** Find hotels by geographic location (Geospatial query)

**Query Parameters:**
```
longitude: Number (required)
latitude: Number (required)
maxDistance: Number (in meters, default: 10000)
```

**Uses:** MongoDB 2dsphere index

**Response:** Hotels sorted by distance

### Relationships

```
Hotel --> User (owner) [Many-to-One]
Hotel --> Review [One-to-Many]
Hotel --> Images [Embedded]
```

### Indexes

```javascript
// Auto-indexed in Mongoose
{ name: 1 }
{ "location.city": 1 }
{ owner: 1 }
{ status: 1 }
{ "location.coordinates": "2dsphere" } // Geospatial
```

### Error Handling

| Error | Status | Cause |
|-------|--------|-------|
| Hotel not found | 404 | Invalid hotel ID |
| No permission | 403 | Not owner or admin |
| Validation failed | 400 | Invalid input |
| Image upload failed | 500 | Cloudinary error |

---

## Review System Module

**Location:** `/src/controllers/review.controller.js` | `/src/routes/review.js`

### Overview

Manages user reviews for hotels with approval workflow and rating calculations.

### Database Schema

```javascript
// Review Model (/src/models/Review.js)
{
  title: String (required),
  content: String (required, min 20 chars),
  rating: Number (required, 1-5),
  author: ObjectId (ref: User, required),
  hotel: ObjectId (ref: Hotel, required),
  category: String (cleanliness, comfort, service, value, location, food),
  verified: Boolean (default: false),
  helpful: Number (default: 0),
  notHelpful: Number (default: 0),
  images: [{
    url: String,
    publicId: String
  }],
  status: String (pending, approved, rejected, hidden),
  moderationNotes: String,
  visitDate: Date,
  deletedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Key Controllers

#### `createReview(req, res, next)`
**Purpose:** Submit a review for a hotel

**Protected:** Authenticated user

**Validation:**
- User can only have ONE review per hotel
- Rating must be 1-5
- Title min 5 chars
- Content min 20 chars

**Body:**
```javascript
{
  title: "Amazing hotel!",
  content: "Great service, clean rooms...",
  rating: 5,
  hotel: "60d5ec49c1234567890abcd1",
  visitDate: "2024-01-10",
  category: "comfort"
}
```

**Status After Creation:** "pending" (needs moderation)

**Unique Constraint:** One review per (user, hotel)

#### `getHotelReviews(req, res, next)`
**Purpose:** Get all approved reviews for a hotel

**Query Parameters:**
```
page: Number (default: 1)
limit: Number (default: 10)
sortBy: String (createdAt, rating, helpful)
```

**Also Returns:**
- Rating distribution histogram
- Total review count
- Average rating

#### `approveReview(req, res, next)`
**Purpose:** Approve review for public display

**Protected:** Moderator, Admin

**Process:**
1. Set status to "approved"
2. Set verified = true
3. Recalculate hotel's average rating
4. Update hotel rating count

**Hotel Rating Update:**
```javascript
avgRating = sum(all_approved_reviews.rating) / count
hotel.rating.average = avgRating
hotel.rating.count = count
```

#### `markHelpful(req, res, next)`
**Purpose:** Mark review as helpful

**Protected:** Authenticated user

**Action:** Increments helpful count

**Side Effect:** Used for ranking reviews

#### `getPendingReviews(req, res, next)`
**Purpose:** Get reviews awaiting moderation

**Protected:** Moderator, Admin

**Sorted:** By createdAt ascending (oldest first)

**Includes:** Author and hotel details

#### `rejectReview(req, res, next)`
**Purpose:** Reject inappropriate review

**Protected:** Moderator, Admin

**Body:**
```javascript
{
  reason: "Reason for rejection..."
}
```

**Actions:**
- Sets status to "rejected"
- Stores moderation notes
- Hides from public view

### Review-Hotel Integration

When a review is approved:
```javascript
// Recalculate hotel rating
const reviews = Review.find({ 
  hotel: hotelId, 
  status: "approved" 
})

const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

Hotel.updateOne(
  { _id: hotelId },
  {
    "rating.average": Math.round(average * 10) / 10,
    "rating.count": reviews.length
  }
)
```

---

## Blog Module

**Location:** `/src/controllers/blog.controller.js` | `/src/routes/blog.js`

### Overview

Content management system for travel guides and blog posts with approval workflow.

### Database Schema

```javascript
// Blog Model (/src/models/Blog.js)
{
  title: String (required, min 10, max 200),
  slug: String (unique, auto-generated),
  content: String (required, min 100),
  excerpt: String (max 500),
  author: ObjectId (ref: User, required),
  category: String (enum: Travel Guide, Local Culture, etc.),
  tags: [String],
  featuredImage: {
    url: String,
    publicId: String,
    alt: String
  },
  images: [{
    url: String,
    publicId: String,
    alt: String,
    caption: String
  }],
  status: String (draft, pending, approved, published, rejected),
  rejectionReason: String,
  viewCount: Number (default: 0),
  likes: Number (default: 0),
  likedBy: [ObjectId],
  comments: [ObjectId],
  relatedPlaces: [ObjectId],
  publishedAt: Date,
  isFeatured: Boolean,
  readTime: Number (in minutes, auto-calculated),
  seoKeywords: [String],
  deletedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Key Controllers

#### `createBlog(req, res, next)`
**Purpose:** Create new blog post as draft

**Protected:** Contributor, Moderator, Admin

**Body:**
```javascript
{
  title: "10 Must-Visit Places in Jharkhand",
  content: "Long form content...",
  excerpt: "Short summary",
  category: "Travel Guide",
  tags: ["travel", "jharkhand"],
  relatedPlaces: ["place_id_1", "place_id_2"]
}
```

**Initial Status:** "draft"

**Author:** Automatically set from req.user

#### `submitBlogForApproval(req, res, next)`
**Purpose:** Submit draft blog for moderation

**Protected:** Author or Admin

**Process:**
1. Verify blog exists and user is author (or admin)
2. Change status from "draft" to "pending"
3. Save blog

**Status Change:** "draft" → "pending"

#### `getAllBlogs(req, res, next)`
**Purpose:** Get published blogs with advanced search

**Query Parameters:**
```
page: Number (default: 1)
limit: Number (default: 10)
category: String
search: String (searches title, content, tags)
sortBy: String (createdAt, viewCount, likes)
isFeatured: Boolean
```

**Only Returns:** Published blogs (status = "published")

**Includes:** Author details, comments count

#### `getBlog(req, res, next)`
**Purpose:** Get single blog by ID or slug

**Identifier:** Can be MongoDB ID or slug

**Side Effects:**
- Increments viewCount
- Populates comments with authors

**Examples:**
```
GET /api/blogs/507f1f77bcf86cd799439011  (by ID)
GET /api/blogs/10-must-visit-places-in-jharkhand  (by slug)
```

#### `likeBlog(req, res, next)`
**Purpose:** Like or unlike a blog

**Protected:** Authenticated user

**Toggle:**
- If already liked: Remove like, decrement count
- If not liked: Add like, increment count

**Response:** New like count

#### `approveBlog(req, res, next)`
**Purpose:** Approve blog for publication

**Protected:** Moderator, Admin

**Process:**
1. Set status to "published"
2. Set publishedAt timestamp
3. Update blog document

**Status:** "pending" → "published"

#### `updateBlog(req, res, next)`
**Purpose:** Update blog content

**Protected:** Author or Admin

**Updateable Fields:**
- title (regenerates slug if changed)
- content (recalculates readTime if changed)
- category
- tags
- excerpt

**Read Time Calculation:**
```javascript
readTime = Math.ceil(wordCount / 200) // ~200 words per minute
```

### Slug Generation

Auto-generated from title:
```javascript
"Top 10 Places to Visit" 
  → "top-10-places-to-visit"

// Process:
// 1. Lowercase
// 2. Remove special characters
// 3. Replace spaces with hyphens
// 4. Remove duplicate hyphens
```

### Categories

- Travel Guide
- Local Culture
- Adventure
- Nature
- Food
- History
- Events
- Tips
- Other

---

## Places Module

**Location:** `/src/controllers/place.controller.js` | `/src/routes/place.js`

### Overview

Tourist destination directory with geospatial search and verification workflow.

### Database Schema

```javascript
// Place Model (/src/models/Place.js)
{
  name: String (required),
  slug: String (unique, auto-generated),
  description: String (required, min 50),
  location: {
    address: String,
    city: String,
    district: String,
    coordinates: {
      type: "Point",
      coordinates: [longitude, latitude]
    }
  },
  category: String (enum: Temple, Waterfall, National Park, etc.),
  images: [{
    url: String,
    publicId: String,
    alt: String
  }],
  bestTimeToVisit: {
    startMonth: Number (1-12),
    endMonth: Number (1-12),
    description: String
  },
  entryFee: Number (default: 0),
  entryFeeDescription: String,
  rating: {
    average: Number (0-5),
    count: Number
  },
  timings: {
    opening: String (HH:MM),
    closing: String (HH:MM),
    note: String
  },
  nearbyPlaces: [ObjectId],
  tags: [String],
  highlights: [String],
  accessibility: {
    wheelchair: Boolean,
    parking: Boolean,
    publicTransport: Boolean,
    guide: Boolean
  },
  verified: Boolean (default: false),
  viewCount: Number (default: 0),
  isFeatured: Boolean,
  addedBy: ObjectId (ref: User),
  deletedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Key Controllers

#### `createPlace(req, res, next)`
**Purpose:** Add new tourist destination

**Protected:** Authenticated user (can be any role)

**Body:**
```javascript
{
  name: "Jamshedpur Zoo",
  description: "Famous zoo with diverse animal species...",
  city: "Jamshedpur",
  district: "East Singhbhum",
  category: "Wildlife",
  entryFee: 50,
  highlights: ["Tiger", "Leopard", "Deer"],
  tags: ["zoo", "wildlife", "family"],
  accessibility: {
    wheelchair: true,
    parking: true,
    publicTransport: true,
    guide: true
  }
}
```

**Verified Status:**
- If creator is admin: verified = true
- Otherwise: verified = false

#### `getAllPlaces(req, res, next)`
**Purpose:** Get all places with filters

**Query Parameters:**
```
page: Number
limit: Number
city: String
category: String
search: String
verified: Boolean
isFeatured: Boolean
```

**Categories:**
- Temple
- Waterfall
- National Park
- Wildlife
- Museum
- Historical
- Adventure
- Beach
- Hill Station
- Other

#### `searchNearbyPlaces(req, res, next)`
**Purpose:** Geospatial search for nearby places

**Query Parameters:**
```
longitude: Number (required)
latitude: Number (required)
maxDistance: Number (in meters, default: 10000)
```

**Uses:** MongoDB 2dsphere geospatial index

**Returns:** Sorted by distance (closest first)

#### `verifyPlace(req, res, next)`
**Purpose:** Mark place as verified by admin

**Protected:** Admin only

**Action:** Sets verified = true

### Geospatial Features

#### Creating Coordinates

```javascript
location.coordinates = {
  type: "Point",
  coordinates: [85.2817, 23.3441] // [longitude, latitude]
}
```

#### Query Example

```javascript
const places = await Place.find({
  "location.coordinates": {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [85.2817, 23.3441]
      },
      $maxDistance: 10000 // meters
    }
  }
})
```

---

## Feedback Module

**Location:** `/src/controllers/feedback.controller.js` | `/src/routes/feedback.js`

### Overview

User feedback collection and admin management system with ticket workflow.

### Database Schema

```javascript
// Feedback Model (/src/models/Feedback.js)
{
  name: String (required),
  email: String (required, unique per feedback),
  phone: String,
  subject: String (required, min 5),
  message: String (required, min 20, max 5000),
  category: String (bug, suggestion, complaint, partnership, other),
  attachments: [{
    url: String,
    publicId: String,
    fileName: String
  }],
  rating: Number (1-5, optional),
  user: ObjectId (ref: User, optional),
  status: String (new, in-progress, resolved, closed),
  priority: String (low, medium, high, critical),
  assignedTo: ObjectId (ref: User),
  responses: [{
    responder: ObjectId,
    message: String,
    createdAt: Date
  }],
  internalNotes: String,
  deletedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Key Controllers

#### `createFeedback(req, res, next)`
**Purpose:** Submit user feedback (public)

**No Auth Required**

**Body:**
```javascript
{
  name: "John Doe",
  email: "john@example.com",
  phone: "9876543210",
  subject: "Suggestion",
  message: "Consider adding...",
  category: "suggestion",
  rating: 5
}
```

**Initial Status:** "new"
**Initial Priority:** "medium"

#### `getAllFeedback(req, res, next)`
**Purpose:** Admin dashboard - view all feedback

**Protected:** Moderator, Admin

**Query Parameters:**
```
page: Number
limit: Number
status: String (new, in-progress, resolved, closed)
category: String
priority: String (low, medium, high, critical)
```

**Includes:** Responder details, assignment info

#### `updateFeedbackStatus(req, res, next)`
**Purpose:** Change feedback status and priority

**Protected:** Moderator, Admin

**Body:**
```javascript
{
  status: "in-progress",
  priority: "high"
}
```

**Valid Statuses:** "new", "in-progress", "resolved", "closed"
**Valid Priorities:** "low", "medium", "high", "critical"

#### `assignFeedback(req, res, next)`
**Purpose:** Assign feedback to team member

**Protected:** Admin

**Body:**
```javascript
{
  assignedTo: "60d5ec49c1234567890abcd1" // User ID
}
```

#### `addResponse(req, res, next)`
**Purpose:** Add response to user feedback

**Protected:** Moderator, Admin

**Body:**
```javascript
{
  message: "Thank you for your feedback. We will look into this..."
}
```

**Process:**
1. Add response with responder ID
2. Timestamp automatically added
3. Store in responses array

#### `getFeedbackStats(req, res, next)`
**Purpose:** Get analytics dashboard

**Protected:** Admin

**Returns:**
```javascript
{
  byStatus: [
    { _id: "new", count: 15 },
    { _id: "in-progress", count: 8 }
  ],
  byCategory: [...],
  byPriority: [...],
  avgRating: [{ average: 4.2 }],
  total: [{ total: 45 }]
}
```

### Categories

- **bug** - Technical issues
- **suggestion** - Feature requests
- **complaint** - User complaints
- **partnership** - Business inquiries
- **other** - General feedback

### Workflow

```
User submits feedback
         ↓
Admin receives (status: "new")
         ↓
Admin assigns to team member
         ↓
Status changes to "in-progress"
         ↓
Team member adds responses
         ↓
Issue resolved
         ↓
Status changes to "resolved"
         ↓
Admin closes ticket (status: "closed")
```

---

## Core Middleware

### Error Handler (`/src/middleware/errorHandler.js`)

#### `errorHandler(err, req, res, next)`

**Handles:**
- Validation errors (400)
- Duplicate key errors (409)
- JWT errors (401)
- Cast errors (400)
- Multer upload errors (400)
- Custom AppError

**Error Response Format:**
```javascript
{
  success: false,
  message: "Error description",
  errors: { fieldName: "error detail" }
}
```

#### `catchAsyncErrors(fn)`

**Wraps async controllers:**
```javascript
export const getHotels = catchAsyncErrors(async (req, res, next) => {
  // async code
  // errors automatically passed to error handler
})
```

#### `AppError` Class

```javascript
throw new AppError("Message", 400)
// Automatically handled by errorHandler
```

### Role-Based Access (`/src/middleware/roles.js`)

#### `authorizeRoles(...allowedRoles)`

**Usage:**
```javascript
router.post(
  "/hotels",
  authenticate,
  authorizeRoles("hotel_owner", "admin"),
  controller
)
```

**Checks:** req.user.role is in allowed list

#### `isAdmin`

**Usage:**
```javascript
router.delete("/users/:id", authenticate, isAdmin, controller)
```

**Checks:** req.user.role === "admin"

#### `isApprover`

**Checks:** req.user.role is "admin" or "moderator"

### Request Validation (`/src/middleware/validator.js`)

#### `validateRequest(schema)`

**Usage:**
```javascript
router.post(
  "/auth/register",
  validateRequest(authValidations.register),
  controller
)
```

**Validates:**
- Required fields
- Data types
- Min/max lengths
- Patterns (regex)
- Enum values
- Field matching

**Error Response (400):**
```javascript
{
  success: false,
  message: "Validation failed",
  errors: {
    email: "Invalid email format",
    password: "Passwords do not match"
  }
}
```

---

## Utilities & Helpers

### Cloudinary Integration (`/src/config/cloudinary.js`)

#### `uploadImage(filePath, folder)`

**Purpose:** Upload image to Cloudinary

**Parameters:**
- filePath: Local file path
- folder: Cloudinary folder (default: "jharkhand")

**Returns:**
```javascript
{
  secure_url: "https://res.cloudinary.com/...",
  public_id: "jharkhand/image_name",
  format: "jpg"
}
```

**Usage in Controllers:**
```javascript
const result = await uploadImage(req.file.path, `hotels/${hotelId}`)
```

#### `deleteImage(publicId)`

**Purpose:** Delete image from Cloudinary

**Parameters:**
- publicId: Cloudinary public ID

**Returns:** Deletion result

#### `getImageUrl(publicId, options)`

**Purpose:** Generate optimized image URL

**Options:** Transform parameters (width, height, quality, etc.)

### Validation Schemas (`/src/utils/validation.schemas.js`)

**Structure:**
```javascript
{
  fieldName: {
    required: Boolean,
    type: String,
    minLength: Number,
    maxLength: Number,
    pattern: RegExp,
    enum: Array,
    match: String // matches another field
  }
}
```

**Validation Types:**
- email: Email format validation
- number: Numeric validation
- objectId: MongoDB ID format
- url: URL format
- date: Date format

### Authentication Helpers (`/src/middleware/auth.js`)

#### `generateTokens(userId, email, role)`

**Returns:**
```javascript
{
  accessToken: "JWT_PAYLOAD", // 7 days
  refreshToken: "JWT_PAYLOAD" // 30 days
}
```

#### `authenticate(req, res, next)`

**Verifies:** JWT token from headers or cookies

**Sets:** req.user = decoded token payload

---

## Database Indexes

**Auto-indexed in Mongoose schemas:**

```javascript
// User
{ email: 1 } // Unique

// Hotel
{ name: 1 }
{ "location.city": 1 }
{ owner: 1 }
{ status: 1 }
{ "location.coordinates": "2dsphere" } // Geospatial

// Review
{ author: 1, hotel: 1 } // Compound
{ hotel: 1 }
{ status: 1 }

// Blog
{ slug: 1 } // Unique
{ author: 1 }
{ status: 1 }

// Place
{ slug: 1 } // Unique
{ "location.city": 1 }
{ "location.coordinates": "2dsphere" }

// Feedback
{ email: 1 }
{ status: 1, createdAt: -1 }
{ user: 1 }
```

---

## Data Flow Examples

### Hotel Creation Flow

```
1. Hotel Owner POST /api/hotels
   ↓
2. authenticate middleware checks JWT
   ↓
3. authorizeRoles checks role (hotel_owner)
   ↓
4. validateRequest validates input
   ↓
5. createHotel controller:
   - Create hotel document
   - Set status: "pending"
   - Set owner: req.user.id
   ↓
6. Return hotel with status: pending
   ↓
7. Admin reviews: PUT /api/hotels/:id/approve
   ↓
8. Status changes to "approved"
   ↓
9. Hotel appears in getAllHotels results
```

### Review Approval Flow

```
1. User creates review: POST /api/reviews
   ↓
2. Review created with status: "pending"
   ↓
3. Moderator gets pending: GET /api/reviews/moderator/pending
   ↓
4. Moderator approves: PUT /api/reviews/:id/approve
   ↓
5. Review status → "approved", verified → true
   ↓
6. Hotel rating recalculated:
   - Get all approved reviews for hotel
   - Calculate average rating
   - Update hotel.rating.average
   ↓
7. Review visible in public review list
```

### Blog Publishing Flow

```
1. Contributor creates: POST /api/blogs
   ↓
2. Blog created with status: "draft"
   ↓
3. Contributor edits and submits: POST /api/blogs/:id/submit
   ↓
4. Status changes: "draft" → "pending"
   ↓
5. Moderator gets pending: GET /api/blogs/moderator/pending
   ↓
6. Moderator approves: PUT /api/blogs/:id/approve
   ↓
7. Status changes: "pending" → "published"
   ↓
8. publishedAt timestamp set
   ↓
9. Blog appears in public list with viewCount tracking
```

---

## Performance Optimization

### Pagination

All list endpoints implement pagination:
```javascript
const skip = (page - 1) * limit
const items = await Model.find(query).skip(skip).limit(limit)
```

### Indexing

- Frequently queried fields have indexes
- Compound indexes for common filter combinations
- Geospatial indexes for location queries

### Lean Queries

Use `.lean()` for read-only operations to skip Mongoose overhead

### Population

Limit populated fields:
```javascript
.populate("author", "name avatar email")  // Only these fields
```

### Caching

Consider implementing Redis for:
- Frequently accessed hotels
- Blog posts
- User profiles

---

## Testing Checklist

- [ ] Register new user
- [ ] Login with correct credentials
- [ ] Login fails with wrong password
- [ ] Create hotel as hotel_owner
- [ ] Approve hotel as admin
- [ ] Create review for hotel
- [ ] Get hotel reviews with pagination
- [ ] Create blog as contributor
- [ ] Submit blog for approval
- [ ] Approve blog as moderator
- [ ] Search hotels with filters
- [ ] Search nearby places
- [ ] Submit feedback
- [ ] Get feedback stats (admin)
- [ ] Update feedback status
- [ ] Upload images to hotel
- [ ] Delete image from hotel

---

## Deployment Checklist

- [ ] All environment variables configured
- [ ] MongoDB connection string verified
- [ ] Cloudinary credentials working
- [ ] JWT secrets strong (32+ chars)
- [ ] HTTPS enabled
- [ ] CORS origins updated for production
- [ ] Rate limiting appropriate
- [ ] Error logging configured
- [ ] Database backups scheduled
- [ ] Security headers checked
- [ ] XSS protection enabled
- [ ] CSRF protection (if needed)
- [ ] Input validation tested
- [ ] File upload limits set

---

**Documentation Version:** 1.0  
**Last Updated:** January 2024  
**Status:** Complete
