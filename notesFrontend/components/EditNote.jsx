import { useState, useEffect } from 'react';

function EditNote({ note, folders, onNoteUpdated, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    folder_id: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        content: note.content || '',
        folder_id: note.folder_id
      });
    }
  }, [note]);

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
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
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
        if (onNoteUpdated) {
          onNoteUpdated(data);
        }
      } else {
        setError(data.error || 'Failed to update note');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (onNoteUpdated) {
          onNoteUpdated(null, note.id); // Pass null and the deleted note id
        }
      } else {
        setError('Failed to delete note');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3>Edit Note</h3>
      <form onSubmit={handleSubmit}>
        {error && <div>{error}</div>}

        <div>
          <label htmlFor="edit-note-title">Title</label>
          <input
            type="text"
            id="edit-note-title"
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
          <label htmlFor="edit-note-folder">Folder</label>
          <select
            id="edit-note-folder"
            name="folder_id"
            value={formData.folder_id}
            onChange={handleChange}
            required
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
          <label htmlFor="edit-note-content">Content</label>
          <textarea
            id="edit-note-content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Write your note here..."
            rows={15}
            disabled={isLoading}
          />
        </div>

        <div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={onCancel} disabled={isLoading}>
            Cancel
          </button>
          <button type="button" onClick={handleDelete} disabled={isLoading}>
            Delete Note
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditNote;