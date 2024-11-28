import React from 'react';
import RechargeForm from './components/RechargeForm';
import { Smartphone } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center mb-8">
              <div className="flex justify-center">
                <Smartphone className="h-12 w-12 text-indigo-600" />
              </div>
              <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
                Mobile Recharge Portal
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Quick and secure mobile recharge service
              </p>
            </div>
            <RechargeForm />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;