import { useState } from 'react';

function CreateFolder({ onFolderCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    color: '#6B7280'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setFormData({ name: '', color: '#6B7280' });
        setShowForm(false);
        if (onFolderCreated) {
          onFolderCreated(data);
        }
      } else {
        setError(data.error || 'Failed to create folder');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button onClick={() => setShowForm(true)}>
        + New Folder
      </button>
    );
  }

  return (
    <div>
      <h3>Create New Folder</h3>
      <form onSubmit={handleSubmit}>
        {error && <div>{error}</div>}

        <div>
          <label htmlFor="folder-name">Folder Name</label>
          <input
            type="text"
            id="folder-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter folder name"
            required
            maxLength={25}
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="folder-color">Color</label>
          <input
            type="color"
            id="folder-color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Folder'}
          </button>
          <button type="button" onClick={() => setShowForm(false)} disabled={isLoading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateFolder;