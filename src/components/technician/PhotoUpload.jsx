import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PhotoUpload({ photos, onPhotosChange, isOnline }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const uploadedUrls = [];

      for (const file of files) {
        if (!isOnline) {
          // Store locally when offline
          const reader = new FileReader();
          reader.onload = (event) => {
            const localUrl = event.target.result;
            uploadedUrls.push(localUrl);
            
            if (uploadedUrls.length === files.length) {
              onPhotosChange([...photos, ...uploadedUrls]);
              toast.info('Photos saved locally - will upload when online');
            }
          };
          reader.readAsDataURL(file);
        } else {
          // Upload to server when online
          const result = await base44.integrations.Core.UploadFile({ file });
          uploadedUrls.push(result.file_url);

          if (uploadedUrls.length === files.length) {
            onPhotosChange([...photos, ...uploadedUrls]);
            toast.success(`${files.length} photo(s) uploaded successfully`);
          }
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Take Photos
            </>
          )}
        </Button>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          variant="outline"
          className="border-slate-700"
        >
          <Upload className="w-4 h-4" />
        </Button>
      </div>

      {!isOnline && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-400 text-sm">
          Offline mode: Photos will be uploaded when connection is restored
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`Job photo ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-slate-700"
              />
              <button
                onClick={() => handleRemovePhoto(index)}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="text-center py-12 text-slate-500 border border-dashed border-slate-700 rounded-lg">
          <Camera className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p>No photos added yet</p>
          <p className="text-sm mt-1">Take photos of the installation, equipment, and completed work</p>
        </div>
      )}
    </div>
  );
}