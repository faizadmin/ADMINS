import React, { useState } from 'react';
import { Phone, User, IndianRupee, Loader2 } from 'lucide-react';
import { config } from '../config';

interface FormData {
  customerMobile: string;
  customerName: string;
  amount: string;
}

interface ApiError {
  status: boolean;
  message: string;
}

export default function RechargeForm() {
  const [formData, setFormData] = useState<FormData>({
    customerMobile: '',
    customerName: '',
    amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    if (!/^\d{10}$/.test(formData.customerMobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return false;
    }
    
    if (!formData.customerName.trim()) {
      setError('Please enter customer name');
      return false;
    }
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_mobile: formData.customerMobile,
          amount: formData.amount,
          remark1: formData.customerName,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
      }
      
      if (data.status && data.result?.payment_url) {
        // Open payment URL in a new window/tab
        const paymentWindow = window.open(data.result.payment_url, '_blank');
        if (!paymentWindow) {
          setError('Please allow pop-ups to proceed with the payment');
        }
      } else {
        throw new Error(data.message || 'Invalid response from server');
      }
    } catch (error) {
      console.error('Payment Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mobile Number
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="tel"
            required
            pattern="[0-9]{10}"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter 10 digit mobile number"
            value={formData.customerMobile}
            onChange={(e) => {
              setError(null);
              setFormData({ ...formData, customerMobile: e.target.value.replace(/\D/g, '').slice(0, 10) });
            }}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Customer Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            required
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter customer name"
            value={formData.customerName}
            onChange={(e) => {
              setError(null);
              setFormData({ ...formData, customerName: e.target.value });
            }}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IndianRupee className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="number"
            required
            min="1"
            step="1"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter amount"
            value={formData.amount}
            onChange={(e) => {
              setError(null);
              setFormData({ ...formData, amount: e.target.value });
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
            Processing...
          </>
        ) : (
          'Proceed to Pay'
        )}
      </button>
    </form>
  );
}