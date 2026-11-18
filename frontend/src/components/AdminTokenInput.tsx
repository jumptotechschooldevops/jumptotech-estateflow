import { useState, type FormEvent } from 'react';
import { getAdminToken, setAdminToken } from '../api';

export function AdminTokenInput() {
  const [token, setToken] = useState(getAdminToken());
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAdminToken(token.trim());
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} aria-label="admin token form">
      <label>
        Admin token (needed to create, edit, delete, or upload images)
        <input
          aria-label="admin token"
          type="password"
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            setSaved(false);
          }}
        />
      </label>
      <button type="submit">Save token</button>
      {saved && <span role="status"> Saved.</span>}
    </form>
  );
}
