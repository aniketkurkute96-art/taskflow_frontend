import React, { useState, useEffect } from 'react';
import chequeService, { Cheque } from '../../services/chequeService';

interface GenerateOtpModalProps {
  cheque: Cheque;
  onClose: () => void;
  onSuccess: () => void;
}

const GenerateOtpModal: React.FC<GenerateOtpModalProps> = ({
  cheque,
  onClose,
  onSuccess,
}) => {
  const [channel, setChannel] = useState<'sms' | 'whatsapp' | 'email'>('sms');
  const [toContact, setToContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpGenerated, setOtpGenerated] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  useEffect(() => {
    if (expiresAt) {
      const interval = setInterval(() => {
        const now = new Date();
        const diff = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        setCountdown(diff);

        if (diff === 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [expiresAt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await chequeService.generateOtp(cheque.id, {
        channel,
        toContact,
      });

      setOtpGenerated(true);
      setExpiresAt(new Date(response.expiresAt));
      
      // Store dev OTP if provided
      if (response.otpCode) {
        setDevOtp(response.otpCode);
      }

      // Auto close after 2 seconds
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to generate OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-600">
            Generate OTP
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {otpGenerated ? (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  OTP Generated Successfully
                </h3>
                <p className="text-slate-400 mb-4">
                  OTP has been sent via {channel.toUpperCase()} to {toContact}
                </p>

                {devOtp && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                    <p className="text-xs text-yellow-400 mb-2">
                      Development Mode - OTP:
                    </p>
                    <p className="text-2xl font-mono font-bold text-yellow-400">
                      {devOtp}
                    </p>
                  </div>
                )}

                {countdown > 0 && (
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <p className="text-sm text-slate-400 mb-2">Expires in:</p>
                    <p className="text-3xl font-mono font-bold text-cyan-400">
                      {formatCountdown(countdown)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Cheque Info */}
              <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                <div className="text-sm text-slate-400 mb-1">Cheque No:</div>
                <div className="font-semibold text-slate-100">
                  {cheque.chequeNo}
                </div>
                <div className="text-sm text-slate-400 mt-2">Payee:</div>
                <div className="font-semibold text-slate-100">
                  {cheque.payeeName}
                </div>
                <div className="text-sm text-slate-400 mt-2">Amount:</div>
                <div className="font-semibold text-cyan-400">
                  ₹{cheque.amount.toLocaleString()}
                </div>
              </div>

              {/* Channel Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Delivery Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['sms', 'whatsapp', 'email'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setChannel(ch)}
                      className={`px-4 py-2 rounded-lg border font-medium capitalize transition-all ${
                        channel === ch
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                          : 'bg-slate-900/50 border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {channel === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <input
                  type={channel === 'email' ? 'email' : 'text'}
                  value={toContact}
                  onChange={(e) => setToContact(e.target.value)}
                  placeholder={
                    channel === 'email'
                      ? 'recipient@example.com'
                      : '+91 1234567890'
                  }
                  required
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate OTP'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateOtpModal;

