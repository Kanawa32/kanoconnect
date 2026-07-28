# KanoConnect Backend

## Setup

```bash
npm install
npm run dev
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database with sample data

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Shipments
- `POST /api/v1/shipments` - Create shipment
- `GET /api/v1/shipments` - List shipments
- `GET /api/v1/shipments/:id` - Get shipment details
- `PATCH /api/v1/shipments/:id/status` - Update status
- `PATCH /api/v1/shipments/:id/assign-rider` - Assign rider

### Vehicles
- `POST /api/v1/vehicles` - Create vehicle
- `GET /api/v1/vehicles` - List vehicles
- `GET /api/v1/vehicles/:id` - Get vehicle
- `PATCH /api/v1/vehicles/:id` - Update vehicle

### Payments
- `POST /api/v1/payments/:shipmentId/initiate` - Initialize payment
- `GET /api/v1/payments/verify` - Verify payment callback

### Reports
- `GET /api/v1/reports/revenue` - Revenue report
- `GET /api/v1/reports/shipments` - Shipment analytics
- `GET /api/v1/reports/riders` - Rider performance

## Architecture

The backend follows a layered architecture:

1. **Routes** - Define API endpoints
2. **Controllers** - Handle HTTP requests/responses
3. **Middleware** - Authentication, validation, rate limiting
4. **Models** - Mongoose schemas and business logic
5. **Services** - External integrations (Paystack, Cloudinary, Email)
6. **Utils** - Shared utilities (JWT, logger, geolocation)
