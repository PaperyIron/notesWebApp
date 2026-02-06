import { useState, useEffect } from 'react';

function EditNote({ note, folders, tags, onNoteUpdated, onCancel }) {
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    folder_id: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState('');
  const [tagError, setTagError] = useState('');

  // Load note data when component loads
  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        content: note.content || '',
        folder_id: note.folder_id
      });
    }
  }, [note]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  // Save changes to the note
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

  // Delete the note
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (onNoteUpdated) {
          onNoteUpdated(null, note.id);
        }
      } else {
        try {
          const data = await response.json();
          setError(data.error || 'Failed to delete note');
        } catch {
          setError('Failed to delete note');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a tag to the note
  const handleAddTag = async () => {
    if (!selectedTagId) {
      setTagError('Please select a tag');
      return;
    }

    setTagError('');

    try {
      const response = await fetch(`/api/notes/${note.id}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tag_id: parseInt(selectedTagId) }),
      });

      const data = await response.json();

      if (response.ok) {
        // Reload the note to get updated tags
        const noteResponse = await fetch(`/api/notes/${note.id}`);
        if (noteResponse.ok) {
          const updatedNote = await noteResponse.json();
          if (onNoteUpdated) {
            onNoteUpdated(updatedNote);
          }
        }
        setSelectedTagId('');
      } else {
        setTagError(data.error || 'Failed to add tag');
      }
    } catch (err) {
      setTagError('Network error. Please try again.');
    }
  };

  // Remove a tag from the note
  const handleRemoveTag = async (tagName) => {
    // Find the tag by name
    const tag = tags.find(t => t.name === tagName);
    if (!tag) return;

    setTagError('');

    try {
      const response = await fetch(`/api/notes/${note.id}/tags/${tag.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Reload the note to get updated tags
        const noteResponse = await fetch(`/api/notes/${note.id}`);
        if (noteResponse.ok) {
          const updatedNote = await noteResponse.json();
          if (onNoteUpdated) {
            onNoteUpdated(updatedNote);
          }
        }
      } else {
        const data = await response.json();
        setTagError(data.error || 'Failed to remove tag');
      }
    } catch (err) {
      setTagError('Network error. Please try again.');
    }
  };

  // Get tags that aren't already on this note
  const availableTags = tags.filter(tag => !note.tags.includes(tag.name));

  return (
    <div className="card">
      <div className="edit-note-header">
        <h3>Edit Note</h3>
      </div>
      
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        {/* Title input */}
        <div className="form-group">
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

        {/* Folder dropdown */}
        <div className="form-group">
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

        {/* Content textarea */}
        <div className="form-group">
          <label htmlFor="edit-note-content">Content</label>
          <textarea
            id="edit-note-content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Write your note here..."
            rows={12}
            disabled={isLoading}
          />
        </div>

        {/* TAG MANAGEMENT SECTION */}
        <div className="tag-management">
          <h4>🏷️ Tags</h4>
          {tagError && <div className="error-message">{tagError}</div>}

          {/* Show current tags */}
          <div className="tag-section">
            <strong>Current Tags:</strong>
            {note.tags && note.tags.length > 0 ? (
              <div className="tag-list">
                {note.tags.map((tagName, index) => (
                  <span key={index} className="tag">
                    {tagName}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tagName)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="tag-info-text">No tags yet</p>
            )}
          </div>

          {/* Add new tag */}
          {availableTags.length > 0 && (
            <div className="tag-section">
              <strong>Add Tag:</strong>
              <div className="tag-add-form">
                <select
                  value={selectedTagId}
                  onChange={(e) => setSelectedTagId(e.target.value)}
                >
                  <option value="">Select a tag</option>
                  {availableTags.map(tag => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!selectedTagId}
                  className="btn-primary btn-small"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Messages when no tags available */}
          {availableTags.length === 0 && tags.length > 0 && (
            <p className="tag-info-text">
              All tags are already on this note
            </p>
          )}
          {tags.length === 0 && (
            <p className="tag-info-text">
              Create tags in the sidebar first
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-10">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{flex: 2}}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn-secondary"
            style={{flex: 1}}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="btn-danger"
            style={{flex: 1}}
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditNote;