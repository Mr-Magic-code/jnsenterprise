'use client';

import React, { useState, useRef, useEffect } from 'react';
import { isValidPhoneNumber, CountryCode } from 'libphonenumber-js';
import { ChevronDown } from 'lucide-react';

const countryCodeMap: Record<string, CountryCode> = {
    '+92': 'PK',
    '+973': 'BH',
    '+974': 'QA',
    '+966': 'SA',
    '+965': 'KW',
    '+971': 'AE',
    '+91': 'IN',
    '+968': 'OM',
    '+44': 'GB',
    '+1-US': 'US',
    '+1-CA': 'CA',
    '+61': 'AU',
    '+963': 'SY',
};

const countryFlags: Record<string, string> = {
    '+92': '🇵🇰',
    '+973': '🇧🇭',
    '+974': '🇶🇦',
    '+966': '🇸🇦',
    '+965': '🇰🇼',
    '+971': '🇦🇪',
    '+91': '🇮🇳',
    '+968': '🇴🇲',
    '+44': '🇬🇧',
    '+1-US': '🇺🇸',
    '+1-CA': '🇨🇦',
    '+61': '🇦🇺',
    '+963': '🇸🇾',
};

interface DropdownOption {
    label: string;
    value: string;
}

interface CustomDropdownProps {
    name: string;
    value: string;
    onChange: (name: string, value: string) => void;
    options: (string | DropdownOption)[];
    placeholder?: string;
}

function CustomDropdown({
    name,
    value,
    onChange,
    options,
    placeholder = '- Select -'
}: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const formattedOptions: DropdownOption[] = options.map(opt =>
        typeof opt === 'string' ? { label: opt, value: opt } : opt
    );

    const selectedOption = formattedOptions.find(opt => opt.value === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-[#f0f4f8] text-left text-sm flex items-center justify-between focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-150 cursor-pointer shadow-2xs text-gray-700"
            >
                <span className={selectedOption && selectedOption.value ? 'text-gray-800 font-medium' : 'text-gray-400'}>
                    {selectedOption && selectedOption.value ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 space-y-1 max-h-60 overflow-y-auto">
                    {formattedOptions.map((opt) => {
                        const isSelected = opt.value === value;
                        return (
                            <div
                                key={opt.value}
                                onClick={() => {
                                    onChange(name, opt.value);
                                    setIsOpen(false);
                                }}
                                className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors ${isSelected
                                    ? 'bg-[#eef5ff] text-[#0071f6]'
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-[#0071f6]'
                                    }`}
                            >
                                {opt.label}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function PTEForm({
    onSubmitSuccess,
    className = "",
}: {
    onSubmitSuccess?: (data: Record<string, unknown>) => void;
    className?: string;
}) {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneCode: '+971',
        phoneNumber: '',
        service: '',
        office: 'Other',
        specification: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [phoneError, setPhoneError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            let finalValue = value;
            if (name === 'phoneNumber' && typeof finalValue === 'string') {
                finalValue = finalValue.replace(/\D/g, '');
            }
            const newData = { ...prev, [name]: finalValue };

            if (name === 'phoneNumber' || name === 'phoneCode') {
                const phoneCodeKey = newData.phoneCode;
                const countryIso = countryCodeMap[phoneCodeKey];
                if (newData.phoneNumber && countryIso) {
                    const isValid = isValidPhoneNumber(newData.phoneNumber, countryIso);
                    if (isValid) {
                        setPhoneError('');
                    }
                }
            }
            return newData;
        });
    };

    const handleDropdownChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.fullName.trim() || !formData.email.trim() || !formData.phoneNumber.trim() || !formData.service) {
            alert('Please fill out all required fields.');
            return;
        }

        const countryIso = countryCodeMap[formData.phoneCode];
        if (countryIso && !isValidPhoneNumber(formData.phoneNumber, countryIso)) {
            setPhoneError('Please enter a valid phone number before submitting.');
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                firstName: formData.fullName.split(' ')[0] || formData.fullName,
                lastName: formData.fullName.split(' ').slice(1).join(' ') || '',
                email: formData.email,
                phoneCode: formData.phoneCode,
                phoneNumber: formData.phoneNumber,
                preferredCourseLevel: formData.service, // Store selected service
                countryOfResidence: formData.office,    // Store office / region selection
                recentQualification: formData.specification, // Store specify textarea
                sourceUrl: typeof window !== 'undefined' ? window.location.href : '',
                formName: 'PTE Form',
                consent: true
            };

            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to submit form');
            }

            if (onSubmitSuccess) {
                onSubmitSuccess(payload);
            }
            window.location.href = '/thank-you';

            setFormData({
                fullName: '',
                email: '',
                phoneCode: '+92',
                phoneNumber: '',
                service: '',
                office: 'Other',
                specification: '',
            });
            setPhoneError('');

        } catch (error: unknown) {
            console.error('Error submitting form:', (error as Error).message);
            alert('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`bg-white rounded-2xl shadow-xl border-t-4 border-amber-500 border-x border-b border-amber-100 p-6 md:p-8 max-w-md mx-auto ${className}`}>
            {/* Logo */}
            <div className="flex justify-center mb-6">
                <img
                    src="https://jnsedu.com/wp-content/uploads/2024/10/Jns-Education-Logo.svg"
                    alt="JnS Education Logo"
                    className="h-16 w-auto"
                />
            </div>

            {/* Title / Description */}
            <p className="text-center text-gray-800 font-semibold mb-6 px-2 text-sm leading-relaxed">
                <span className="text-red-600 font-bold">Register now</span> to take PTE Mock test in a
                real exam setting and experience an official PTE test environment!
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Candidate Full Name */}
                <div>
                    <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Candidate Full Name"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-[#f0f4f8] text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                    />
                </div>

                {/* Contact Number with Flag Dropdown */}
                <div className="flex gap-2">
                    <div className="relative">
                        <select
                            name="phoneCode"
                            value={formData.phoneCode}
                            onChange={handleChange}
                            className="h-full px-3 py-3 rounded-lg border border-gray-200 bg-blue-600 text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer appearance-none flex items-center justify-center gap-1 min-w-[70px] text-center"
                            style={{ backgroundImage: 'none' }}
                        >
                            {Object.keys(countryCodeMap).map((code) => (
                                <option key={code} value={code} className="bg-white text-gray-800">
                                    {countryFlags[code]} {code}
                                </option>
                            ))}
                        </select>
                    </div>
                    <input
                        type="tel"
                        name="phoneNumber"
                        required
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="Contact Number"
                        className={`w-full px-4 py-3 rounded-lg border ${phoneError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} bg-[#f0f4f8] text-gray-800 placeholder-gray-400 focus:ring-2 outline-none transition text-sm`}
                    />
                </div>
                {phoneError && (
                    <p className="text-red-500 text-xs mt-1">{phoneError}</p>
                )}

                {/* Email Address */}
                <div>
                    <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email Address"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-[#f0f4f8] text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                    />
                </div>

                {/* Select Service */}
                <div>
                    <CustomDropdown
                        name="service"
                        value={formData.service}
                        onChange={handleDropdownChange}
                        placeholder="- Select Service -"
                        options={[
                            'Register for Mock Test',
                            'PTE/IELTS Test Preparation',
                        ]}
                    />
                </div>

                {/* Office/Country select */}
                <div>
                    <CustomDropdown
                        name="office"
                        value={formData.office}
                        onChange={handleDropdownChange}
                        placeholder="- Select Office -"
                        options={[
                            'Study Abroad',
                            'Immigration',
                        ]}
                    />
                </div>


                {/* Register Button */}
                <div className="text-center pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-800 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50 text-sm"
                    >
                        {isSubmitting ? 'Registering...' : 'Register Now'}
                    </button>
                </div>
            </form>
        </div>
    );
}