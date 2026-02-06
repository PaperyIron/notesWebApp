import { useState } from 'react';

function CreateFolder({ onFolderCreated }) {
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    color: '#4A90E2' // Default blue color
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false); // Show/hide form

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  // Submit the form
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
        // Success! Reset form and close it
        setFormData({ name: '', color: '#4A90E2' });
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

  // If form is hidden, just show the button
  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="btn-primary btn-small btn-full-width"
      >
        + New Folder
      </button>
    );
  }

  // Show the form
  return (
    <div className="create-form-container">
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        {/* Folder name input */}
        <div className="form-group">
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

        {/* Color picker */}
        <div className="form-group">
          <label htmlFor="folder-color">Color</label>
          <input
            type="color"
            id="folder-color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            disabled={isLoading}
            style={{ height: '40px' }}
          />
        </div>

        {/* Buttons */}
        <div className="form-buttons">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary btn-small"
          >
            {isLoading ? 'Creating...' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setFormData({ name: '', color: '#4A90E2' });
              setError('');
            }}
            disabled={isLoading}
            className="btn-secondary btn-small"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateFolder;