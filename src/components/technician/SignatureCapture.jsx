import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Check } from 'lucide-react';

export default function SignatureCapture({ signature, onSignatureChange }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!signature);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load existing signature
    if (signature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = signature;
    }
  }, [signature]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    setIsDrawing(true);
    ctx.beginPath();
    
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange('');
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onSignatureChange(dataUrl);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-slate-400 mb-2 block">Customer Signature</label>
        <p className="text-xs text-slate-500 mb-3">
          Ask the customer to sign below to confirm job completion
        </p>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={300}
          className="w-full h-[300px] border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/50 cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-600">Sign here</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={clearSignature}
          variant="outline"
          className="flex-1 border-slate-700"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Clear
        </Button>
        
        <Button
          onClick={saveSignature}
          disabled={!hasSignature}
          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        >
          <Check className="w-4 h-4 mr-2" />
          Save Signature
        </Button>
      </div>

      {hasSignature && signature && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          Signature captured
        </div>
      )}
    </div>
  );
}