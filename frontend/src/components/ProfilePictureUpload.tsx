import React, { useState, useRef, memo, useEffect } from 'react';
import { User, Camera, Trash2, Upload, CheckCircle } from 'lucide-react';
import { R2_PUBLIC_URL } from '../config/api.config';

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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevPictureRef = useRef<string | null | undefined>(currentPicture);

  // Reset preview when currentPicture changes to a new image (after successful upload)
  // Only clear preview when we get a NEW picture (not when it becomes null during deletion)
  useEffect(() => {
    const prevPicture = prevPictureRef.current;

    // Only clear preview if currentPicture changed from null/undefined to a value
    // This means a new upload succeeded - we should show the server image
    if (!prevPicture && currentPicture) {
      setPreview(null);
    }

    // Reset error states when picture changes
    setImageError(false);
    setImageLoading(true);
    setRetryCount(0);

    prevPictureRef.current = currentPicture;
  }, [currentPicture]);

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    console.log('ProfilePictureUpload - getImageUrl called with:', path);
    
    // If it's a full URL, check if it's the old backend storage URL
    if (path.startsWith('http://') || path.startsWith('https://')) {
      // Extract the path from old backend storage URLs
      if (path.includes('/api/storage/')) {
        const pathPart = path.split('/api/storage/')[1];
        const constructedUrl = `${R2_PUBLIC_URL}/${pathPart}`;
        console.log('ProfilePictureUpload - Converted old backend URL to R2:', constructedUrl);
        return constructedUrl;
      }
      // If it's already an R2 URL or other valid URL, use it directly
      console.log('ProfilePictureUpload - Using full URL:', path);
      return path;
    }
    
    // Use R2 public URL directly for relative paths
    const constructedUrl = `${R2_PUBLIC_URL}/${path}`;
    console.log('ProfilePictureUpload - Constructed R2 URL:', constructedUrl);
    return constructedUrl;
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 3000);
  };

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      await onUpload(file);
      // Success message is handled by parent component
    } catch (error) {
      console.error('Upload failed:', error);
    }
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

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (onDelete) {
      try {
        setShowDeleteConfirm(false);
        await onDelete();
        setPreview(null);
        // Success message is handled by parent component
      } catch (error) {
        console.error('Delete failed:', error);
        setShowDeleteConfirm(false);
      }
    } else {
      setShowDeleteConfirm(false);
      setPreview(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const displayImage = preview || getImageUrl(currentPicture);

  // Handle image load error with retry
  const handleImageError = () => {
    console.error('Failed to load profile image:', displayImage);
    
    // Retry up to 2 times with a delay
    if (retryCount < 2) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageError(false);
      }, 1000 * (retryCount + 1)); // 1s, 2s delays
    } else {
      setImageError(true);
      setImageLoading(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Profile Picture Display - Circular with elegant styling */}
        <div className="relative group">
          <div
            className={`
              w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-gray-100 to-gray-50
              ${dragActive ? 'ring-4 ring-blue-400 ring-offset-2' : ''}
              transition-all duration-300
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {displayImage && !imageError ? (
              <>
                {imageLoading && (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-200 border-t-blue-600"></div>
                  </div>
                )}
                <img
                  key={`${displayImage}-${retryCount}`}
                  src={displayImage}
                  alt="Profile"
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    imageLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                  crossOrigin="anonymous"
                  loading="eager"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <User className="w-12 h-12 text-blue-400" />
              </div>
            )}
          </div>

          {/* Camera button - bottom right corner */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-1 right-1 w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-3 border-white"
            type="button"
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </button>

          {/* Delete button - only show when there's an image */}
          {displayImage && onDelete && !isUploading && (
            <button
              onClick={handleDeleteClick}
              className="absolute -top-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center text-red-500 shadow-md hover:shadow-lg hover:bg-red-50 hover:scale-110 transition-all border border-gray-100"
              type="button"
            >
              <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div key="delete-modal" className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && handleDeleteCancel()}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-slideUp">
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Delete Profile Photo?
              </h3>

              <p className="text-sm text-gray-500 mb-6">
                This action cannot be undone. Your profile will show a default avatar.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  type="button"
                  className="flex-1 px-4 py-2.5 text-sm border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  type="button"
                  className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 hover:shadow-lg transition-all font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div key="success-modal" className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-200 max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>

              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Success!
              </h3>

              <p className="text-sm text-gray-600 mb-5">
                {successMessage}
              </p>

              <button
                onClick={() => setShowSuccessModal(false)}
                type="button"
                className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default memo(ProfilePictureUpload);
