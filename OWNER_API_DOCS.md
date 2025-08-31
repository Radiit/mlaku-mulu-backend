# Owner & Pegawai API Documentation

## Overview

API ini menyediakan endpoint untuk manajemen owner dan pegawai dalam sistem MLaku Mulu Backend. Owner memiliki akses penuh ke semua fitur, sementara pegawai dapat mengakses API pegawai.

## Authentication

Semua endpoint (kecuali register owner) memerlukan JWT token yang valid. Token harus disertakan dalam header:

```
Authorization: Bearer <jwt_token>
```

## Role Hierarchy

- **Owner**: Akses penuh ke semua fitur
- **Pegawai**: Akses ke API pegawai
- **Turis**: Akses terbatas (tidak dapat mengakses endpoint owner/pegawai)

## Owner Endpoints

### 1. Register Owner (Public)

**POST** `/owner/register`

Endpoint ini dapat diakses tanpa authentication untuk setup awal sistem.

**Request Body:**
```json
{
  "email": "ebliscorp@bookwormsboutiques.com",
  "password": "Password123",
  "phone": "+1234567890",
  "name": "John Owner"
}
```

**Validation Rules:**
- Email: Valid email format, required
- Password: Min 8 karakter, harus mengandung huruf besar, huruf kecil, dan angka
- Phone: Format internasional yang valid
- Name: Min 2 karakter, required

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Owner registered successfully",
  "data": {
    "id": "owner-123",
    "email": "owner@example.com",
    "role": "owner",
    "isVerified": true,
    "phone": "+1234567890",
    "name": "John Owner"
  },
  "meta": null,
  "validationErrors": []
}
```

### 2. Assign Role

**POST** `/owner/assign-role`

Hanya owner yang dapat mengassign role ke user lain.

**Request Body:**
```json
{
  "userId": "user-123",
  "role": "pegawai"
}
```

**Available Roles:** `owner`, `pegawai`, `turis`

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "User role updated to pegawai successfully",
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "role": "pegawai",
    "isVerified": true,
    "phone": "+1234567891"
  },
  "meta": null,
  "validationErrors": []
}
```

### 3. Update User Role

**PUT** `/owner/users/:id/role`

Update role user tertentu.

**Request Body:**
```json
{
  "role": "pegawai"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "User role updated to pegawai successfully",
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "role": "pegawai",
    "isVerified": true,
    "phone": "+1234567891"
  },
  "meta": null,
  "validationErrors": []
}
```

### 4. Get All Users

**GET** `/owner/users?page=1&limit=10`

Mendapatkan daftar semua user dengan pagination.

**Query Parameters:**
- `page` (optional): Halaman yang diminta (default: 1)
- `limit` (optional): Jumlah item per halaman (default: 10)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "user-123",
      "email": "user@example.com",
      "role": "pegawai",
      "isVerified": true,
      "phone": "+1234567891",
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false,
    "nextPage": null,
    "prevPage": null
  },
  "validationErrors": []
}
```

### 5. Get User by ID

**GET** `/owner/users/:id`

Mendapatkan detail user berdasarkan ID.

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "User retrieved successfully",
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "role": "pegawai",
    "isVerified": true,
    "phone": "+1234567891",
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  },
  "meta": null,
  "validationErrors": []
}
```

### 6. Delete User

**DELETE** `/owner/users/:id`

Menghapus user (tidak dapat menghapus owner).

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "User deleted successfully",
  "data": {
    "message": "User deleted successfully"
  },
  "meta": null,
  "validationErrors": []
}
```

## Pegawai Endpoints

Semua endpoint pegawai dapat diakses oleh owner dan pegawai.

### 1. Get All Users

**GET** `/pegawai/users?page=1&limit=10`

Mendapatkan daftar semua user (mirip dengan endpoint owner).

### 2. Get User by ID

**GET** `/pegawai/users/:id`

Mendapatkan detail user berdasarkan ID.

### 3. Get All Trips

**GET** `/pegawai/trips?page=1&limit=10`

Mendapatkan daftar semua trip dengan pagination.

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Trips retrieved successfully",
  "data": [
    {
      "id": "trip-123",
      "turisId": "user-123",
      "startDate": "2025-02-10T10:00:00Z",
      "endDate": "2025-02-15T10:00:00Z",
      "destination": "Bali, Indonesia",
      "turis": {
        "id": "user-123",
        "email": "turis@example.com",
        "role": "turis",
        "phone": "+1234567890"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false,
    "nextPage": null,
    "prevPage": null
  },
  "validationErrors": []
}
```

### 4. Get Trip by ID

**GET** `/pegawai/trips/:id`

Mendapatkan detail trip berdasarkan ID (placeholder untuk implementasi selanjutnya).

### 5. Dashboard

**GET** `/pegawai/dashboard`

Mendapatkan data dashboard untuk user yang sedang login.

**Response (200):**
```json
{
  "message": "Dashboard data retrieved successfully",
  "data": {
    "userId": "pegawai-123",
    "email": "pegawai@example.com",
    "role": "pegawai",
    "permissions": ["view_users", "view_trips", "manage_trips"],
    "timestamp": "2025-01-15T10:00:00Z"
  }
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "data": null,
  "meta": null,
  "validationErrors": []
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Only owners can assign roles",
  "data": null,
  "meta": null,
  "validationErrors": []
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User not found",
  "data": null,
  "meta": null,
  "validationErrors": []
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Email already registered",
  "data": null,
  "meta": null,
  "validationErrors": []
}
```

## Security Features

### Role-Based Access Control
- Owner dapat mengakses semua endpoint
- Pegawai dapat mengakses endpoint pegawai
- Turis tidak dapat mengakses endpoint owner/pegawai

### Owner Protection
- Owner tidak dapat dihapus
- Role owner tidak dapat diubah
- Hanya owner yang dapat mengassign role

### Input Validation
- Validasi email format
- Validasi password strength
- Validasi phone number format
- Validasi role values

## Usage Examples

### 1. Setup Awal Sistem
```bash
# Register owner pertama
curl -X POST http://localhost:3000/owner/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mlakumulu.com",
    "password": "Admin123",
    "phone": "+6281234567890",
    "name": "System Administrator"
  }'
```

### 2. Login Owner
```bash
# Login untuk mendapatkan token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mlakumulu.com",
    "password": "Admin123"
  }'
```

### 3. Assign Role Pegawai
```bash
# Assign role pegawai ke user
curl -X POST http://localhost:3000/owner/assign-role \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "role": "pegawai"
  }'
```

### 4. Akses API Pegawai
```bash
# Get semua users sebagai pegawai
curl -X GET "http://localhost:3000/pegawai/users?page=1&limit=10" \
  -H "Authorization: Bearer <jwt_token>"
```

## Testing

Semua endpoint telah diuji dengan unit test yang komprehensif:

```bash
# Run owner tests
npm test -- --testPathPattern="owner"

# Run pegawai tests  
npm test -- --testPathPattern="pegawai"

# Run all tests
npm test
```

## Future Enhancements

1. **Audit Log**: Mencatat semua perubahan role dan akses
2. **Permission System**: Sistem permission yang lebih granular
3. **Role Templates**: Template role dengan permission yang sudah didefinisikan
4. **Bulk Operations**: Operasi massal untuk multiple users
5. **Activity Monitoring**: Monitoring aktivitas user real-time 