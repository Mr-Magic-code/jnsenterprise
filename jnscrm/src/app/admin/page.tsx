'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/auth.service';

const LEFT_SVG_URL =
  'https://dev.jnsedu.co.uk/resources/views/theme/backend/default/assets/img/left_img_login.svg';

export default function AdminSignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branchOffice, setBranchOffice] = useState('');
  const [secretKey, setSecretKey] = useState(''); // Secret Key State
  
  // Custom Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const branches = [
    'Qatar Branch', 'Kuwait Branch', 'Bahrain Branch', 'Riyadh Branch', 
    'Jeddah Branch', 'Islamabad Branch', 'Karachi Branch', 
    'Lahore Gulberg Branch', 'Lahore DHA Branch', 'Faisalabad Branch', 'Multan Branch'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim() || !email.trim() || !password.trim() || !branchOffice || !secretKey.trim()) {
      setErrorMessage('Please fill in all the fields including the Secret Key.');
      return;
    }

    setIsLoading(true);

    try {
      // Centralized service call with secretKey matching backend DTO
      await authService.registerManager({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        branch_office: branchOffice,
        secretKey: secretKey.trim(),
      });

      setSuccessMessage('Registration successful! Your request has been sent to the Super Admin for approval.');
      setFullName('');
      setEmail('');
      setPassword('');
      setBranchOffice('');
      setSecretKey('');

      setTimeout(() => {
        window.location.replace('/login');
      }, 2000);

    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col md:flex-row bg-white md:min-h-screen">
      
      {/* Left Side: SVG Illustration Banner */}
      <div className="hidden md:flex w-full md:w-[54%] lg:w-[40%] bg-[#ee7d65] items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-[620px] flex items-center justify-center text-center flex-col">
          <img
            src={LEFT_SVG_URL}
            alt="Manager Registration Banner"
            className="mb-8"
          />
          <h2 className="text-white text-3xl font-semibold mb-2">Manager Portal</h2>
          <p className="text-white/80 text-sm">Register to access your branch dashboard and manage leads.</p>
        </div>
      </div>

      {/* Right Side: Signup Form */}
      <div className="w-full md:w-[46%] lg:w-[30%] bg-white flex flex-col justify-between items-center py-10 px-6 pb-[50px] md:justify-center">
        
        {/* Form Container */}
        <div className="w-full max-w-[340px] flex flex-col items-center">
          <div className="w-full">
            <h1 className="text-2xl font-normal text-[#e5775c] mb-5">
              Manager Registration
            </h1>

            {errorMessage && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-2.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] text-gray-700 font-normal mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ali Khan"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:border-[#e5775c] transition"
                />
              </div>

              <div>
                <label className="block text-[13px] text-gray-700 font-normal mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@domain.com"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:border-[#e5775c] transition"
                />
              </div>

              {/* CUSTOM DROPDOWN SECTION */}
              <div className="relative">
                <label className="block text-[13px] text-gray-700 font-normal mb-1">
                  Branch Office
                </label>
                
                <div 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full px-3 py-2 bg-white border rounded text-sm cursor-pointer flex justify-between items-center transition-colors duration-200 ${
                    isDropdownOpen ? 'border-[#e5775c]' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <span className={branchOffice ? 'text-gray-800' : 'text-gray-400'}>
                    {branchOffice || 'Select your branch'}
                  </span>
                  
                  <svg 
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-md shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                    {branches.map((branch) => (
                      <div
                        key={branch}
                        onClick={() => {
                          setBranchOffice(branch);
                          setIsDropdownOpen(false);
                        }}
                        className={`px-4 py-2.5 text-sm cursor-pointer transition-colors duration-150 ${
                          branchOffice === branch 
                            ? 'bg-[#e5775c]/10 text-[#e5775c] font-medium' 
                            : 'text-gray-700 hover:bg-[#e5775c] hover:text-white'
                        }`}
                      >
                        {branch}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* END CUSTOM DROPDOWN */}

              <div>
                <label className="block text-[13px] text-gray-700 font-normal mb-1">
                  Secret Key
                </label>
                <input
                  type="password"
                  required
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter manager secret key"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:border-[#e5775c] transition"
                />
              </div>

              <div>
                <label className="block text-[13px] text-gray-700 font-normal mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••••"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:border-[#e5775c] transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-2.5 bg-[#e5775c] hover:bg-[#d6674c] active:bg-[#c6583d] text-white text-sm font-medium rounded shadow-sm transition duration-150 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? 'Submitting...' : 'Request Access'}
                </button>
              </div>
            </form>

            <div className="mt-6 space-y-1 text-[13px] text-gray-600 text-center">
              <p>
                Already have an account?{' '}
                <Link href="/login" className="text-[#0071f6] hover:underline font-medium">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}