import React, { useState, useRef, useEffect } from 'react';

interface PhotoCaptureProps {
  onCapture: (photo: Blob, preview: string) => void;
  onBack: () => void;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onCapture, onBack }) => {
  const [mode, setMode] = useState<'select' | 'camera' | 'upload'>('select');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      // Cleanup: stop camera stream when unmounting
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setMode('camera');
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please use file upload instead.');
      setMode('upload');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const preview = canvas.toDataURL('image/jpeg');
            setPhoto(preview);

            // Stop camera stream
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
            }
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (photo) {
      fetch(photo)
        .then(res => res.blob())
        .then(blob => {
          onCapture(blob, photo);
        });
    }
  };

  const handleRetake = () => {
    setPhoto(null);
    if (mode === 'camera') {
      startCamera();
    }
  };

  return (
    <div className="space-y-4">
      {mode === 'select' && (
        <div className="space-y-4">
          <p className="text-slate-300 text-center mb-4">
            Choose how to capture recipient's photo
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={startCamera}
              className="p-6 bg-slate-900/50 hover:bg-slate-900/70 border border-slate-600 hover:border-cyan-500/50 rounded-lg transition-all group"
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-cyan-500/30 transition-all">
                  <svg
                    className="w-6 h-6 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <span className="font-medium text-slate-100">Use Camera</span>
                <span className="text-xs text-slate-400 mt-1">Take photo now</span>
              </div>
            </button>

            <button
              onClick={() => setMode('upload')}
              className="p-6 bg-slate-900/50 hover:bg-slate-900/70 border border-slate-600 hover:border-violet-500/50 rounded-lg transition-all group"
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-violet-500/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-violet-500/30 transition-all">
                  <svg
                    className="w-6 h-6 text-violet-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <span className="font-medium text-slate-100">Upload File</span>
                <span className="text-xs text-slate-400 mt-1">Choose from device</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {mode === 'camera' && !photo && (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (stream) {
                  stream.getTracks().forEach(track => track.stop());
                }
                setMode('select');
              }}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg font-medium transition-all"
            >
              Back
            </button>
            <button
              onClick={capturePhoto}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 text-white rounded-lg font-medium transition-all"
            >
              📷 Capture Photo
            </button>
          </div>
        </div>
      )}

      {mode === 'upload' && !photo && (
        <div className="space-y-4">
          <label className="block">
            <div className="border-2 border-dashed border-slate-600 hover:border-violet-500/50 rounded-lg p-8 text-center cursor-pointer transition-all">
              <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-violet-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="text-slate-300 font-medium mb-1">Click to upload photo</p>
              <p className="text-xs text-slate-400">PNG, JPG up to 5MB</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={() => setMode('select')}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg font-medium transition-all"
          >
            Back
          </button>
        </div>
      )}

      {photo && (
        <div className="space-y-4">
          <div className="relative bg-slate-900/50 rounded-lg overflow-hidden">
            <img src={photo} alt="Captured" className="w-full" />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg font-medium transition-all"
            >
              Retake
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 text-white rounded-lg font-medium transition-all"
            >
              Confirm & Continue
            </button>
          </div>
        </div>
      )}

      {mode === 'select' && (
        <button
          onClick={onBack}
          className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg font-medium transition-all"
        >
          Back
        </button>
      )}
    </div>
  );
};

export default PhotoCapture;

