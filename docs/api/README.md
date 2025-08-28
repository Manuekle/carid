# API Documentation

## Base URL
`/api`

## Authentication
All endpoints require authentication unless specified otherwise.

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token

### Vehicles
- `GET /api/vehicles` - Get all vehicles (paginated)
- `POST /api/vehicles` - Create a new vehicle
- `GET /api/vehicles/:id` - Get vehicle by ID
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle
- `GET /api/vehicles/:id/qr` - Get vehicle QR code

### Vehicle Maintenance
- `GET /api/vehicles/:id/maintenance` - Get maintenance logs for a vehicle
- `POST /api/vehicles/:id/maintenance` - Create maintenance log
- `GET /api/maintenance/:id` - Get maintenance log by ID
- `PUT /api/maintenance/:id` - Update maintenance log
- `DELETE /api/maintenance/:id` - Delete maintenance log

### Documents
- `GET /api/vehicles/:id/documents` - Get vehicle documents
- `POST /api/vehicles/:id/documents` - Upload document
- `DELETE /api/documents/:id` - Delete document

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `GET /api/users/me/vehicles` - Get current user's vehicles (OWNER)

### Vehicles
- `GET /api/vehicles` - List all vehicles (ADMIN) or owned vehicles (OWNER)
- `POST /api/vehicles` - Add a new vehicle
- `GET /api/vehicles/:id` - Get vehicle details
- `GET /api/vehicles/:id/qr` - Get vehicle QR code
- `POST /api/vehicles/:id/documents` - Upload vehicle document

### Maintenance
- `GET /api/maintenance` - List maintenance records
- `POST /api/maintenance` - Create maintenance record
- `GET /api/maintenance/:id` - Get maintenance details
- `PUT /api/maintenance/:id/complete` - Complete maintenance

### Inventory
- `GET /api/parts` - List all parts
- `POST /api/parts` - Add new part (ADMIN)
- `PUT /api/parts/:id` - Update part (ADMIN)
- `DELETE /api/parts/:id` - Delete part (ADMIN)

### Chat
- `GET /api/chat/sessions` - List chat sessions
- `POST /api/chat/sessions` - Create new chat session
- `GET /api/chat/sessions/:id/messages` - Get chat messages
- `POST /api/chat/sessions/:id/messages` - Send message

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Error details",
  "statusCode": 400
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing token",
  "statusCode": 401
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions",
  "statusCode": 403
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found",
  "statusCode": 404
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "statusCode": 500
}
```
