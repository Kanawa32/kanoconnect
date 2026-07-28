import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from 'joi';
import { Package, Eye, EyeOff, ArrowRight, Truck, Shield, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const schema = Joi.object({
  email: Joi.string().email({ tlds: false }).required().messages({
    'string.email': 'Please enter a valid email',
    'string.empty': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'string.empty': 'Password is required',
  }),
});

export default function Login() {
  const { login, error, clearError, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: joiResolver(schema),
  });

  const onSubmit = async (data) => {
    clearError();
    try {
      await login(data.email, data.password);
      window.location.href = '/dashboard';
    } catch (e) {
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding (hero style from reference) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-400/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-4xl font-extrabold tracking-tight">K</span>
            <span className="text-4xl font-extrabold text-accent-500">.</span>
            <div className="ml-1">
              <h1 className="text-2xl font-bold leading-tight">Kano<span className="text-accent-500">Connect</span></h1>
              <p className="text-[10px] text-white/40 tracking-[3px] font-semibold uppercase">LOGISTICS</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-extrabold mb-4 leading-tight">
            Delivering Trust.
            <span className="block text-accent-500">Connecting Possibilities.</span>
          </h2>
          <p className="text-lg text-white/70 mb-12 max-w-md">
            Enterprise logistics management made simple. Track, manage, and deliver with confidence.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                <Truck className="w-6 h-6 text-accent-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Real-time Tracking</h3>
                <p className="text-sm text-white/50">Monitor every delivery in real-time</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                <Shield className="w-6 h-6 text-accent-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Secure & Reliable</h3>
                <p className="text-sm text-white/50">Enterprise-grade security for your data</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                <Zap className="w-6 h-6 text-accent-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Lightning Fast</h3>
                <p className="text-sm text-white/50">Instant dispatch and delivery updates</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/25">
              <span className="text-white font-extrabold text-lg">K</span>
            </div>
            <div>
              <span className="text-xl font-bold text-surface-900">Kano<span className="text-accent-600">Connect</span></span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-surface-900 mb-2">Welcome back</h2>
            <p className="text-surface-500">Sign in to your account to continue</p>
          </div>

          <div className="card-elevated p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200/60 rounded-lg text-red-600 text-sm flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-red-500 text-lg">!</span>
                </div>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="input-field"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-500 font-medium">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className="input-field pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-surface-400 hover:text-surface-600 rounded-lg hover:bg-surface-100 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-500 font-medium">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-surface-300 text-accent-600 focus:ring-accent-500" />
                  <span className="text-sm text-surface-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm font-medium text-accent-600 hover:text-accent-700 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-surface-100">
              <p className="text-center text-sm text-surface-500">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-accent-600 hover:text-accent-700 transition-colors">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
