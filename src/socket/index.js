import { User, Shipment } from '../models/index.js';

export const setupSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const jwt = await import('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.join(`user:${user._id}`);

      if (user.role === 'rider') {
        socket.join('riders');
        await User.findByIdAndUpdate(user._id, { 'riderProfile.isOnline': true });
      }

      if (['admin', 'super_admin', 'dispatcher'].includes(user.role)) {
        socket.join('dispatchers');
      }

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);

    socket.on('rider:location', async (data) => {
      if (socket.userRole !== 'rider') return;

      const { lat, lng, shipmentId } = data;

      try {
        await User.findByIdAndUpdate(socket.userId, {
          'riderProfile.currentLocation': { lat, lng, lastUpdated: new Date() },
        });

        if (shipmentId) {
          io.to(`shipment:${shipmentId}`).emit('location:update', {
            riderId: socket.userId,
            lat,
            lng,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    socket.on('shipment:track', async (shipmentId) => {
      try {
        const shipment = await Shipment.findById(shipmentId);
        if (!shipment) {
          return socket.emit('error', { message: 'Shipment not found' });
        }

        const isAuthorized = 
          shipment.customer.toString() === socket.userId ||
          shipment.rider?.toString() === socket.userId ||
          ['admin', 'super_admin', 'dispatcher'].includes(socket.userRole);

        if (!isAuthorized) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        socket.join(`shipment:${shipmentId}`);
        socket.emit('shipment:joined', { shipmentId });

        if (shipment.rider) {
          const rider = await User.findById(shipment.rider).select('riderProfile.currentLocation');
          if (rider?.riderProfile?.currentLocation) {
            socket.emit('location:update', {
              riderId: shipment.rider,
              ...rider.riderProfile.currentLocation,
            });
          }
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join tracking' });
      }
    });

    socket.on('shipment:leave', (shipmentId) => {
      socket.leave(`shipment:${shipmentId}`);
    });

    socket.on('admin:broadcast', async (data) => {
      if (!['admin', 'super_admin'].includes(socket.userRole)) return;
      io.emit('admin:notification', data);
    });

    socket.on('disconnect', async () => {
      if (socket.userRole === 'rider') {
        await User.findByIdAndUpdate(socket.userId, {
          'riderProfile.isOnline': false,
        });
      }
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
};

export const emitShipmentUpdate = (io, shipmentId, data) => {
  io.to(`shipment:${shipmentId}`).emit('shipment:update', data);
};

export const emitNewShipment = (io, data) => {
  io.to('dispatchers').emit('shipment:new', data);
};
