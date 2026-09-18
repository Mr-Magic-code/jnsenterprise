'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  MessageCircle,
  Mic,
  ChevronDown
} from 'lucide-react';
import { isValidPhoneNumber, CountryCode } from 'libphonenumber-js';
import Support from '@/components/GeneralFormsComponents/Support';

// Custom SVG Icons
function FacebookIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function LinkedinIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

// Custom Snapchat SVG Icon
function SnapchatIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.016 2.002c-3.79 0-6.19 2.593-6.19 5.753 0 .74.15 1.573.457 2.378-.458.118-.946.25-1.34.425-.39.172-.647.41-.647.674 0 .425.642.72 1.458.825.07.453.228 1.157.65 1.637.24.272.54.436.87.492.368.062.77-.023 1.187-.17.477-.168.96-.34 1.474-.34.433 0 .825.127 1.257.295.534.208 1.135.442 1.874.442.736 0 1.34-.234 1.873-.442.433-.168.825-.295 1.258-.295.513 0 .997.172 1.474.34.417.147.818.232 1.186.17.33-.056.63-.22.87-.492.422-.48.58-1.184.65-1.637.816-.105 1.458-.4 1.458-.825 0-.264-.257-.502-.647-.674-.394-.175-.882-.307-1.34-.425.307-.805.457-1.638.457-2.378 0-3.16-2.4-5.753-6.19-5.753z" />
    </svg>
  );
}

const countryCodeMap: Record<string, CountryCode> = {
  '+92': 'PK',
  '+971': 'AE',
  '+966': 'SA',
  '+974': 'QA',
  '+973': 'BH',
  '+965': 'KW',
  '+44': 'GB',
  '+1': 'US',
  '+61': 'AU',
  '+353': 'IE',
  '+60': 'MY',
  '+49': 'DE',
  '+64': 'NZ',
};

interface ContactGuideSectionProps {
  formName?: string;
  onSubmitSuccess?: (data: Record<string, unknown>) => void;
  className?: string;
}

export default function ContactGuideSection({
  formName = 'Guide Contact Form',
  onSubmitSuccess,
  className = '',
}: ContactGuideSectionProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneCode: '+92',
    phoneNumber: '',
    email: '',
    service: '',
    consent: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => {
      let finalValue: string | boolean = type === 'checkbox' ? checked : value;

      if (name === 'phoneNumber' && typeof finalValue === 'string') {
        finalValue = finalValue.replace(/\D/g, '');
      }

      const updated = { ...prev, [name]: finalValue };

      if (name === 'phoneNumber' || name === 'phoneCode') {
        const countryIso = countryCodeMap[updated.phoneCode];
        if (updated.phoneNumber) {
          if (!isValidPhoneNumber(updated.phoneNumber, countryIso)) {
            setPhoneError('Invalid phone number.');
          } else {
            setPhoneError('');
          }
        } else {
          setPhoneError('');
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!formData.phoneNumber.trim() || !formData.consent) {
      setStatusMessage({
        type: 'error',
        text: 'Please fill out required fields and give your consent.',
      });
      return;
    }

    const countryIso = countryCodeMap[formData.phoneCode];
    if (!isValidPhoneNumber(formData.phoneNumber, countryIso)) {
      setPhoneError('Please enter a valid phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        formName,
        sourceUrl: typeof window !== 'undefined' ? window.location.href : '',
      };

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to submit form.');
      }

      setStatusMessage({
        type: 'success',
        text: 'Your inquiry has been submitted successfully!',
      });

      if (onSubmitSuccess) {
        onSubmitSuccess(payload);
      }

      setFormData({
        firstName: '',
        lastName: '',
        phoneCode: '+92',
        phoneNumber: '',
        email: '',
        service: '',
        consent: false,
      });
      setPhoneError('');
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: (err as Error).message || 'Something went wrong.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={`w-full bg-white py-12 md:py-16 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">

        {/* Left Side: Contact Information */}
        <div className="lg:col-span-4 space-y-8">

          {/* Find Us */}
          <div className="flex items-start gap-4 mb-15">
            <div className="w-12 h-12 rounded-xl bg-[#e8f1ff] flex items-center justify-center shrink-0 text-[#0071f6]">
              <MapPin className="w-6 h-6 fill-[#0071f6] text-white" />
            </div>
            <div>
              <h3 className="small-heading text-black">Find Us</h3>
              <p className="text-gray-600 text-sm mb-2">Come say hello at our office.</p>
              <p className="text-[#0071f6] font-medium text-sm">JnS Education</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Wood lodge, Westwood road,<br />
                Windlesham, Surrey, GU20 6LT
              </p>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="flex items-start gap-4 mb-15">
            <div className="w-12 h-12 rounded-xl bg-[#e8f1ff] flex items-center justify-center shrink-0 text-[#0071f6]">
              <MessageCircle className="w-6 h-6 fill-[#0071f6] text-white" />
            </div>
            <div>
              <h3 className="small-heading text-black">WhatsApp</h3>
              <p className="text-gray-600 text-sm mb-2">Our friendly team is here to help.</p>
              <Link
                href="https://wa.me/447766317128"
                target="_blank"
                className="text-[#0071f6] hover:underline font-medium text-sm inline-block"
              >
                Click here to start WhatsApp chat
              </Link>
            </div>
          </div>

          {/* Let's Talk */}
          <div className="flex items-start gap-4 mb-15">
            <div className="w-12 h-12 rounded-xl bg-[#e8f1ff] flex items-center justify-center shrink-0 text-[#0071f6]">
              <Mic className="w-6 h-6 fill-[#0071f6] text-white" />
            </div>
            <div>
              <h3 className="small-heading text-black">Let&apos;s Talk</h3>
              <p className="text-gray-600 text-sm mb-3">Reach out with your queries at given contacts.</p>
              <p className="mb-1">
                <Link href="tel:+447766317128" className="text-[#0071f6] hover:underline font-medium text-sm">
                  +447766317128
                </Link>
              </p>
              <p>
                <Link href="mailto:bm.uk@jnsedu.com" className="text-[#0071f6] hover:underline font-medium text-sm">
                  bm.uk@jnsedu.com
                </Link>
              </p>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-2 pt-2 pl-15">
            <Link
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-9 h-9 rounded-lg bg-[#0071f6] text-white flex items-center justify-center hover:bg-[#005ecb] transition-colors"
            >
              <FacebookIcon className="w-5 h-5 fill-current" />
            </Link>
            <Link
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-9 h-9 rounded-lg bg-[#0071f6] text-white flex items-center justify-center hover:bg-[#005ecb] transition-colors"
            >
              <InstagramIcon className="w-5 h-5" />
            </Link>

            <Link
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="w-9 h-9 rounded-lg bg-[#0071f6] text-white flex items-center justify-center hover:bg-[#005ecb] transition-colors"
            >
              <LinkedinIcon className="w-5 h-5 fill-current" />
            </Link>
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="lg:col-span-8  rounded-2xl p-6 sm:p-8 md:p-12 relative overflow-hidden border-1 border-mustard">
          {/* Form */}
          <Support />
        </div>
      </div>
    </section>
  );
}