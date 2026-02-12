
import { useState, useRef } from 'react';

interface ImageUploadProps {
    onUpload: (url: string) => void;
    className?: string;
    children?: React.ReactNode;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload, className, children }) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input
        e.target.value = '';

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

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
