# KanoConnect Frontend

## Setup

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Features

- **Responsive Design**: Mobile-first with Tailwind CSS
- **PWA**: Installable app with offline support
- **Real-time Updates**: Socket.IO integration for live tracking
- **State Management**: Zustand for auth, React Query for server state
- **Form Validation**: React Hook Form + Joi
- **Data Visualization**: Recharts for reports

## Project Structure

```
src/
├── components/
│   ├── common/       # Reusable components
│   ├── layout/       # Sidebar, Header, Layout
│   ├── dashboard/    # Dashboard widgets
│   ├── tracking/     # Tracking components
│   ├── fleet/        # Fleet management
│   ├── shipments/    # Shipment forms
│   ├── payments/     # Payment components
│   └── reports/      # Report charts
├── pages/
│   ├── auth/         # Login, Register, ForgotPassword
│   ├── dashboard/    # Dashboard, UserList
│   ├── shipments/    # ShipmentList, CreateShipment, ShipmentDetail
│   ├── tracking/     # TrackShipment
│   ├── fleet/        # VehicleList, FleetList
│   └── reports/      # Reports
├── store/            # Zustand stores
├── services/         # API and Socket services
├── hooks/            # Custom React hooks
├── utils/            # Helper functions
└── styles/           # Global CSS
```
