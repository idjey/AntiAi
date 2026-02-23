
import { useState, useRef } from 'react';

interface ImageUploadProps {
    onUpload: (url: string) => void;
    className?: string;
    children?: React.ReactNode;
    maxDimension?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload, className, children, maxDimension }) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input to allow selecting same file again
        e.target.value = '';

        handleFile(file);
    };

    const handleFile = async (file: File) => {
        // Validate types
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Validate size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        // Process and scale image using canvas
        const processImage = (file: File, limit: number): Promise<File> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                const objectUrl = URL.createObjectURL(file);

                img.onload = () => {
                    URL.revokeObjectURL(objectUrl);

                    let width = img.width;
                    let height = img.height;

                    // Only scale down if image is larger than limit
                    if (width > limit || height > limit) {
                        const ratio = Math.min(limit / width, limit / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    } else {
                        // Original is small enough, no resizing needed
                        resolve(file);
                        return;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(file); // Fallback to original if context fails
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert back to blob
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const newFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now()
                            });
                            resolve(newFile);
                        } else {
                            resolve(file); // Fallback
                        }
                    }, file.type, 0.9); // Quality = 0.9
                };

                img.onerror = () => {
                    URL.revokeObjectURL(objectUrl);
                    reject(new Error('Failed to load image for processing'));
                };

                img.src = objectUrl;
            });
        };

        setIsUploading(true);
        try {
            const processedFile = await processImage(file, maxDimension || 512);

            const formData = new FormData();
            formData.append('file', processedFile);

            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `Upload failed with status ${res.status}`);
            }

            const data = await res.json();
            onUpload(data.url);
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(`Failed to upload image: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={className} onClick={() => !isUploading && fileInputRef.current?.click()}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                onChange={handleFileChange}
            />
            {isUploading ? (
                <div className="animate-pulse flex items-center justify-center w-full h-full bg-black/20 rounded-lg">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            ) : (
                children
            )}
        </div>
    );
};
