import type { Property } from '../api';
import { PropertyImages } from './PropertyImages';

interface PropertyListProps {
  properties: Property[];
  onDelete: (id: number) => void;
  onImagesChanged: () => void;
}

export function PropertyList({ properties, onDelete, onImagesChanged }: PropertyListProps) {
  if (properties.length === 0) {
    return <p data-testid="empty-state">No properties yet.</p>;
  }

  return (
    <ul data-testid="property-list">
      {properties.map((property) => (
        <li key={property.id} data-testid="property-item">
          <strong>{property.title}</strong> — ${property.price.toLocaleString()}
          {property.address ? ` — ${property.address}` : ''}
          <button type="button" onClick={() => onDelete(property.id)}>
            Delete
          </button>
          <PropertyImages
            propertyId={property.id}
            images={property.images ?? []}
            onChange={onImagesChanged}
          />
        </li>
      ))}
    </ul>
  );
}
