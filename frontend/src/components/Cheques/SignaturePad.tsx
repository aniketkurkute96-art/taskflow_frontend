import React, { useRef, useEffect, useState } from 'react';

interface SignaturePadProps {
  onComplete: (signature: string) => void;
  onBack: () => void;
  loading?: boolean;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onComplete, onBack, loading = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    context.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Set drawing styles
    context.strokeStyle = '#60a5fa'; // cyan-400
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    // Fill with white background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    setIsEmpty(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const point = getPoint(e);
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const point = getPoint(e);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onComplete(dataUrl);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Recipient's Signature
        </label>
        <p className="text-xs text-slate-400 mb-3">
          Please sign in the box below using your mouse or touchscreen
        </p>

        <div className="relative">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-48 bg-white border-2 border-slate-600 rounded-lg cursor-crosshair touch-none"
            style={{ touchAction: 'none' }}
          />

          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-slate-400 text-sm">Sign here</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={loading}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg font-medium transition-all disabled:opacity-50"
        >
          Back
        </button>
        
        <button
          onClick={clearSignature}
          disabled={isEmpty || loading}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg font-medium transition-all disabled:opacity-50"
        >
          Clear
        </button>

        <button
          onClick={handleConfirm}
          disabled={isEmpty || loading}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            'Complete Handover'
          )}
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;

