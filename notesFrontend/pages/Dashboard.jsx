import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateFolder from '../components/CreateFolder';
import CreateNote from '../components/CreateNote';
import EditNote from '../components/EditNote';
import SearchNotes from '../components/SearchNotes';
import TagManager from '../components/TagManager';

function Dashboard() {
  // All our state variables
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

  // Check if user is logged in when page loads
  useEffect(() => {
    checkSession();
  }, []);

  // Load notes when folder changes
  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [selectedFolder]);

  // Check if user is logged in
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

  // Load all folders
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

  // Load all tags
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

  // Load notes (all or by folder)
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

  // Logout user
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

  // Select a folder
  const handleFolderClick = (folderId) => {
    setSelectedFolder(folderId === selectedFolder ? null : folderId);
    setIsSearching(false);
  };

  // When a new folder is created
  const handleFolderCreated = (newFolder) => {
    setFolders(prev => [...prev, newFolder]);
  };

  // When a new note is created
  const handleNoteCreated = (newNote) => {
    setNotes(prev => [newNote, ...prev]);
  };

  // When user clicks on a note to edit
  const handleNoteClick = (note) => {
    setEditingNote(note);
  };

  // When note is updated or deleted
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

  // Cancel editing note
  const handleCancelEdit = () => {
    setEditingNote(null);
  };

  // When search results come back
  const handleSearchResults = (results, query) => {
    setNotes(results);
    setIsSearching(true);
    setSearchQuery(query);
    setSelectedFolder(null);
  };

  // Clear search
  const handleClearSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
    loadNotes();
  };

  // When tags are updated
  const handleTagsUpdated = (updatedTags) => {
    setTags(updatedTags);
  };

  // Show loading message while checking session
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      
      {/* TOP HEADER BAR */}
      <header className="dashboard-header">
        <div>
          <h1>NoteTaker</h1>
          {user && <span className="user-info">Welcome, {user.username}!</span>}
        </div>
        <button onClick={handleLogout} className="btn-secondary">
          Logout
        </button>
      </header>

      {/* Error message if any */}
      {error && <div className="error-message" style={{margin: '20px'}}>{error}</div>}

      {/* MAIN CONTENT AREA */}
      <div className="dashboard-content">
        
        {/* LEFT SIDEBAR */}
        <aside className="sidebar">
          {/* FOLDERS SECTION */}
          <div className="sidebar-section">
            <h2 className="sidebar-title">Folders</h2>
            <CreateFolder onFolderCreated={handleFolderCreated} />
            
            {/* All Notes button */}
            <button
              onClick={() => handleFolderClick(null)}
              className={`folder-button all-notes ${selectedFolder === null ? 'active' : ''}`}
            >
              All Notes
            </button>

            {/* List of folders */}
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => handleFolderClick(folder.id)}
                className={`folder-button ${selectedFolder === folder.id ? 'active' : ''}`}
              >
                <span 
                  className="folder-color-dot"
                  style={{
                    backgroundColor: selectedFolder === folder.id ? 'white' : folder.color
                  }}
                ></span>
                {folder.name}
              </button>
            ))}
          </div>

          {/* Divider line */}
          <hr />

          {/* TAGS SECTION */}
          <TagManager onTagsUpdated={handleTagsUpdated} />
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="main-content">
          {/* If editing a note, show edit form */}
          {editingNote ? (
            <EditNote
              note={editingNote}
              folders={folders}
              tags={tags}
              onNoteUpdated={handleNoteUpdated}
              onCancel={handleCancelEdit}
            />
          ) : (
            // Otherwise show notes list
            <>
              {/* Page title */}
              <h2 className="page-title">
                {isSearching
                  ? `Search Results: "${searchQuery}"`
                  : selectedFolder
                    ? folders.find(f => f.id === selectedFolder)?.name
                    : 'All Notes'}
              </h2>

              {/* Search bar */}
              <SearchNotes
                folders={folders}
                onSearchResults={handleSearchResults}
                onClearSearch={handleClearSearch}
              />

              {/* Create note button (only when not searching) */}
              {!isSearching && (
                <CreateNote folders={folders} onNoteCreated={handleNoteCreated} />
              )}

              {/* Notes list or empty message */}
              {notes.length === 0 ? (
                <div className="empty-state">
                  <p>{isSearching ? 'No notes found' : 'No notes yet'}</p>
                  <p className="subtitle">
                    {isSearching ? 'Try a different search' : 'Create your first note!'}
                  </p>
                </div>
              ) : (
                <div className="notes-grid">
                  {notes.map(note => (
                    <div
                      key={note.id}
                      onClick={() => handleNoteClick(note)}
                      className="note-card"
                    >
                      <h3>{note.title}</h3>
                      <p>
                        {note.content?.substring(0, 100)}{note.content?.length > 100 ? '...' : ''}
                      </p>
                      <p className="note-date">
                        {new Date(note.updated_at).toLocaleDateString()}
                      </p>
                      {/* Show tags if note has any */}
                      {note.tags && note.tags.length > 0 && (
                        <div className="note-tags">
                          {note.tags.map((tag, index) => (
                            <span key={index} className="tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;