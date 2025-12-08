# 🏞️ Jharkhand Tourism Backend - API Documentation

## Overview

Complete REST API for a production-grade Jharkhand Tourism platform with role-based access control, content management, hotel booking integration, and user feedback system.

**Version:** 1.0.0  
**Base URL:** `http://localhost:5000/api`  
**Authentication:** JWT (Bearer Token)

---

## Table of Contents

1. [Authentication Module](#authentication-module)
2. [Hotel Management](#hotel-management)
3. [Reviews System](#reviews-system)
4. [Blog/Travel Guides](#blogtrav-guides)
5. [Places Module](#places-module)
6. [Feedback System](#feedback-system)
7. [Error Handling](#error-handling)
8. [User Roles](#user-roles)

---

## Authentication Module

### User Roles

- **user**: Regular user - browse, review, provide feedback
- **hotel_owner**: Can add and manage hotels
- **contributor**: Can write and submit blogs
- **moderator**: Review and approve content (blogs, reviews, hotels)
- **admin**: Full system access, user management

### Register User

**POST** `/auth/register`

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "confirmPassword": "SecurePass@123",
  "role": "user"
}
```

**Response (201)**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isVerified": false,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login User

**POST** `/auth/login`

```json
{
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```

**Response (200)**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "lastLogin": "2024-01-15T11:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note:** Token is also set in `authToken` httpOnly cookie

### Get Current User

**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "avatar": "https://cloudinary.com/...",
    "role": "user",
    "isVerified": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Update Profile

**PUT** `/auth/update-profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "John Updated",
  "phone": "9876543210",
  "avatar": "https://cloudinary.com/image.jpg"
}
```

**Response (200)**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {...}
}
```

### Change Password

**POST** `/auth/change-password`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "oldPassword": "OldPass@123",
  "newPassword": "NewSecure@123",
  "confirmPassword": "NewSecure@123"
}
```

**Response (200)**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Logout

**POST** `/auth/logout`

**Response (200)**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Admin: Get All Users

**GET** `/auth/users?page=1&limit=10&role=user&search=john`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 10) - Items per page
- `role` - Filter by role (user, hotel_owner, contributor, moderator, admin)
- `search` - Search by name or email

**Response (200)**
```json
{
  "success": true,
  "users": [...],
  "totalPages": 5,
  "currentPage": 1,
  "total": 47
}
```

---

## Hotel Management

### Create Hotel (hotel_owner)

**POST** `/hotels`

**Headers:**
```
Authorization: Bearer <hotel_owner_token>
```

**Body:**
```json
{
  "name": "Taj Hotel",
  "description": "A luxury 5-star hotel with modern amenities in the heart of Ranchi",
  "location": {
    "address": "123 Main Street",
    "city": "Ranchi",
    "state": "Jharkhand",
    "pincode": "834001",
    "coordinates": {
      "type": "Point",
      "coordinates": [85.2817, 23.3441]
    }
  },
  "pricePerNight": 5000,
  "amenities": ["WiFi", "Pool", "Gym", "Restaurant", "Parking"],
  "phone": "9876543210",
  "email": "info@tajhotel.com",
  "checkInTime": "14:00",
  "checkOutTime": "11:00",
  "policies": {
    "cancellation": "Free cancellation up to 48 hours",
    "children": "Children below 5 years stay free",
    "pets": "Pets not allowed"
  }
}
```

**Response (201)**
```json
{
  "success": true,
  "message": "Hotel created successfully. Awaiting admin approval.",
  "hotel": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Taj Hotel",
    "status": "pending",
    "owner": "507f1f77bcf86cd799439010",
    "rating": {
      "average": 0,
      "count": 0
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get All Hotels (with filters)

**GET** `/hotels?page=1&limit=10&city=Ranchi&minPrice=2000&maxPrice=10000&amenities=WiFi,Pool&isFeatured=true`

**Query Parameters:**
```
page (default: 1)
limit (default: 10)
city - Filter by city name (regex search)
minPrice - Minimum price per night
maxPrice - Maximum price per night
rating - Minimum rating (1-5)
amenities - Comma-separated amenity list
search - Search by name or description
isFeatured - true/false
```

**Response (200)**
```json
{
  "success": true,
  "hotels": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Taj Hotel",
      "description": "A luxury 5-star hotel...",
      "location": {...},
      "pricePerNight": 5000,
      "amenities": [...],
      "images": [...],
      "rating": {
        "average": 4.5,
        "count": 123
      },
      "status": "approved",
      "owner": {
        "name": "Hotel Owner",
        "email": "owner@tajhotel.com"
      },
      "reviews": [...]
    }
  ],
  "pagination": {
    "totalPages": 3,
    "currentPage": 1,
    "total": 27
  }
}
```

### Get Hotel Details

**GET** `/hotels/:id`

**Response (200)**
```json
{
  "success": true,
  "hotel": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Taj Hotel",
    "description": "...",
    "location": {...},
    "pricePerNight": 5000,
    "rating": {...},
    "reviews": [...],
    "images": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "url": "https://cloudinary.com/...",
        "publicId": "hotels/507f1f77bcf86cd799439011/image1",
        "alt": "Taj Hotel Front View"
      }
    ],
    "owner": {...}
  }
}
```

### Update Hotel

**PUT** `/hotels/:id`

**Headers:**
```
Authorization: Bearer <hotel_owner_token>
```

**Body:** (partial update)
```json
{
  "name": "Updated Hotel Name",
  "pricePerNight": 5500,
  "amenities": ["WiFi", "Pool", "Gym"]
}
```

**Response (200)**
```json
{
  "success": true,
  "message": "Hotel updated successfully",
  "hotel": {...}
}
```

### Upload Hotel Images

**POST** `/hotels/:id/images`

**Headers:**
```
Authorization: Bearer <hotel_owner_token>
Content-Type: multipart/form-data
```

**Form Data:**
```
files: [image1.jpg, image2.jpg]
alt: "Hotel Room View"
```

**Response (200)**
```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "images": [
    {
      "url": "https://cloudinary.com/...",
      "publicId": "hotels/507f1f77bcf86cd799439011/image1",
      "alt": "Hotel Room View"
    }
  ]
}
```

### Delete Hotel

**DELETE** `/hotels/:id`

**Headers:**
```
Authorization: Bearer <hotel_owner_token>
```

**Response (200)**
```json
{
  "success": true,
  "message": "Hotel deleted successfully"
}
```

### Approve Hotel (Admin/Moderator)

**PUT** `/hotels/:id/approve`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200)**
```json
{
  "success": true,
  "message": "Hotel approved successfully",
  "hotel": {
    "status": "approved"
  }
}
```

### Reject Hotel (Admin/Moderator)

**PUT** `/hotels/:id/reject`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Body:**
```json
{
  "reason": "Images not clear, please resubmit with high quality photos"
}
```

### Search Nearby Hotels (Geospatial)

**GET** `/hotels/search/nearby?longitude=85.2817&latitude=23.3441&maxDistance=10000`

**Query Parameters:**
```
longitude - Required
latitude - Required
maxDistance - Distance in meters (default: 10000)
```

**Response (200)**
```json
{
  "success": true,
  "count": 5,
  "hotels": [...]
}
```

---

## Reviews System

### Create Review

**POST** `/reviews`

**Headers:**
```
Authorization: Bearer <user_token>
```

**Body:**
```json
{
  "title": "Amazing stay!",
  "content": "Had a wonderful experience at Taj Hotel. The staff was very friendly and rooms were clean and spacious. Would definitely recommend!",
  "rating": 5,
  "hotel": "507f1f77bcf86cd799439011",
  "visitDate": "2024-01-10T00:00:00Z",
  "category": "comfort"
}
```

**Response (201)**
```json
{
  "success": true,
  "message": "Review submitted successfully. Pending moderation.",
  "review": {
    "_id": "507f1f77bcf86cd799439013",
    "title": "Amazing stay!",
    "rating": 5,
    "status": "pending",
    "author": "507f1f77bcf86cd799439010",
    "hotel": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get Hotel Reviews

**GET** `/reviews/:hotelId/reviews?page=1&limit=10&sortBy=createdAt`

**Query Parameters:**
```
page (default: 1)
limit (default: 10)
sortBy - createdAt, rating, helpful (default: createdAt)
```

**Response (200)**
```json
{
  "success": true,
  "reviews": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "title": "Amazing stay!",
      "content": "Had a wonderful experience...",
      "rating": 5,
      "author": {
        "name": "John Doe",
        "avatar": "https://cloudinary.com/..."
      },
      "helpful": 45,
      "notHelpful": 5,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "totalReviews": 156,
  "pagination": {
    "totalPages": 16,
    "currentPage": 1
  },
  "ratingDistribution": [
    { "_id": 5, "count": 89 },
    { "_id": 4, "count": 45 },
    { "_id": 3, "count": 15 },
    { "_id": 2, "count": 5 },
    { "_id": 1, "count": 2 }
  ]
}
```

### Mark Review as Helpful

**POST** `/reviews/:id/helpful`

**Headers:**
```
Authorization: Bearer <user_token>
```

**Response (200)**
```json
{
  "success": true,
  "message": "Review marked as helpful",
  "helpfulCount": 46
}
```

### Approve Review (Moderator)

**PUT** `/reviews/:id/approve`

**Headers:**
```
Authorization: Bearer <moderator_token>
```

**Response (200)**
```json
{
  "success": true,
  "message": "Review approved successfully",
  "review": {
    "status": "approved",
    "verified": true
  }
}
```

---

## Blog/Travel Guides

### Create Blog

**POST** `/blogs`

**Headers:**
```
Authorization: Bearer <contributor_token>
```

**Body:**
```json
{
  "title": "Top 10 Places to Visit in Jharkhand",
  "content": "Jharkhand is a state of immense natural beauty and cultural richness...",
  "excerpt": "Explore the best tourist destinations in Jharkhand...",
  "category": "Travel Guide",
  "tags": ["travel", "jharkhand", "tourism", "adventure"],
  "relatedPlaces": ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"]
}
```

**Response (201)**
```json
{
  "success": true,
  "message": "Blog created as draft",
  "blog": {
    "_id": "507f1f77bcf86cd799439016",
    "title": "Top 10 Places to Visit in Jharkhand",
    "slug": "top-10-places-to-visit-in-jharkhand",
    "status": "draft",
    "author": "507f1f77bcf86cd799439010",
    "createdAt": "2024-01-15T10:30:00Z",
    "readTime": 8
  }
}
```

### Get All Published Blogs

**GET** `/blogs?page=1&limit=10&category=Travel%20Guide&search=jharkhand&isFeatured=true`

**Query Parameters:**
```
page (default: 1)
limit (default: 10)
category - Travel Guide, Local Culture, Adventure, etc.
search - Search in title, content, tags
sortBy - createdAt, viewCount, likes (default: createdAt)
isFeatured - true/false
```

**Response (200)**
```json
{
  "success": true,
  "blogs": [
    {
      "_id": "507f1f77bcf86cd799439016",
      "title": "Top 10 Places to Visit in Jharkhand",
      "slug": "top-10-places-to-visit-in-jharkhand",
      "excerpt": "Explore the best tourist destinations...",
      "content": "...",
      "author": {
        "name": "Travel Blogger",
        "email": "blogger@example.com",
        "avatar": "https://cloudinary.com/..."
      },
      "category": "Travel Guide",
      "tags": ["travel", "jharkhand"],
      "viewCount": 1250,
      "likes": 87,
      "readTime": 8,
      "publishedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "totalPages": 3,
    "currentPage": 1,
    "total": 27
  }
}
```

### Get Blog by ID or Slug

**GET** `/blogs/:identifier`

Where `:identifier` can be either MongoDB ID or slug (e.g., `top-10-places-to-visit-in-jharkhand`)

**Response (200)**
```json
{
  "success": true,
  "blog": {
    "_id": "507f1f77bcf86cd799439016",
    "title": "Top 10 Places to Visit in Jharkhand",
    "slug": "...",
    "content": "...",
    "author": {...},
    "viewCount": 1251,
    "likes": 87,
    "comments": [...]
  }
}
```

### Submit Blog for Approval

**POST** `/blogs/:id/submit`

**Headers:**
```
Authorization: Bearer <contributor_token>
```

**Response (200)**
```json
{
  "success": true,
  "message": "Blog submitted for approval",
  "blog": {
    "status": "pending"
  }
}
```

### Like Blog

**POST** `/blogs/:id/like`

**Headers:**
```
Authorization: Bearer <user_token>
```

**Response (200)**
```json
{
  "success": true,
  "message": "Blog liked",
  "likes": 88
}
```

### Approve Blog (Moderator)

**PUT** `/blogs/:id/approve`

**Headers:**
```
Authorization: Bearer <moderator_token>
```

**Response (200)**
```json
{
  "success": true,
  "message": "Blog approved and published",
  "blog": {
    "status": "published",
    "publishedAt": "2024-01-15T11:00:00Z"
  }
}
```

---

## Places Module

### Create Place

**POST** `/places`

**Headers:**
```
Authorization: Bearer <user_token>
```

**Body:**
```json
{
  "name": "Jamshedpur Zoological Park",
  "description": "The Jamshedpur Zoological Park is home to various species of animals and birds...",
  "city": "Jamshedpur",
  "district": "East Singhbhum",
  "category": "Wildlife",
  "entryFee": 50,
  "highlights": ["Tiger", "Leopard", "Deer", "Bird Sanctuary"],
  "tags": ["zoo", "wildlife", "family-friendly"],
  "accessibility": {
    "wheelchair": true,
    "parking": true,
    "publicTransport": true,
    "guide": true
  }
}
```

**Response (201)**
```json
{
  "success": true,
  "message": "Place added successfully",
  "place": {
    "_id": "507f1f77bcf86cd799439017",
    "name": "Jamshedpur Zoological Park",
    "slug": "jamshedpur-zoological-park",
    "category": "Wildlife",
    "verified": false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get All Places

**GET** `/places?page=1&limit=10&city=Ranchi&category=Waterfall&verified=true`

**Query Parameters:**
```
page (default: 1)
limit (default: 10)
city - Filter by city
category - Temple, Waterfall, National Park, etc.
search - Search in name, description, tags
verified - true/false
isFeatured - true/false
```

**Response (200)**
```json
{
  "success": true,
  "places": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "name": "Jamshedpur Zoological Park",
      "description": "...",
      "category": "Wildlife",
      "entryFee": 50,
      "viewCount": 450,
      "rating": {
        "average": 4.2,
        "count": 89
      },
      "images": [...],
      "verified": true
    }
  ],
  "pagination": {...}
}
```

### Get Places by City

**GET** `/places/city/:city?page=1&limit=10`

**Response (200)**
```json
{
  "success": true,
  "places": [...]
}
```

### Search Nearby Places (Geospatial)

**GET** `/places/search/nearby?longitude=85.2817&latitude=23.3441&maxDistance=10000`

**Response (200)**
```json
{
  "success": true,
  "count": 5,
  "places": [...]
}
```

### Verify Place (Admin Only)

**PUT** `/places/:id/verify`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200)**
```json
{
  "success": true,
  "message": "Place verified successfully",
  "place": {
    "verified": true
  }
}
```

---

## Feedback System

### Create Feedback (Public)

**POST** `/feedback`

**Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "9876543210",
  "subject": "Great website!",
  "message": "I really enjoyed exploring the tourism website. The interface is user-friendly and content is very informative.",
  "category": "suggestion",
  "rating": 5
}
```

**Response (201)**
```json
{
  "success": true,
  "message": "Thank you for your feedback!",
  "feedback": {
    "_id": "507f1f77bcf86cd799439018",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "subject": "Great website!",
    "status": "new",
    "priority": "medium",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get All Feedback (Admin/Moderator)

**GET** `/feedback?page=1&limit=10&status=new&priority=high`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
```
page (default: 1)
limit (default: 10)
status - new, in-progress, resolved, closed
category - bug, suggestion, complaint, partnership, other
priority - low, medium, high, critical
```

**Response (200)**
```json
{
  "success": true,
  "feedback": [
    {
      "_id": "507f1f77bcf86cd799439018",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "subject": "Great website!",
      "message": "...",
      "status": "new",
      "priority": "medium",
      "category": "suggestion",
      "rating": 5,
      "assignedTo": null,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {...},
  "total": 45
}
```

### Update Feedback Status (Admin/Moderator)

**PUT** `/feedback/:id/status`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Body:**
```json
{
  "status": "in-progress",
  "priority": "high"
}
```

**Response (200)**
```json
{
  "success": true,
  "message": "Feedback updated successfully",
  "feedback": {...}
}
```

### Assign Feedback (Admin)

**PUT** `/feedback/:id/assign`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Body:**
```json
{
  "assignedTo": "507f1f77bcf86cd799439010"
}
```

**Response (200)**
```json
{
  "success": true,
  "message": "Feedback assigned successfully",
  "feedback": {
    "assignedTo": {
      "name": "Admin User",
      "email": "admin@example.com"
    }
  }
}
```

### Add Response to Feedback

**POST** `/feedback/:id/response`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Body:**
```json
{
  "message": "Thank you for your suggestion. We will implement this feature in the next update."
}
```

**Response (200)**
```json
{
  "success": true,
  "message": "Response added successfully",
  "feedback": {
    "responses": [
      {
        "responder": {...},
        "message": "Thank you for your suggestion...",
        "createdAt": "2024-01-15T11:00:00Z"
      }
    ]
  }
}
```

### Get Feedback Statistics (Admin)

**GET** `/feedback/admin/stats`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200)**
```json
{
  "success": true,
  "stats": {
    "byStatus": [
      { "_id": "new", "count": 15 },
      { "_id": "in-progress", "count": 8 },
      { "_id": "resolved", "count": 20 },
      { "_id": "closed", "count": 2 }
    ],
    "byCategory": [
      { "_id": "suggestion", "count": 25 },
      { "_id": "bug", "count": 12 },
      { "_id": "complaint", "count": 8 }
    ],
    "byPriority": [
      { "_id": "low", "count": 10 },
      { "_id": "medium", "count": 25 },
      { "_id": "high", "count": 8 },
      { "_id": "critical", "count": 2 }
    ],
    "avgRating": [
      { "average": 4.2 }
    ],
    "total": [
      { "total": 45 }
    ]
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "fieldName": "Specific field error"
  }
}
```

### Common HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate entry (e.g., email) |
| 500 | Server Error - Internal error |

### Example Error Responses

**Validation Error (400)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Invalid email format",
    "password": "Password must contain uppercase, lowercase, number, and special character"
  }
}
```

**Unauthorized (401)**
```json
{
  "success": false,
  "message": "No token provided. Please login first."
}
```

**Forbidden (403)**
```json
{
  "success": false,
  "message": "Only admins and moderators can access this resource"
}
```

**Duplicate Entry (409)**
```json
{
  "success": false,
  "message": "email already exists. Please use a different email."
}
```

---

## User Roles & Permissions

### Role Matrix

| Action | User | Hotel Owner | Contributor | Moderator | Admin |
|--------|------|-------------|-------------|-----------|-------|
| Create Hotel | ✗ | ✓ | ✗ | ✗ | ✓ |
| Update own Hotel | ✗ | ✓ | ✗ | ✗ | ✓ |
| Approve Hotel | ✗ | ✗ | ✗ | ✓ | ✓ |
| Create Review | ✓ | ✓ | ✓ | ✓ | ✓ |
| Approve Review | ✗ | ✗ | ✗ | ✓ | ✓ |
| Create Blog | ✗ | ✗ | ✓ | ✓ | ✓ |
| Approve Blog | ✗ | ✗ | ✗ | ✓ | ✓ |
| Add Place | ✓ | ✓ | ✓ | ✓ | ✓ |
| Verify Place | ✗ | ✗ | ✗ | ✗ | ✓ |
| View Feedback | ✗ | ✗ | ✗ | ✓ | ✓ |
| Manage Users | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## Authentication Flow

1. User registers with email, password, name
2. Password is hashed using bcrypt
3. JWT tokens are generated (access: 7 days, refresh: 30 days)
4. Tokens are stored in httpOnly cookies
5. For API requests, include token in `Authorization: Bearer <token>` header
6. Moderator/Admin can approve or reject pending content

---

## Best Practices

### Security

- Always use HTTPS in production
- Tokens expire after 7 days for access token
- Refresh token expires after 30 days
- Passwords must contain uppercase, lowercase, number, and special character
- Cloudinary URLs use secure_url (https)

### Performance

- Paginate large result sets (limit: 10-100)
- Use filters to reduce data transfer
- Image uploads are handled via Cloudinary (CDN)
- Database indexes on frequently queried fields

### Data Validation

- All inputs are validated server-side
- Email must be unique
- Required fields must be provided
- String lengths are enforced
- Price values must be positive

---

## Getting Started

### Setup

1. **Clone Repository**
```bash
git clone <repo-url>
cd jharkhand-tourism
```

2. **Install Dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
# Fill in your Cloudinary, MongoDB, and JWT secrets
```

4. **Start Server**
```bash
npm run dev  # Development with nodemon
npm start   # Production
```

5. **Test Endpoints**
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Pass@123","confirmPassword":"Pass@123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass@123"}'

# Get Hotels
curl http://localhost:5000/api/hotels
```

---

## Database Schema Overview

### Collections

1. **Users** - Authentication & profile management
2. **Hotels** - Hotel listings with images and amenities
3. **Reviews** - User reviews with ratings
4. **Blogs** - Travel guides and articles
5. **Places** - Tourist destinations
6. **Feedback** - User feedback and support tickets
7. **Comments** - Blog post comments

### Relationships

- User → Hotels (1:Many - hotel_owner)
- User → Reviews (1:Many - author)
- User → Blogs (1:Many - author)
- Hotel → Reviews (1:Many)
- Blog → Comments (1:Many)

---

## Support

For issues or questions:
- Email: support@jharkhandtourism.com
- GitHub: https://github.com/shashankpandey04/jharkhand-tourism-backend

---

**Last Updated:** January 2024  
**API Version:** 1.0.0  
**Status:** Production Ready ✓
