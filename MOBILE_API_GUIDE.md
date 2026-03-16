# 📱 Mobile App API Guide

## Base URL
```
http://localhost:3000/api
```

## Order Tracking Endpoints

### 1. Track Order by Order Code (Recommended)
Track đơn hàng bằng mã code (ví dụ: ORD-1773297584593-UTHELM0E2)

**Endpoint:** `GET /orders/track/:orderCode`

**Example:**
```bash
GET http://localhost:3000/api/orders/track/ORD-1773297584593-UTHELM0E2
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderCode": "ORD-1773297584593-UTHELM0E2",
    "customer": {
      "name": "Huy",
      "phone": "0347887805",
      "address": "..."
    },
    "status": "pending",
    "serviceType": "economy",
    "pickupAddress": "...",
    "deliveryAddress": "...",
    "distanceKm": 5.5,
    "pricingBreakdown": {
      "baseFare": 50000,
      "distanceCharge": 27500,
      "peakHourSurcharge": 0,
      "bulkyItemSurcharge": 25000,
      "codFee": 0,
      "total": 102500
    },
    "codAmount": 0,
    "events": [
      {
        "type": "order_created",
        "timestamp": "2026-03-12T...",
        "note": ""
      }
    ]
  }
}
```

### 2. Get Customer Orders by Phone (For Order History)
Lấy tất cả đơn hàng của khách hàng

**Endpoint:** `GET /orders/customer/:phone`

**Example:**
```bash
GET http://localhost:3000/api/orders/customer/0347887805
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "orderCode": "ORD-1773297584593-UTHELM0E2",
      "status": "pending",
      "pricingBreakdown": { "total": 102500 },
      ...
    }
  ]
}
```

### 3. Create New Order
Tạo đơn hàng mới

**Endpoint:** `POST /orders`

**Request Body:**
```json
{
  "customer": {
    "name": "Tên khách",
    "phone": "0123456789",
    "address": "Địa chỉ"
  },
  "pickupAddress": "Lấy hàng từ",
  "deliveryAddress": "Giao hàng đến",
  "serviceType": "express",
  "distanceKm": 5.5,
  "isBulky": false,
  "codAmount": 500000
}
```

## Implementation (Android/Mobile Example)

### Using OkHttp or Retrofit
```java
// Track order
GET http://localhost:3000/api/orders/track/ORD-1773297584593-UTHELM0E2

// Get customer orders
GET http://localhost:3000/api/orders/customer/0347887805

// Create order
POST http://localhost:3000/api/orders
Content-Type: application/json

{
  "customer": {"name": "Name", "phone": "0123456789", "address": "Addr"},
  "pickupAddress": "From",
  "deliveryAddress": "To",
  "serviceType": "express",
  "distanceKm": 5.5,
  "codAmount": 0
}
```

## Common Response Formats

### Success (200)
```json
{
  "success": true,
  "data": { /* order data */ }
}
```

### Error (404/500)
```json
{
  "success": false,
  "error": "Order not found"
}
```

## Notes
- **Mobile app không cần authentication** cho endpoints `/orders/*`
- **sử dụng `/orders/track/:orderCode` thay vì `/orders/:id`** vì mobile app không có MongoDB IDs
- Response format luôn `{ success, data }` hoặc `{ success, error }`
