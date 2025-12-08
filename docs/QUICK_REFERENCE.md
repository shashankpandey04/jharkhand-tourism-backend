# 🎯 QUICK REFERENCE - BOOKING SYSTEM ENDPOINTS

## 📱 ROOMS API

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/rooms/:id` | Get room details | Public |
| GET | `/api/rooms/hotel/:hotelId/rooms` | List all hotel rooms | Public |
| GET | `/api/rooms/hotel/:hotelId/available` | Get available rooms (date range) | Public |
| GET | `/api/rooms/hotel/:hotelId/type/:roomType` | Get rooms by type | Public |
| POST | `/api/rooms/hotel/:hotelId` | Create new room | Hotel Owner |
| PUT | `/api/rooms/:id` | Update room details | Hotel Owner |
| DELETE | `/api/rooms/:id` | Delete room | Hotel Owner |
| POST | `/api/rooms/:roomId/discount` | Apply discount | Hotel Owner |
| GET | `/api/rooms/hotel/:hotelId/stats` | Room statistics | Hotel Owner |

---

## 🛏️ BOOKINGS API

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/bookings` | Create new booking | User |
| GET | `/api/bookings` | Get my bookings | User |
| GET | `/api/bookings/:id` | Get booking details | User |
| PUT | `/api/bookings/:id` | Update booking | User |
| POST | `/api/bookings/:id/cancel` | Cancel booking | User |
| POST | `/api/bookings/:id/check-in` | Check in | Hotel Owner |
| POST | `/api/bookings/:id/check-out` | Check out | Hotel Owner |
| GET | `/api/bookings/confirmation/:num` | Get by confirmation | Public |
| GET | `/api/bookings/hotel/:hotelId` | Hotel's bookings | Hotel Owner |
| GET | `/api/bookings/admin/stats` | Booking stats | Admin |
| DELETE | `/api/bookings/:id` | Delete booking | Admin |

---

## 💳 PAYMENTS API

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/payments` | Initiate payment | User |
| GET | `/api/payments/:id` | Get payment details | User |
| GET | `/api/payments/user/my-payments` | Get my payments | User |
| POST | `/api/payments/:transactionId/verify` | Verify payment | User |
| POST | `/api/payments/:id/refund-request` | Request refund | User |
| POST | `/api/payments/:id/retry` | Retry failed payment | User |
| GET | `/api/payments/:id/invoice` | Download invoice | User |
| POST | `/api/payments/webhook/callback` | Payment webhook | Public |
| POST | `/api/payments/:paymentId/refund` | Process refund | Admin |
| GET | `/api/payments/admin/stats` | Payment stats | Admin |

---

## 🎫 PACKAGES API

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/packages` | Get all packages | Public |
| GET | `/api/packages/:id` | Get package details | Public |
| GET | `/api/packages/featured` | Get featured packages | Public |
| GET | `/api/packages/popular` | Get popular packages | Public |
| GET | `/api/packages/search/location/:city` | Search by location | Public |
| GET | `/api/packages/search/category/:category` | Search by category | Public |
| GET | `/api/packages/availability/:id` | Check availability | Public |
| GET | `/api/packages/stats` | Package statistics | Public |
| POST | `/api/packages` | Create package | Contributor |
| PUT | `/api/packages/:id` | Update package | Contributor |
| DELETE | `/api/packages/:id` | Delete package | Contributor |
| POST | `/api/packages/:id/review` | Add review | User |
| POST | `/api/packages/:id/book` | Book package | User |

---

## 🔐 AUTHENTICATION REQUIRED

**User (Guest/Tourist):**
- Create bookings
- Make payments
- Cancel bookings
- View own bookings
- Leave reviews

**Hotel Owner:**
- Create rooms
- Manage room pricing
- View bookings for their hotel
- Check-in/check-out guests
- View analytics

**Contributor:**
- Create tour packages
- Manage itineraries
- Create packages

**Moderator:**
- Approve packages
- Moderate reviews

**Admin:**
- Everything
- Payment refunds
- Booking statistics
- User management

---

## 📊 BOOKING FLOW

```
1. Search Hotels/Rooms → GET /api/rooms/hotel/:hotelId/available
2. Create Booking → POST /api/bookings
3. Get Confirmation → GET /api/bookings/:id
4. Initiate Payment → POST /api/payments
5. Verify Payment → POST /api/payments/:transactionId/verify
6. Download Invoice → GET /api/payments/:id/invoice
7. Check-in → POST /api/bookings/:id/check-in
8. Check-out → POST /api/bookings/:id/check-out
9. Cancel (if needed) → POST /api/bookings/:id/cancel
10. Request Refund (if allowed) → POST /api/payments/:id/refund-request
```

---

## 🎟️ PACKAGE BOOKING FLOW

```
1. Browse Packages → GET /api/packages
2. Filter by Location → GET /api/packages/search/location/:city
3. Filter by Category → GET /api/packages/search/category/:category
4. View Details → GET /api/packages/:id
5. Check Availability → GET /api/packages/availability/:id
6. Book Package → POST /api/packages/:id/book
7. Review Package → POST /api/packages/:id/review
```

---

## 💰 PRICING CALCULATIONS

### Hotel Rooms
```
Final Price = (Base Price - Discount) × Number of Nights × Number of Rooms
Total Bill = Room Charges + Taxes & Fees (18% GST)
```

### Group Discounts
```
1-5 people:   0% discount
6-10 people:  10% discount
11-20 people: 15% discount
20+ people:   20% discount
```

### Refunds
```
If cancellable within policy:
Refund = Total Price
Else:
Refund = 0 (Non-refundable)
```

---

## 📞 ROOM AMENITIES

- AC
- WiFi
- TV
- Minibar
- Safe
- Bathrobe
- Slippers
- Gym
- Spa
- Balcony
- Work Desk
- Iron
- Hairdryer

---

## 🏷️ PACKAGE CATEGORIES

- Adventure
- Relaxation
- Cultural
- Family
- Honeymoon
- Wildlife
- Heritage

---

## 💳 PAYMENT METHODS

- Credit Card
- Debit Card
- UPI
- Net Banking
- Digital Wallet
- Cash

---

## 📋 BOOKING STATUSES

- **Pending** - Created, awaiting payment
- **Confirmed** - Payment received
- **Checked-In** - Guest checked in
- **Checked-Out** - Stay completed
- **Cancelled** - Booking cancelled
- **No-Show** - Guest didn't show up

---

## 💰 PAYMENT STATUSES

- **Unpaid** - Awaiting payment
- **Partial** - Partially paid
- **Paid** - Fully paid
- **Refunded** - Money refunded to customer

---

## 🔄 REFUND STATUSES

- **Not Initiated** - No refund requested
- **Pending** - Refund in process
- **Processed** - Refund completed
- **Failed** - Refund failed
- **Partial** - Partial refund

---

## 🛠️ COMMON ERRORS

| Error | Meaning | Solution |
|-------|---------|----------|
| 400 - Dates Invalid | Check-out before check-in | Fix dates |
| 400 - No Rooms Available | All rooms booked | Choose different dates |
| 400 - Can't Cancel | Outside cancellation window | Check policy |
| 401 - Not Authenticated | Login required | Authenticate first |
| 403 - Not Authorized | Don't own resource | Use own resource |
| 404 - Not Found | Resource doesn't exist | Check ID/parameters |
| 429 - Rate Limited | Too many requests | Wait before retrying |

---

## 🧪 TEST WITH CURL

### Create Booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "123",
    "checkInDate": "2025-02-01",
    "checkOutDate": "2025-02-03",
    "rooms": [{"roomId": "456", "quantity": 1}],
    "guestDetails": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+919876543210"
    }
  }'
```

### Get Available Rooms
```bash
curl -X GET "http://localhost:5000/api/rooms/hotel/123/available?checkInDate=2025-02-01&checkOutDate=2025-02-03"
```

### Browse Packages
```bash
curl -X GET "http://localhost:5000/api/packages?category=Adventure&minPrice=5000&maxPrice=50000"
```

---

## 📚 DOCUMENTATION FILES

- **API_DOCUMENTATION.md** - All 113 endpoints with examples
- **MODULE_DOCUMENTATION.md** - Technical deep-dive
- **PROJECT_COMPLETION.md** - Feature overview
- **BOOKING_SYSTEM_COMPLETE.md** - New booking features
- **README.md** - Setup & installation
- **QUICK_REFERENCE.md** - This file!

---

**Ready to book hotels and manage tours? Let's go! 🚀**
