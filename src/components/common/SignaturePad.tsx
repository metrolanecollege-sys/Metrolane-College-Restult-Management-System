import React, { useRef, useState } from 'react';
import { Pen, Upload, RotateCcw, Check } from 'lucide-react';

interface SignaturePadProps {
  initialSignature?: string;
  onSave: (dataUrl: string) => void;
  title: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  initialSignature,
  onSave,
  title,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const [previewUrl, setPreviewUrl] = useState<string>(initialSignature || '');
  const [hasDrawn, setHasDrawn] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1A1A2E';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setPreviewUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
    setPreviewUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setPreviewUrl(result);
        setHasDrawn(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmSave = () => {
    if (previewUrl) {
      onSave(previewUrl);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-bold text-gray-800 text-sm md:text-base">{title}</h4>
          <p className="text-xs text-gray-500">Sign digital document authorization</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              mode === 'draw' ? 'bg-white shadow text-[#F47B20]' : 'text-gray-600'
            }`}
          >
            <Pen className="w-3.5 h-3.5 inline mr-1" />
            Draw
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              mode === 'upload' ? 'bg-white shadow text-[#F47B20]' : 'text-gray-600'
            }`}
          >
            <Upload className="w-3.5 h-3.5 inline mr-1" />
            Upload Image
          </button>
        </div>
      </div>

      {mode === 'draw' ? (
        <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            width={400}
            height={120}
            className="w-full h-[120px] touch-none cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasDrawn && !previewUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-gray-400">
              Sign here using mouse or finger...
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <label className="cursor-pointer text-xs font-semibold text-[#F47B20] hover:underline">
            Choose PNG/JPEG file (max 500KB)
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      )}

      {/* Preview if exists */}
      {previewUrl && (
        <div className="mt-3 p-2 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">Signature Preview:</span>
            <img src={previewUrl} alt="Signature Preview" className="h-9 max-w-[150px] object-contain" />
          </div>
          <button
            type="button"
            onClick={clearCanvas}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={clearCanvas}
          className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleConfirmSave}
          disabled={!previewUrl}
          className="px-4 py-1.5 text-xs font-semibold bg-[#F47B20] hover:bg-[#E8601C] text-white rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          Save Signature
        </button>
      </div>
    </div>
  );
};
