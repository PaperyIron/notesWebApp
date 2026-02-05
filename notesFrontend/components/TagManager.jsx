import { useState, useEffect } from 'react';

function TagManager({ onTagsUpdated }) {
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

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

  const handleCreateTag = async (e) => {
    e.preventDefault();
    setError('');
    
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
        setTags(prev => [...prev, data]);
        setNewTagName('');
        setShowForm(false);
        if (onTagsUpdated) {
          onTagsUpdated([...tags, data]);
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

  const handleDeleteTag = async (tagId) => {
    if (!window.confirm('Delete this tag? It will be removed from all notes.')) {
      return;
    }

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
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
      <h3>Tags</h3>
      
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {!showForm ? (
        <button onClick={() => setShowForm(true)}>
          + New Tag
        </button>
      ) : (
        <form onSubmit={handleCreateTag}>
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Tag name"
            maxLength={50}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
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
          >
            Cancel
          </button>
        </form>
      )}

      {tags.length === 0 ? (
        <p>No tags yet. Create your first tag!</p>
      ) : (
        <ul>
          {tags.map(tag => (
            <li key={tag.id}>
              <span>{tag.name}</span>
              <button 
                onClick={() => handleDeleteTag(tag.id)}
                style={{ marginLeft: '10px' }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TagManager;