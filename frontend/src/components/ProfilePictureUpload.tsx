import React, { useState, useRef } from 'react';
import { User, Camera, Trash2, Upload } from 'lucide-react';

interface ProfilePictureUploadProps {
  currentPicture?: string | null;
  onUpload: (file: File) => Promise<void>;
  onDelete?: () => Promise<void>;
  isUploading?: boolean;
  className?: string;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentPicture,
  onUpload,
  onDelete,
  isUploading = false,
  className = '',
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8000/storage/${path}`;
  };

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    await onUpload(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete your profile picture?')) {
      setPreview(null);
      if (onDelete) {
        await onDelete();
      }
    }
  };

  const displayImage = preview || getImageUrl(currentPicture);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Profile Picture Display */}
      <div className="relative group">
        <div
          className={`
            w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg
            ${dragActive ? 'ring-4 ring-blue-400' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {displayImage ? (
            <img
              src={displayImage}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <User className="w-16 h-16 text-white" />
            </div>
          )}
        </div>

        {/* Overlay on hover */}
        <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-white hover:text-blue-300 transition-colors"
            type="button"
          >
            <Camera className="w-8 h-8" />
          </button>
        </div>

        {/* Loading spinner */}
        {isUploading && (
          <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Upload/Delete Buttons */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          <Upload className="w-4 h-4" />
          {displayImage ? 'Change Photo' : 'Upload Photo'}
        </button>

        {displayImage && onDelete && (
          <button
            onClick={handleDelete}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Help text */}
      <p className="mt-2 text-xs text-gray-500 text-center">
        JPEG, PNG or GIF (Max 2MB)
        <br />
        Drag and drop or click to upload
      </p>
    </div>
  );
};

export default ProfilePictureUpload;
