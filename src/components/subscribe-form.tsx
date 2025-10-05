

import React, { useState, useRef, useEffect, type FormEvent } from 'react';
import { IconRefreshAlert, IconMailbox, IconSquareRoundedX, IconCheck } from '@tabler/icons-react';
import { markket } from '../../markket.config';

export interface SubscribeFormProps {
  store: {
    documentId: string;
  };
}

export function SubscribeForm({ store }: SubscribeFormProps) {
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const successRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isSuccess && successRef.current) successRef.current.focus();
  }, [isSuccess]);

  useEffect(() => {
    if (!isSuccess) return;
    const t = setTimeout(() => setIsSuccess(false), 6000);
    return () => clearTimeout(t);
  }, [isSuccess]);

  const validateEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(new URL(`/api/subscribers`, markket.api_url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          data: {
            Email: email,
            stores: store?.documentId ? [store.documentId] : [],
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Subscription failed');

      setIsSuccess(true);
      setEmail('');
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl md:max-w-6xl lg:max-w-7xl mx-auto my-16 px-4">
      <div className="relative overflow-hidden rounded-2xl shadow-2xl" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,250,255,0.9) 100%)' }}>
        <div className="pointer-events-none absolute -right-24 -top-24 w-64 h-64 rounded-full bg-gradient-to-tr from-pink-300 to-indigo-400 opacity-30 blur-3xl" />

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="p-8 md:p-10 flex flex-col justify-center">
            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">Join our newsletter</h3>
            <p className="mt-2 text-gray-600 max-w-lg">Short, delightful updates about products, design notes, and occasional exclusive offers. No spam — ever.</p>

            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <span className="p-2 bg-white rounded-full shadow-sm text-green-600"><IconCheck size={16} /></span>
                <span className="leading-tight">Curated product updates and releases</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <span className="p-2 bg-white rounded-full shadow-sm text-green-600"><IconCheck size={16} /></span>
                <span className="leading-tight">Design insights and short articles</span>
              </li>
            </ul>
          </div>

          <div className="p-6 md:p-8 border-l md:border-l border-transparent md:border-l-gray-50 bg-white md:bg-transparent flex items-center">
            <form onSubmit={handleSubmit} className="w-full" noValidate>
              {error && (
                <div id="subscribe-error" role="alert" aria-live="assertive" className="mb-3 text-sm text-red-600 font-medium">
                  {error}
                </div>
              )}

              <label htmlFor="subscribe-email" className="sr-only">Email address</label>
              <div className="flex flex-col gap-3">
                <div className="relative w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IconMailbox size={18} /></span>
                  <input
                    id="subscribe-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourdomain.com"
                    required
                    disabled={isSubmitting}
                    autoComplete="email"
                    aria-describedby={error ? 'subscribe-error' : 'subscribe-success'}
                    className={`w-full pl-11 pr-4 py-4 rounded-2xl border transition-shadow text-base text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:opacity-60 ${error ? 'border-red-300' : 'border-gray-200'}`}
                    style={{ minWidth: '20rem' }}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-md transform transition hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <IconRefreshAlert className="animate-spin" size={16} />
                        Subscribing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <IconMailbox size={16} />
                        Subscribe
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-500">We respect your privacy. Unsubscribe anytime.</p>

              {isSuccess && (
                <div className="mt-4">
                  <div
                    ref={successRef}
                    tabIndex={-1}
                    role="status"
                    aria-live="polite"
                    id="subscribe-success"
                    className="p-4 rounded-lg bg-white border border-green-100 text-green-900 shadow-md transform transition-all duration-300"
                    style={{ boxShadow: '0 10px 30px rgba(2,6,23,0.06)' }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="p-2 rounded-full bg-green-50 text-green-700"><IconCheck size={18} /></span>
                      <div className="flex-1">
                        <p className="font-semibold">You're subscribed — thank you!</p>
                        <p className="text-sm text-green-800/80">We'll send occasional updates to your inbox.</p>
                      </div>
                      <button aria-label="Dismiss" className="text-green-700 hover:text-green-900 p-1" onClick={() => setIsSuccess(false)}>
                        <IconSquareRoundedX size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubscribeForm;
