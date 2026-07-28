import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Package, MapPin, Clock, CheckCircle, Truck, Navigation } from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';

const statusConfig = {
  pending: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Pending' },
  confirmed: { color: 'bg-blue-100 text-blue-700', icon: Package, label: 'Confirmed' },
  picked_up: { color: 'bg-indigo-100 text-indigo-700', icon: Truck, label: 'Picked Up' },
  in_transit: { color: 'bg-purple-100 text-purple-700', icon: Navigation, label: 'In Transit' },
  at_hub: { color: 'bg-cyan-100 text-cyan-700', icon: Package, label: 'At Hub' },
  out_for_delivery: { color: 'bg-orange-100 text-orange-700', icon: Truck, label: 'Out for Delivery' },
  delivered: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Delivered' },
  cancelled: { color: 'bg-red-100 text-red-700', icon: Clock, label: 'Cancelled' },
};

export default function TrackShipment() {
  const { trackingNumber: urlTracking } = useParams();
  const navigate = useNavigate();
  const [trackingInput, setTrackingInput] = useState(urlTracking || '');
  const [searchedTracking, setSearchedTracking] = useState(urlTracking || '');

  const { data, isLoading, error } = useQuery({
    queryKey: ['track', searchedTracking],
    queryFn: async () => {
      if (!searchedTracking) return null;
      const { data } = await api.get(`/shipments/track/${searchedTracking}`);
      return data.data;
    },
    enabled: !!searchedTracking,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (trackingInput.trim()) {
      setSearchedTracking(trackingInput.trim());
      navigate(`/track/${trackingInput.trim()}`, { replace: true });
    }
  };

  const shipment = data;
  const statusInfo = shipment ? statusConfig[shipment.status] : null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Track Your Order</h1>
          <p className="text-gray-500 mt-2">Enter your tracking number to get real-time updates</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="Enter tracking number (e.g., KNC-ABC123)"
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="px-8 py-4 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isLoading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {error && (
          <div className="text-center p-8 bg-white rounded-xl border border-gray-200">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Order Not Found</h3>
            <p className="text-gray-500">We couldn't find an order with that tracking number.</p>
          </div>
        )}

        {shipment && statusInfo && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500">Tracking Number</p>
                  <h2 className="text-2xl font-bold text-gray-900">{shipment.trackingNumber}</h2>
                </div>
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${statusInfo.color}`}>
                  <statusInfo.icon className="w-5 h-5" />
                  <span className="font-medium">{statusInfo.label}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-600 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${{
                        pending: '10%', confirmed: '25%', picked_up: '40%', 
                        in_transit: '60%', at_hub: '70%', out_for_delivery: '85%', 
                        delivered: '100%', cancelled: '0%'
                      }[shipment.status] || '0%'}` 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Route */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Delivery Route</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Pickup</p>
                      <p className="text-sm text-gray-600">{shipment.pickupAddress}</p>
                    </div>
                  </div>
                  <div className="ml-1.5 w-0.5 h-12 bg-gray-200 my-1" />
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary-600 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Delivery</p>
                      <p className="text-sm text-gray-600">{shipment.deliveryAddress}</p>
                    </div>
                  </div>
                </div>
                {shipment.route?.distance && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{shipment.route.distance.toFixed(1)}</p>
                    <p className="text-sm text-gray-500">km</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Tracking History</h3>
              <div className="space-y-0">
                {shipment.trackingHistory?.map((event, index) => {
                  const isLast = index === shipment.trackingHistory.length - 1;
                  const evtStatus = statusConfig[event.status];
                  return (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isLast ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {evtStatus ? <evtStatus.icon className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        {index < shipment.trackingHistory.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 my-1" />
                        )}
                      </div>
                      <div className={`pb-6 ${isLast ? '' : ''}`}>
                        <p className="font-medium text-gray-900 capitalize">{event.status?.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-600">{event.note}</p>
                        {event.location?.address && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {event.location.address}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(event.timestamp), 'MMM d, yyyy • HH:mm')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Service Type</p>
                  <p className="font-medium capitalize">{shipment.serviceType?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment Status</p>
                  <p className="font-medium capitalize">{shipment.paymentStatus}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Weight</p>
                  <p className="font-medium">{shipment.totalWeight} kg</p>
                </div>
                <div>
                  <p className="text-gray-500">Items</p>
                  <p className="font-medium">{shipment.items?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
