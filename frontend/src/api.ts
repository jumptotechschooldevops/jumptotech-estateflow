export interface PropertyImage {
  id: number;
  url: string;
  contentType: string;
  createdAt: string;
}

export interface Property {
  id: number;
  title: string;
  description: string | null;
  price: number;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  created_at: string;
  images?: PropertyImage[];
}

export type NewProperty = Omit<Property, 'id' | 'created_at' | 'images'>;

const API_BASE = '/api/properties';
const ADMIN_TOKEN_STORAGE_KEY = 'estateflow_admin_token';

export function getAdminToken(): string {
  return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ?? '';
}

export function setAdminToken(token: string): void {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  }
}

function authHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchProperties(): Promise<Property[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error(`Failed to fetch properties: ${res.status}`);
  return res.json();
}

export async function createProperty(property: NewProperty): Promise<Property> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(property),
  });
  if (!res.ok) throw new Error(`Failed to create property: ${res.status}`);
  return res.json();
}

export async function deleteProperty(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to delete property: ${res.status}`);
}

export async function uploadPropertyImage(propertyId: number, file: File): Promise<PropertyImage> {
  const body = new FormData();
  body.append('image', file);
  const res = await fetch(`${API_BASE}/${propertyId}/images`, {
    method: 'POST',
    headers: authHeaders(),
    body,
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || `Failed to upload image: ${res.status}`);
  }
  return res.json();
}

export async function deletePropertyImage(propertyId: number, imageId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/${propertyId}/images/${imageId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete image: ${res.status}`);
}
