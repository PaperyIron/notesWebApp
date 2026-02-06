import { useState, useEffect } from 'react';

function TagManager({ onTagsUpdated }) {
  // State for tags
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false); // Show/hide form

  // Load tags when component loads
  useEffect(() => {
    loadTags();
  }, []);

  // Load all tags from API
  const loadTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags);
        if (onTagsUpdated) {
          onTagsUpdated(data.tags);
        }
      }
    } catch (err) {
      setError('Failed to load tags');
    }
  };

  // Create a new tag
  const handleCreateTag = async (e) => {
    e.preventDefault();
    setError('');
    
    // Make sure tag name is not empty
    if (!newTagName.trim()) {
      setError('Tag name is required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newTagName.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success! Add to list and reset form
        const updatedTags = [...tags, data];
        setTags(updatedTags);
        setNewTagName('');
        setShowForm(false);
        if (onTagsUpdated) {
          onTagsUpdated(updatedTags);
        }
      } else {
        setError(data.error || 'Failed to create tag');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a tag
  const handleDeleteTag = async (tagId) => {
    if (!window.confirm('Delete this tag? It will be removed from all notes.')) {
      return;
    }

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove from list
        const updatedTags = tags.filter(t => t.id !== tagId);
        setTags(updatedTags);
        if (onTagsUpdated) {
          onTagsUpdated(updatedTags);
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete tag');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  return (
    <div>
      <h2 className="sidebar-title">Tags</h2>
      
      {/* Show error if any */}
      {error && (
        <div className="error-message" style={{fontSize: '12px', padding: '8px'}}>
          {error}
        </div>
      )}

      {/* Show button or form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary btn-small btn-full-width mb-10"
        >
          + New Tag
        </button>
      ) : (
        <form
          onSubmit={handleCreateTag}
          className="create-form-container"
        >
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Tag name"
            maxLength={50}
            disabled={isLoading}
            style={{marginBottom: '8px', padding: '8px', fontSize: '13px'}}
          />
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
                setNewTagName('');
                setError('');
              }}
              disabled={isLoading}
              className="btn-secondary btn-small"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Show tags list or empty message */}
      {tags.length === 0 ? (
        <p className="tag-list-empty">No tags yet</p>
      ) : (
        <div>
          {tags.map(tag => (
            <div key={tag.id} className="tag-item">
              <span>• {tag.name}</span>
              <button
                onClick={() => handleDeleteTag(tag.id)}
                className="tag-delete-btn"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TagManager;