import React, { useState, useRef, useEffect } from 'react';
import chequeService, { Cheque } from '../../services/chequeService';
import SignaturePad from './SignaturePad';
import PhotoCapture from './PhotoCapture';

interface VerifyOtpModalProps {
  cheque: Cheque;
  onClose: () => void;
  onSuccess: () => void;
}

const VerifyOtpModal: React.FC<VerifyOtpModalProps> = ({
  cheque,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'otp' | 'recipient' | 'photo' | 'signature' | 'success'>('otp');
  const [otp, setOtp] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [idType, setIdType] = useState('Aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [locked, setLocked] = useState(false);

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      setError('');
      setStep('recipient');
    } else {
      setError('OTP must be 6 digits');
    }
  };

  const handleRecipientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !idType || !idNumber) {
      setError('All fields are required');
      return;
    }
    setError('');
    setStep('photo');
  };

  const handlePhotoCapture = (photoBlob: Blob, preview: string) => {
    setPhoto(photoBlob);
    setPhotoPreview(preview);
    setStep('signature');
  };

  const handleSignatureComplete = (signatureData: string) => {
    setSignature(signatureData);
    handleFinalSubmit(signatureData);
  };

  const handleFinalSubmit = async (signatureData: string) => {
    if (!photo || !signatureData) {
      setError('Photo and signature are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload photo
      const photoFile = new File([photo], `${cheque.chequeNo}_recipient.jpg`, {
        type: 'image/jpeg',
      });
      const photoUpload = await chequeService.uploadFile(photoFile);

      // Upload signature (convert base64 to blob)
      const signatureBlob = await fetch(signatureData).then((res) => res.blob());
      const signatureFile = new File(
        [signatureBlob],
        `${cheque.chequeNo}_signature.png`,
        { type: 'image/png' }
      );
      const signatureUpload = await chequeService.uploadFile(signatureFile);

      // Verify OTP and complete handover
      await chequeService.verifyOtp(cheque.id, {
        otp,
        recipientName,
        idType,
        idNumber,
        recipientPhotoPath: photoUpload.path,
        signaturePath: signatureUpload.path,
      });

      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error: any) {
      const errorData = error.response?.data;
      setError(errorData?.error || 'Failed to verify OTP');
      
      if (errorData?.remainingAttempts !== undefined) {
        setRemainingAttempts(errorData.remainingAttempts);
      }

      if (errorData?.locked) {
        setLocked(true);
      }

      // Go back to OTP step on failure
      setStep('otp');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOverride = async () => {
    try {
      await chequeService.requestOverride(
        cheque.id,
        'OTP locked due to failed attempts. Manual handover required.'
      );
      alert('Override request submitted successfully. Awaiting HOD approval.');
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to request override');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-600">
              Verify OTP & Complete Handover
            </h2>
            <p className="text-sm text-slate-400 mt-1">Cheque: {cheque.chequeNo}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-700">
          <div className="flex items-center justify-between">
            {['OTP', 'Recipient', 'Photo', 'Signature'].map((label, idx) => {
              const stepMap = { 'otp': 0, 'recipient': 1, 'photo': 2, 'signature': 3, 'success': 4 };
              const currentIdx = stepMap[step];
              const isActive = idx === currentIdx;
              const isCompleted = idx < currentIdx;

              return (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                        isCompleted
                          ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50'
                          : isActive
                          ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/50'
                          : 'bg-slate-700 text-slate-500 border-2 border-slate-600'
                      }`}
                    >
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <span className={`text-xs mt-1 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                      {label}
                    </span>
                  </div>
                  {idx < 3 && <div className="flex-1 h-0.5 bg-slate-700 mx-2 mt-4" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-400">{error}</p>
              {!locked && remainingAttempts > 0 && (
                <p className="text-xs text-red-300 mt-1">
                  Remaining attempts: {remainingAttempts}
                </p>
              )}
            </div>
          )}

          {locked && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-400 font-medium mb-2">
                ⚠️ OTP Locked
              </p>
              <p className="text-xs text-yellow-300 mb-3">
                Too many failed attempts. Please request a manual override.
              </p>
              <button
                onClick={handleRequestOverride}
                className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/50 rounded-lg text-sm font-medium transition-all"
              >
                Request Override
              </button>
            </div>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Enter 6-Digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={locked}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-2xl font-mono text-center text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent tracking-widest disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={otp.length !== 6 || locked}
                className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
              >
                Continue
              </button>
            </form>
          )}

          {step === 'recipient' && (
            <form onSubmit={handleRecipientSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Full name"
                  required
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  ID Type
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                >
                  <option>Aadhaar</option>
                  <option>PAN</option>
                  <option>Driving License</option>
                  <option>Passport</option>
                  <option>Voter ID</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  ID Number
                </label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="ID number"
                  required
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('otp')}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg font-medium transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 text-white rounded-lg font-medium transition-all"
                >
                  Continue
                </button>
              </div>
            </form>
          )}

          {step === 'photo' && (
            <PhotoCapture
              onCapture={handlePhotoCapture}
              onBack={() => setStep('recipient')}
            />
          )}

          {step === 'signature' && (
            <SignaturePad
              onComplete={handleSignatureComplete}
              onBack={() => setStep('photo')}
              loading={loading}
            />
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                Handover Completed!
              </h3>
              <p className="text-slate-400">
                Cheque {cheque.chequeNo} has been successfully handed over to {recipientName}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpModal;

