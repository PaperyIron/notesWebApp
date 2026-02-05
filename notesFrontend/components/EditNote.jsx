import { useState, useEffect } from 'react';

function EditNote({ note, folders, tags, onNoteUpdated, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    folder_id: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState('');
  const [tagError, setTagError] = useState('');

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
        // Refresh the note to get updated tags
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

  const handleRemoveTag = async (tagName) => {
    // Find the tag ID from the tag name
    const tag = tags.find(t => t.name === tagName);
    if (!tag) return;

    setTagError('');

    try {
      const response = await fetch(`/api/notes/${note.id}/tags/${tag.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Refresh the note to get updated tags
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

  // Get available tags (not already on this note)
  const availableTags = tags.filter(tag => !note.tags.includes(tag.name));

  return (
    <div>
      <h3>Edit Note</h3>
      <form onSubmit={handleSubmit}>
        {error && <div style={{ color: 'red' }}>{error}</div>}

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

        {/* Tag Management Section */}
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h4>Tags</h4>
          {tagError && <div style={{ color: 'red', marginBottom: '10px' }}>{tagError}</div>}
          
          {/* Current Tags */}
          <div>
            <strong>Current Tags:</strong>
            {note.tags && note.tags.length > 0 ? (
              <div style={{ marginTop: '5px' }}>
                {note.tags.map((tagName, index) => (
                  <span 
                    key={index}
                    style={{ 
                      display: 'inline-block',
                      padding: '5px 10px',
                      margin: '5px 5px 5px 0',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '15px',
                      fontSize: '14px'
                    }}
                  >
                    {tagName}
                    <button 
                      type="button"
                      onClick={() => handleRemoveTag(tagName)}
                      style={{ 
                        marginLeft: '8px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ marginTop: '5px', fontStyle: 'italic' }}>No tags yet</p>
            )}
          </div>

          {/* Add Tag */}
          {availableTags.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <strong>Add Tag:</strong>
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <select
                  value={selectedTagId}
                  onChange={(e) => setSelectedTagId(e.target.value)}
                  style={{ flex: 1 }}
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
                >
                  Add
                </button>
              </div>
            </div>
          )}
          
          {availableTags.length === 0 && tags.length > 0 && (
            <p style={{ marginTop: '10px', fontStyle: 'italic', fontSize: '14px' }}>
              All available tags are already on this note
            </p>
          )}

          {tags.length === 0 && (
            <p style={{ marginTop: '10px', fontStyle: 'italic', fontSize: '14px' }}>
              Create tags in the sidebar to organize your notes
            </p>
          )}
        </div>

        <div style={{ marginTop: '20px' }}>
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