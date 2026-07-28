import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ArrowLeft, Package, MapPin, Clock, User, 
  Phone, DollarSign, Star, Truck, Navigation, CheckCircle, PackageCheck,
  CreditCard, Building2, ExternalLink, Banknote, Copy, Check
} from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { connectSocket, joinShipmentTracking, leaveShipmentTracking, onLocationUpdate, offLocationUpdate, disconnectSocket } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';

const statusSteps = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: Package },
  { key: 'picked_up', label: 'Picked Up', icon: Truck },
  { key: 'in_transit', label: 'In Transit', icon: Navigation },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Package },
];

const StatusBadge = ({ status }) => {
  const colors = {
    pending: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    confirmed: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    picked_up: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
    in_transit: 'bg-purple-50 text-purple-700 border border-purple-200/60',
    at_hub: 'bg-cyan-50 text-cyan-700 border border-cyan-200/60',
    out_for_delivery: 'bg-orange-50 text-orange-700 border border-orange-200/60',
    delivered: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    cancelled: 'bg-red-50 text-red-700 border border-red-200/60',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold capitalize ${colors[status] || 'bg-surface-50 text-surface-700'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [riderLocation, setRiderLocation] = React.useState(null);
  const [paymentMode, setPaymentMode] = React.useState(null);
  const [copied, setCopied] = React.useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['shipment', id],
    queryFn: async () => {
      const { data } = await api.get(`/shipments/${id}`);
      return data.data;
    },
  });

  const { data: paymentAccount } = useQuery({
    queryKey: ['payment-account'],
    queryFn: async () => {
      const { data } = await api.get('/payment-accounts/active');
      return data.data;
    },
  });

  const initiatePayMutation = useMutation({
    mutationFn: () => api.post(`/payments/${id}/initiate`),
    onSuccess: (res) => {
      window.location.href = res.data.data.authorizationUrl;
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Payment initiation failed'),
  });

  useEffect(() => {
    if (!id) return;

    const socket = connectSocket();
    if (socket) {
      joinShipmentTracking(id);
      onLocationUpdate((location) => {
        setRiderLocation(location);
      });
    }

    return () => {
      leaveShipmentTracking(id);
      offLocationUpdate();
    };
  }, [id]);

  const statusUpdateMutation = useMutation({
    mutationFn: ({ status, note }) => api.patch(`/shipments/${id}/status`, { status, note }),
    onSuccess: () => {
      toast.success('Status updated');
      refetch();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Update failed'),
  });

  const rateMutation = useMutation({
    mutationFn: (data) => api.post(`/shipments/${id}/rate`, data),
    onSuccess: () => {
      toast.success('Rating submitted');
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-surface-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  const shipment = data;
  const currentStepIndex = statusSteps.findIndex(s => s.key === shipment?.status);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-100 rounded-xl text-surface-500 hover:text-surface-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-surface-900 tracking-tight">{shipment?.trackingNumber}</h1>
            <StatusBadge status={shipment?.status} />
          </div>
          <p className="text-surface-500 mt-1">Created on {format(new Date(shipment?.createdAt), 'MMM d, yyyy HH:mm')}</p>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-0 right-0 h-1.5 bg-surface-100 rounded-full -z-10">
            <div 
              className="h-full bg-gradient-to-r from-primary-600 to-accent-600 rounded-full transition-all duration-700"
              style={{ width: `${Math.max(0, (currentStepIndex / (statusSteps.length - 1)) * 100)}%` }}
            />
          </div>
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            return (
              <div key={step.key} className="flex flex-col items-center gap-2 bg-white px-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-lg shadow-accent-500/30' 
                    : 'bg-surface-100 text-surface-400'
                } ${isCurrent ? 'ring-4 ring-accent-100 scale-110' : ''}`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-semibold ${isCompleted ? 'text-accent-700' : 'text-surface-400'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route */}
          <div className="card">
            <h3 className="font-bold text-surface-900 mb-4">Route Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-surface-900">Pickup</p>
                  <p className="text-sm text-surface-600">{shipment?.pickupAddress}</p>
                  <p className="text-xs text-surface-400 mt-1">{format(new Date(shipment?.pickupDate), 'MMM d, yyyy')}</p>
                </div>
              </div>
              <div className="ml-4 w-0.5 h-8 bg-gradient-to-b from-emerald-200 to-accent-200" />
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-accent-600" />
                </div>
                <div>
                  <p className="font-semibold text-surface-900">Delivery</p>
                  <p className="text-sm text-surface-600">{shipment?.deliveryAddress}</p>
                  {shipment?.deliveryContactName && (
                    <p className="text-sm text-surface-500 mt-1">{shipment.deliveryContactName} • {shipment.deliveryContactPhone}</p>
                  )}
                </div>
              </div>
            </div>

            {shipment?.route?.distance && (
              <div className="mt-4 p-4 bg-surface-50 rounded-xl flex items-center justify-between text-sm">
                <span className="text-surface-600">Distance: <strong className="text-surface-900">{shipment.route.distance.toFixed(1)} km</strong></span>
                <span className="text-surface-600">Est. Time: <strong className="text-surface-900">{shipment.route.duration} mins</strong></span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="card">
            <h3 className="font-bold text-surface-900 mb-4">Items</h3>
            <div className="space-y-3">
              {shipment?.items?.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-accent-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-surface-900">{item.name}</p>
                      <p className="text-xs text-surface-500">{item.category} • {item.weight}kg</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-surface-900">x{item.quantity}</p>
                    {item.fragile && <span className="text-xs font-semibold text-amber-600">Fragile</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking History */}
          <div className="card">
            <h3 className="font-bold text-surface-900 mb-4">Tracking History</h3>
            <div className="space-y-4">
              {shipment?.trackingHistory?.map((event, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 mt-2 flex-shrink-0 ring-4 ring-accent-50" />
                  <div className="flex-1">
                    <p className="font-semibold text-surface-900 capitalize">{event.status?.replace('_', ' ')}</p>
                    <p className="text-sm text-surface-600">{event.note}</p>
                    <p className="text-xs text-surface-400 mt-1">{format(new Date(event.timestamp), 'MMM d, yyyy HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price */}
          <div className="card-elevated">
            <h3 className="font-bold text-surface-900 mb-4">Pricing</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-surface-500">Base Price</span>
                <span className="font-medium text-surface-700">₦{shipment?.basePrice?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Distance</span>
                <span className="font-medium text-surface-700">₦{shipment?.distancePrice?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Weight</span>
                <span className="font-medium text-surface-700">₦{shipment?.weightPrice?.toLocaleString()}</span>
              </div>
              <div className="border-t border-surface-100 pt-3 flex justify-between">
                <span className="font-bold text-surface-900">Total</span>
                <span className="text-lg font-bold gradient-text">₦{shipment?.totalAmount?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          {shipment?.paymentStatus !== 'paid' && user?.role !== 'rider' && user?.role !== 'admin' && user?.role !== 'super_admin' && (
            <div className="card space-y-4">
              <h3 className="font-bold text-surface-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-accent-600" />
                Payment
              </h3>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200/60">
                <span className="text-sm font-semibold text-amber-700">Status</span>
                <span className="text-sm font-bold text-amber-800 capitalize">{shipment?.paymentStatus?.replace('_', ' ')}</span>
              </div>

              {!paymentMode && shipment?.paymentStatus === 'pending' && (
                <div className="space-y-3">
                  <button
                    onClick={() => setPaymentMode('paystack')}
                    disabled={initiatePayMutation.isPending}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                  >
                    {initiatePayMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    Pay with Card (Paystack)
                  </button>
                  <button
                    onClick={() => setPaymentMode('transfer')}
                    className="w-full btn-secondary flex items-center justify-center gap-2 py-3"
                  >
                    <Building2 className="w-4 h-4" />
                    Pay via Bank Transfer
                  </button>
                </div>
              )}

              {paymentMode === 'paystack' && (
                <div className="space-y-3">
                  <div className="p-4 bg-surface-50 rounded-xl text-sm text-surface-600">
                    You'll be redirected to Paystack to complete payment of <strong className="text-surface-900">₦{shipment?.totalAmount?.toLocaleString()}</strong>
                  </div>
                  <button
                    onClick={() => initiatePayMutation.mutate()}
                    disabled={initiatePayMutation.isPending}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                  >
                    {initiatePayMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    Proceed to Paystack
                  </button>
                  <button onClick={() => setPaymentMode(null)} className="w-full text-sm text-surface-500 hover:text-surface-700 text-center py-1">
                    Back to options
                  </button>
                </div>
              )}

              {paymentMode === 'transfer' && paymentAccount && (
                <div className="space-y-3">
                  <div className="p-4 bg-surface-50 rounded-xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-surface-900">{paymentAccount.accountName}</p>
                        <p className="text-sm text-surface-500">{paymentAccount.bankName}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-surface-200">
                      <div>
                        <p className="text-xs text-surface-400 mb-0.5">Account Number</p>
                        <p className="font-bold text-lg font-mono tracking-wider text-surface-900">{paymentAccount.accountNumber}</p>
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(paymentAccount.accountNumber); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="p-2 hover:bg-surface-100 rounded-lg text-surface-400 hover:text-accent-600 transition-colors"
                      >
                        {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="text-xs text-surface-400 space-y-1">
                      <p>• Transfer the exact amount: <strong className="text-surface-700">₦{shipment?.totalAmount?.toLocaleString()}</strong></p>
                      <p>• Use your Order ID as reference: <strong className="text-surface-700">{shipment?.trackingNumber}</strong></p>
                      <p>• Payment will be confirmed manually by our team</p>
                    </div>
                  </div>
                  <button onClick={() => setPaymentMode(null)} className="w-full text-sm text-surface-500 hover:text-surface-700 text-center py-1">
                    Back to options
                  </button>
                </div>
              )}

              {paymentMode === 'transfer' && !paymentAccount && (
                <div className="p-4 bg-amber-50 rounded-xl text-sm text-amber-700">
                  No bank account has been set up yet. Please contact support.
                </div>
              )}
            </div>
          )}

          {/* Admin payment confirmation */}
          {(user?.role === 'admin' || user?.role === 'super_admin') && shipment?.paymentStatus === 'pending' && (
            <div className="card space-y-3">
              <h3 className="font-bold text-surface-900">Payment Action</h3>
              <button
                onClick={async () => {
                  try {
                    await api.patch(`/shipments/${id}/confirm-payment`);
                    toast.success('Payment confirmed');
                    refetch();
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed');
                  }
                }}
                className="w-full bg-emerald-500 text-white rounded-lg font-semibold text-sm py-3 hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm Payment (Bank Transfer)
              </button>
            </div>
          )}

          {/* Rider Actions */}
          {user?._id === shipment?.rider?._id && shipment?.status !== 'delivered' && shipment?.status !== 'cancelled' && (
            <div className="card space-y-3">
              <h3 className="font-bold text-surface-900">Actions</h3>
              {shipment?.status === 'confirmed' && (
                <button
                  onClick={() => statusUpdateMutation.mutate({ status: 'picked_up', note: 'Package picked up from sender' })}
                  disabled={statusUpdateMutation.isPending}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                >
                  {statusUpdateMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <PackageCheck className="w-4 h-4" />
                  )}
                  Mark as Picked Up
                </button>
              )}
              {shipment?.status === 'picked_up' && (
                <button
                  onClick={() => statusUpdateMutation.mutate({ status: 'in_transit', note: 'Package in transit to destination' })}
                  disabled={statusUpdateMutation.isPending}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                >
                  {statusUpdateMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  Mark as In Transit
                </button>
              )}
              {shipment?.status === 'in_transit' && (
                <button
                  onClick={() => statusUpdateMutation.mutate({ status: 'out_for_delivery', note: 'Package out for delivery' })}
                  disabled={statusUpdateMutation.isPending}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                >
                  {statusUpdateMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Truck className="w-4 h-4" />
                  )}
                  Out for Delivery
                </button>
              )}
              {shipment?.status === 'out_for_delivery' && (
                shipment?.paymentStatus === 'paid' ? (
                  <button
                    onClick={() => statusUpdateMutation.mutate({ status: 'delivered', note: 'Package delivered successfully' })}
                    disabled={statusUpdateMutation.isPending}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-semibold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 py-3 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 active:scale-[0.98]"
                  >
                    {statusUpdateMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Mark as Delivered
                  </button>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-sm text-amber-700 text-center">
                    Payment must be confirmed before delivery
                  </div>
                )
              )}
            </div>
          )}

          {/* Customer Confirm Delivery */}
          {user?._id === shipment?.customer?._id && shipment?.status === 'out_for_delivery' && shipment?.paymentStatus === 'paid' && (
            <div className="card space-y-3">
              <h3 className="font-bold text-surface-900">Confirm Delivery</h3>
              <p className="text-sm text-surface-600">Have you received your package?</p>
              <button
                onClick={async () => {
                  try {
                    await api.post(`/shipments/${id}/confirm-delivery`);
                    toast.success('Delivery confirmed! Thank you.');
                    refetch();
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to confirm delivery');
                  }
                }}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-semibold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 py-3 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 active:scale-[0.98]"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm Delivery
              </button>
            </div>
          )}

          {/* Rider Info */}
          {shipment?.rider && (
            <div className="card">
              <h3 className="font-bold text-surface-900 mb-4">Assigned Rider</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white font-bold shadow-lg shadow-accent-500/20">
                  {shipment.rider.firstName[0]}{shipment.rider.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold text-surface-900">{shipment.rider.firstName} {shipment.rider.lastName}</p>
                  <p className="text-sm text-surface-500">{shipment.rider.phone}</p>
                </div>
              </div>
              {riderLocation && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200/60">
                  <p className="text-sm font-semibold text-emerald-700">Live Location</p>
                  <p className="text-xs text-emerald-600 mt-1">Lat: {riderLocation.lat.toFixed(4)}, Lng: {riderLocation.lng.toFixed(4)}</p>
                </div>
              )}
            </div>
          )}

          {/* Rating */}
          {shipment?.status === 'delivered' && !shipment?.rating && (
            <div className="card">
              <h3 className="font-bold text-surface-900 mb-4">Rate Delivery</h3>
              <div className="flex gap-1.5 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => rateMutation.mutate({ score: star })}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star className="w-7 h-7 text-surface-300 hover:text-amber-400 fill-current" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {shipment?.rating && (
            <div className="card">
              <h3 className="font-bold text-surface-900 mb-2">Your Rating</h3>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-6 h-6 ${star <= shipment.rating.score ? 'text-amber-400 fill-current' : 'text-surface-300'}`} 
                  />
                ))}
              </div>
              {shipment.rating.comment && (
                <p className="mt-2 text-sm text-surface-600">{shipment.rating.comment}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
