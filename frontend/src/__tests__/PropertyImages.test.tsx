import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PropertyImages } from '../components/PropertyImages';
import * as api from '../api';

describe('PropertyImages', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders existing images', () => {
    render(
      <PropertyImages
        propertyId={1}
        images={[{ id: 1, url: 'https://example.com/a.jpg', contentType: 'image/jpeg', createdAt: new Date().toISOString() }]}
        onChange={() => {}}
      />
    );

    expect(screen.getByTestId('property-image-list')).toBeInTheDocument();
    expect(screen.getByAltText('Property')).toHaveAttribute('src', 'https://example.com/a.jpg');
  });

  it('uploads a selected file and notifies the parent', async () => {
    const onChange = vi.fn();
    const uploadSpy = vi.spyOn(api, 'uploadPropertyImage').mockResolvedValue({
      id: 2,
      url: 'https://example.com/b.jpg',
      contentType: 'image/jpeg',
      createdAt: new Date().toISOString(),
    });

    render(<PropertyImages propertyId={1} images={[]} onChange={onChange} />);

    const file = new File(['image-bytes'], 'house.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('upload image for property 1');
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(1, file);
      expect(onChange).toHaveBeenCalled();
    });
  });

  it('shows an error when the upload is rejected', async () => {
    vi.spyOn(api, 'uploadPropertyImage').mockRejectedValue(new Error('File exceeds the 5MB limit'));

    render(<PropertyImages propertyId={1} images={[]} onChange={() => {}} />);

    const file = new File(['image-bytes'], 'house.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('upload image for property 1');
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('File exceeds the 5MB limit');
    });
  });
});
