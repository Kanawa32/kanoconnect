# KanoConnect 🚚

**Enterprise-Grade Logistics Management System**

KanoConnect is a comprehensive logistics and delivery management platform built for modern enterprises. It features real-time tracking, fleet management, payment integration, and multi-role dashboards.

## Features

- **Multi-Role Dashboards**: Customer, Rider, Dispatcher, Admin, and Super Admin interfaces
- **Shipment Booking**: Create and manage deliveries with item details
- **Live Tracking**: Real-time GPS tracking via Socket.IO
- **Fleet Management**: Vehicle and fleet organization
- **Payment Integration**: Paystack payment processing
- **Google Maps**: Address geocoding and route calculation
- **Cloudinary**: Image uploads for delivery proofs and documents
- **Email Notifications**: Automated transactional emails
- **Reports & Analytics**: Revenue and performance dashboards
- **Role-Based Access Control**: Granular permissions system
- **PWA Support**: Progressive Web App capabilities
- **Responsive Design**: Mobile-first UI with Tailwind CSS

## Tech Stack

### Backend
- **Node.js** + **Express**
- **MongoDB** + **Mongoose**
- **JWT** Authentication with Refresh Tokens
- **Socket.IO** for real-time communication
- **Paystack** API integration
- **Cloudinary** for file storage
- **Nodemailer** for email delivery
- **Swagger** API documentation
- **Winston** logging

### Frontend
- **React 19** + **Vite**
- **Tailwind CSS**
- **React Query** for server state
- **Zustand** for client state
- **React Hook Form** + **Joi** validation
- **Recharts** for data visualization
- **Socket.IO Client** for real-time updates
- **Google Maps API** integration

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/kanoconnect.git
cd kanoconnect
```

2. **Setup Backend**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
npm install
npm run dev
```

3. **Setup Frontend**
```bash
cd frontend
cp .env.example .env
# Edit .env with your configuration
npm install
npm run dev
```

4. **Docker (Alternative)**
```bash
docker-compose up -d
```

### Environment Variables

#### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kanoconnect
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
PAYSTACK_SECRET_KEY=sk_test_...
CLOUDINARY_CLOUD_NAME=your-cloud-name
GOOGLE_MAPS_API_KEY=your-api-key
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api/v1
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## API Documentation

Once the server is running, visit:
```
http://localhost:5000/api-docs
```

## Testing

### Backend
```bash
cd backend
npm test
npm run test:coverage
```

### Frontend
```bash
cd frontend
npm test
```

## Project Structure

```
kanoconnect/
├── backend/
│   ├── src/
│   │   ├── config/         # Database, email, cloudinary, paystack
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── socket/         # Socket.IO handlers
│   │   ├── utils/          # Helpers, JWT, logger
│   │   └── server.js       # Entry point
│   ├── tests/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Route pages
│   │   ├── store/          # Zustand stores
│   │   ├── services/       # API & socket services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Helper functions
│   │   └── styles/         # Global styles
│   ├── tests/
│   └── Dockerfile
├── docker/
│   └── nginx.conf
└── docker-compose.yml
```

## User Roles

| Role | Permissions |
|------|------------|
| **Customer** | Create shipments, track deliveries, view history, make payments |
| **Rider** | View assigned shipments, update status, update location |
| **Dispatcher** | Assign riders, manage shipments, view fleet |
| **Admin** | Full access except super admin settings |
| **Super Admin** | Complete system access, user management |

## License

MIT License - see LICENSE file for details.

## Support

For support, email support@kanoconnect.com or open an issue on GitHub.
