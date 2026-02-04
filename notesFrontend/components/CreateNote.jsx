import { useState } from 'react';

function CreateNote({ folders, onNoteCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    folder_id: ''
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

    if (!formData.folder_id) {
      setError('Please select a folder');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          folder_id: parseInt(formData.folder_id)
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFormData({ title: '', content: '', folder_id: '' });
        setShowForm(false);
        if (onNoteCreated) {
          onNoteCreated(data);
        }
      } else {
        setError(data.error || 'Failed to create note');
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
        + New Note
      </button>
    );
  }

  return (
    <div>
      <h3>Create New Note</h3>
      <form onSubmit={handleSubmit}>
        {error && <div>{error}</div>}

        <div>
          <label htmlFor="note-title">Title</label>
          <input
            type="text"
            id="note-title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter note title"
            required
            maxLength={100}
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="note-folder">Folder</label>
          <select
            id="note-folder"
            name="folder_id"
            value={formData.folder_id}
            onChange={handleChange}
            disabled={isLoading}
          >
            <option value="">Select a folder</option>
            {folders.map(folder => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="note-content">Content</label>
          <textarea
            id="note-content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Write your note here..."
            rows={10}
            disabled={isLoading}
          />
        </div>

        <div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Note'}
          </button>
          <button type="button" onClick={() => setShowForm(false)} disabled={isLoading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateNote;