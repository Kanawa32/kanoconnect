# KanoConnect API Documentation

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Response Format

All responses follow this structure:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["optional validation errors"]
}
```

## Rate Limiting

- General API: 100 requests per 15 minutes
- Auth endpoints: 10 requests per 15 minutes
- Payment endpoints: 20 requests per hour

## WebSocket Events

### Client → Server
- `shipment:track` - Join shipment tracking room
- `shipment:leave` - Leave tracking room
- `rider:location` - Update rider location

### Server → Client
- `shipment:update` - Shipment status update
- `location:update` - Rider location update
- `admin:notification` - Admin broadcast

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Server Error |
