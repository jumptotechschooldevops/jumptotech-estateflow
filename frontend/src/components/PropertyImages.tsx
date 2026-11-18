import { useState, type ChangeEvent } from 'react';
import type { PropertyImage } from '../api';
import { uploadPropertyImage, deletePropertyImage } from '../api';

interface PropertyImagesProps {
  propertyId: number;
  images: PropertyImage[];
  onChange: () => void;
}

export function PropertyImages({ propertyId, images, onChange }: PropertyImagesProps) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      await uploadPropertyImage(propertyId, file);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(imageId: number) {
    setError(null);
    try {
      await deletePropertyImage(propertyId, imageId);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  return (
    <div data-testid={`property-images-${propertyId}`}>
      {images.length > 0 && (
        <ul data-testid="property-image-list">
          {images.map((image) => (
            <li key={image.id}>
              <img src={image.url} alt="Property" width={80} height={80} />
              <button type="button" onClick={() => handleDelete(image.id)}>
                Remove image
              </button>
            </li>
          ))}
        </ul>
      )}
      <label>
        {uploading ? 'Uploading…' : 'Add image'}
        <input
          aria-label={`upload image for property ${propertyId}`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelected}
          disabled={uploading}
        />
      </label>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
