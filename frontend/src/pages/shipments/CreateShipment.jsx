import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from 'joi';
import { Plus, Trash2, ArrowLeft, Package, MapPin, Navigation, Crosshair, Calendar, Clock, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const itemSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(''),
  quantity: Joi.number().integer().min(1).required(),
  weight: Joi.number().min(0.1).required(),
  value: Joi.number().min(0).default(0),
  category: Joi.string().valid('document', 'parcel', 'electronics', 'food', 'medical', 'other').default('parcel'),
  fragile: Joi.boolean().default(false),
});

const schema = Joi.object({
  pickupAddress: Joi.string().required(),
  deliveryAddress: Joi.string().required(),
  pickupDate: Joi.date().required(),
  pickupTimeWindow: Joi.object({
    start: Joi.string(),
    end: Joi.string(),
  }),
  deliveryContactName: Joi.string().allow(''),
  deliveryContactPhone: Joi.string().allow(''),
  deliveryInstructions: Joi.string().allow(''),
  items: Joi.array().items(itemSchema).min(1).required(),
  serviceType: Joi.string().valid('standard', 'express', 'same_day', 'scheduled').default('standard'),
  pickupCoordinates: Joi.object({
    lat: Joi.number(),
    lng: Joi.number(),
  }).optional(),
  deliveryCoordinates: Joi.object({
    lat: Joi.number(),
    lng: Joi.number(),
  }).optional(),
});

export default function CreateShipment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState('');

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: joiResolver(schema),
    defaultValues: {
      items: [{ name: '', quantity: 1, weight: 1, value: 0, category: 'parcel', fragile: false }],
      serviceType: 'standard',
      pickupTimeWindow: { start: '09:00', end: '17:00' },
    },
  });

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    setLocateError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setPickupCoords({ lat: latitude, lng: longitude });
        setValue('pickupCoordinates', { lat: latitude, lng: longitude });
        try {
          const { data } = await api.post('/geocode/reverse', { lat: latitude, lng: longitude });
          if (data.success && data.data?.address) {
            setValue('pickupAddress', data.data.address);
          } else {
            setValue('pickupAddress', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        } catch {
          setValue('pickupAddress', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocateError('Location access denied. Please enable it in your browser settings.');
            break;
          case err.POSITION_UNAVAILABLE:
            setLocateError('Location unavailable. Try again later.');
            break;
          case err.TIMEOUT:
            setLocateError('Location request timed out.');
            break;
          default:
            setLocateError('Could not get your location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/shipments', data),
    onSuccess: (response) => {
      toast.success('Order created successfully!');
      navigate(`/shipments/${response.data.data._id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create shipment');
    },
  });

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  const serviceTypes = [
    { value: 'standard', label: 'Standard', desc: '2-3 business days', price: 'Base rate' },
    { value: 'express', label: 'Express', desc: 'Next business day', price: '+50%' },
    { value: 'same_day', label: 'Same Day', desc: 'Delivered today', price: '+100%' },
    { value: 'scheduled', label: 'Scheduled', desc: 'Pick your date', price: '+20%' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Order</h1>
          <p className="text-gray-500">Book a new delivery</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {s}
            </div>
            {s < 3 && <div className={`flex-1 h-1 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && (
          <div className="card space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent-600" />
              Pickup & Delivery Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Pickup Details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
                  <div className="flex gap-2">
                    <input {...register('pickupAddress')} className="input-field flex-1" placeholder="Enter pickup address" />
                    <button
                      type="button"
                      onClick={useMyLocation}
                      disabled={isLocating}
                      className="btn-secondary flex items-center gap-2 px-3 py-2 text-sm whitespace-nowrap"
                    >
                      {isLocating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Crosshair className="w-4 h-4 text-accent-600" />
                      )}
                      {isLocating ? 'Locating...' : 'Use My Location'}
                    </button>
                  </div>
                  {errors.pickupAddress && <p className="text-sm text-red-600 mt-1">{errors.pickupAddress.message}</p>}
                  {locateError && <p className="text-sm text-red-600 mt-1">{locateError}</p>}
                  {pickupCoords && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-3 h-3 text-accent-600" />
                        {pickupCoords.lat.toFixed(6)}, {pickupCoords.lng.toFixed(6)}
                      </div>
                      <div className="rounded-lg overflow-hidden border border-gray-200">
                        <iframe
                          title="Pickup location"
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${pickupCoords.lng - 0.01},${pickupCoords.lat - 0.01},${pickupCoords.lng + 0.01},${pickupCoords.lat + 0.01}&layer=mapnik&marker=${pickupCoords.lat},${pickupCoords.lng}`}
                          width="100%"
                          height="200"
                          style={{ border: 0 }}
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                  <input type="date" {...register('pickupDate')} className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                    <input type="time" {...register('pickupTimeWindow.start')} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                    <input type="time" {...register('pickupTimeWindow.end')} className="input-field" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Delivery Details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                  <input {...register('deliveryAddress')} className="input-field" placeholder="Enter delivery address" />
                  {errors.deliveryAddress && <p className="text-sm text-red-600 mt-1">{errors.deliveryAddress.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input {...register('deliveryContactName')} className="input-field" placeholder="Recipient name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input {...register('deliveryContactPhone')} className="input-field" placeholder="Recipient phone" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                  <textarea {...register('deliveryInstructions')} className="input-field" rows={2} placeholder="Any special instructions..." />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={() => setStep(2)} className="btn-primary">Continue</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-accent-600" />
              Items & Service
            </h2>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-700">Item {index + 1}</h4>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <input {...register(`items.${index}.name`)} className="input-field" placeholder="Item name" />
                    </div>
                    <div>
                      <input type="number" {...register(`items.${index}.quantity`)} className="input-field" placeholder="Quantity" min="1" />
                    </div>
                    <div>
                      <input type="number" step="0.1" {...register(`items.${index}.weight`)} className="input-field" placeholder="Weight (kg)" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <select {...register(`items.${index}.category`)} className="input-field">
                        <option value="parcel">Parcel</option>
                        <option value="document">Document</option>
                        <option value="electronics">Electronics</option>
                        <option value="food">Food</option>
                        <option value="medical">Medical</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <input type="number" {...register(`items.${index}.value`)} className="input-field" placeholder="Value (₦)" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" {...register(`items.${index}.fragile`)} id={`fragile-${index}`} className="rounded" />
                      <label htmlFor={`fragile-${index}`} className="text-sm text-gray-600">Fragile</label>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => append({ name: '', quantity: 1, weight: 1, value: 0, category: 'parcel', fragile: false })}
                className="btn-secondary flex items-center gap-2 w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-3">Service Type</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {serviceTypes.map((type) => (
                  <label key={type.value} className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                    watch('serviceType') === type.value ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input type="radio" {...register('serviceType')} value={type.value} className="sr-only" />
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.desc}</div>
                    <div className="text-sm font-medium text-accent-600 mt-1">{type.price}</div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">Back</button>
              <button type="button" onClick={() => setStep(3)} className="btn-primary">Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card space-y-6">
            <h2 className="text-lg font-semibold">Review & Confirm</h2>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-gray-500">Pickup</p>
                  <p className="font-medium">{watch('pickupAddress')}</p>
                  <p className="text-gray-500 mt-1">{watch('pickupDate')}</p>
                  {pickupCoords && (
                    <p className="text-xs text-gray-400 mt-1">
                      {pickupCoords.lat.toFixed(4)}, {pickupCoords.lng.toFixed(4)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-gray-500">Delivery</p>
                  <p className="font-medium">{watch('deliveryAddress')}</p>
                  <p className="text-gray-500 mt-1">{watch('deliveryContactName')}</p>
                </div>
              </div>
              {pickupCoords && (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <iframe
                    title="Map preview"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${pickupCoords.lng - 0.02},${pickupCoords.lat - 0.02},${pickupCoords.lng + 0.02},${pickupCoords.lat + 0.02}&layer=mapnik&marker=${pickupCoords.lat},${pickupCoords.lng}`}
                    width="100%"
                    height="250"
                    style={{ border: 0 }}
                    loading="lazy"
                  />
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-2">Items ({fields.length})</p>
                {fields.map((_, i) => (
                  <div key={i} className="flex justify-between py-1">
                    <span>{watch(`items.${i}.name`)} x{watch(`items.${i}.quantity`)}</span>
                    <span>{watch(`items.${i}.weight`)}kg</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Service</p>
                <p className="font-medium capitalize">{watch('serviceType')?.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary">Back</button>
              <button 
                type="submit" 
                disabled={createMutation.isPending}
                className="btn-primary"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
