import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateFolder from '../components/CreateFolder';
import CreateNote from '../components/CreateNote';
import EditNote from '../components/EditNote';
import SearchNotes from '../components/SearchNotes';
import TagManager from '../components/TagManager';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check session and load initial data
  useEffect(() => {
    checkSession();
  }, []);

  // Load notes when folder selection changes (FIXED - removed user from dependencies)
  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [selectedFolder]); // Only re-run when folder changes

  const checkSession = async () => {
    try {
      const response = await fetch('/check_session');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        await loadFolders();
        await loadTags();
        await loadNotes();
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError('Failed to check session');
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const response = await fetch('/api/folders');
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders);
      }
    } catch (err) {
      setError('Failed to load folders');
    }
  };

  const loadTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags);
      }
    } catch (err) {
      setError('Failed to load tags');
    }
  };

  const loadNotes = async () => {
    try {
      let url = '/api/notes?limit=20';
      if (selectedFolder) {
        url += `&folder_id=${selectedFolder}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes);
      }
    } catch (err) {
      setError('Failed to load notes');
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/logout', { method: 'DELETE' });
      if (response.ok) {
        navigate('/login');
      }
    } catch (err) {
      setError('Failed to logout');
    }
  };

  const handleFolderClick = (folderId) => {
    setSelectedFolder(folderId === selectedFolder ? null : folderId);
  };

  const handleFolderCreated = (newFolder) => {
    setFolders(prev => [...prev, newFolder]);
  };

  const handleNoteCreated = (newNote) => {
    setNotes(prev => [newNote, ...prev]);
  };

  const handleNoteClick = (note) => {
    setEditingNote(note);
  };

  const handleNoteUpdated = (updatedNote, deletedNoteId) => {
    if (deletedNoteId) {
      // Note was deleted
      setNotes(prev => prev.filter(n => n.id !== deletedNoteId));
    } else if (updatedNote) {
      // Note was updated
      setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    }
    setEditingNote(null);
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
  };

  const handleSearchResults = (results, query) => {
    setNotes(results);
    setIsSearching(true);
    setSearchQuery(query);
    setSelectedFolder(null);
  };

  const handleClearSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
    loadNotes();
  };

  const handleTagsUpdated = (updatedTags) => {
    setTags(updatedTags);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Header */}
      <header>
        <h1>Notes</h1>
        {user && <p>Welcome, {user.username}!</p>}
        <button onClick={handleLogout}>Logout</button>
      </header>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Sidebar with Folders and Tags */}
        <aside style={{ width: '250px', borderRight: '1px solid #ddd', paddingRight: '20px' }}>
          <h2>Folders</h2>
          <CreateFolder onFolderCreated={handleFolderCreated} />
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>
              <button 
                onClick={() => handleFolderClick(null)}
                style={{
                  fontWeight: selectedFolder === null ? 'bold' : 'normal',
                  backgroundColor: selectedFolder === null ? '#e0e0e0' : 'transparent',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                All Notes
              </button>
            </li>
            {folders.map(folder => (
              <li key={folder.id}>
                <button 
                  onClick={() => handleFolderClick(folder.id)}
                  style={{
                    fontWeight: selectedFolder === folder.id ? 'bold' : 'normal',
                    backgroundColor: selectedFolder === folder.id ? '#e0e0e0' : 'transparent',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ 
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    backgroundColor: folder.color,
                    borderRadius: '50%',
                    marginRight: '8px'
                  }}></span>
                  {folder.name}
                </button>
              </li>
            ))}
          </ul>

          <hr style={{ margin: '20px 0' }} />

          {/* Tag Manager */}
          <TagManager onTagsUpdated={handleTagsUpdated} />
        </aside>

        {/* Main Content - Notes List or Edit Note */}
        <main style={{ flex: 1 }}>
          {editingNote ? (
            <EditNote 
              note={editingNote}
              folders={folders}
              tags={tags}
              onNoteUpdated={handleNoteUpdated}
              onCancel={handleCancelEdit}
            />
          ) : (
            <>
              <h2>
                {isSearching 
                  ? `Search Results for "${searchQuery}"` 
                  : selectedFolder 
                    ? folders.find(f => f.id === selectedFolder)?.name 
                    : 'All Notes'}
              </h2>
              
              <SearchNotes 
                folders={folders}
                onSearchResults={handleSearchResults}
                onClearSearch={handleClearSearch}
              />
              
              {!isSearching && (
                <CreateNote folders={folders} onNoteCreated={handleNoteCreated} />
              )}
              
              {notes.length === 0 ? (
                <p>{isSearching ? 'No notes found.' : 'No notes yet. Create your first note!'}</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {notes.map(note => (
                    <li 
                      key={note.id} 
                      onClick={() => handleNoteClick(note)}
                      style={{
                        padding: '15px',
                        margin: '10px 0',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <h3 style={{ margin: '0 0 10px 0' }}>{note.title}</h3>
                      <p style={{ margin: '0 0 10px 0', color: '#666' }}>
                        {note.content?.substring(0, 100)}{note.content?.length > 100 ? '...' : ''}
                      </p>
                      <small style={{ color: '#999' }}>
                        Updated: {new Date(note.updated_at).toLocaleDateString()}
                      </small>
                      {note.tags && note.tags.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                          {note.tags.map((tag, index) => (
                            <span 
                              key={index}
                              style={{ 
                                display: 'inline-block',
                                padding: '3px 8px',
                                margin: '0 5px 5px 0',
                                backgroundColor: '#e3f2fd',
                                borderRadius: '12px',
                                fontSize: '12px',
                                color: '#1976d2'
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;