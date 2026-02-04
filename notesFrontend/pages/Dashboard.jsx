import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateFolder from '../components/CreateFolder';
import CreateNote from '../components/CreateNote';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check session and load initial data
  useEffect(() => {
    checkSession();
  }, []);

  // Load notes when folder selection changes
  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [selectedFolder, user]);

  const checkSession = async () => {
    try {
      const response = await fetch('/check_session');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        await loadFolders();
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

      {error && <div>{error}</div>}

      <div>
        {/* Sidebar with Folders */}
        <aside>
          <h2>Folders</h2>
          <CreateFolder onFolderCreated={handleFolderCreated} />
          <ul>
            <li>
              <button onClick={() => handleFolderClick(null)}>
                All Notes
              </button>
            </li>
            {folders.map(folder => (
              <li key={folder.id}>
                <button onClick={() => handleFolderClick(folder.id)}>
                  {folder.name} ({folder.color})
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content - Notes List */}
        <main>
          <h2>
            {selectedFolder 
              ? folders.find(f => f.id === selectedFolder)?.name 
              : 'All Notes'}
          </h2>
          
          <CreateNote folders={folders} onNoteCreated={handleNoteCreated} />
          
          {notes.length === 0 ? (
            <p>No notes yet. Create your first note!</p>
          ) : (
            <ul>
              {notes.map(note => (
                <li key={note.id}>
                  <h3>{note.title}</h3>
                  <p>{note.content?.substring(0, 100)}...</p>
                  <small>
                    Updated: {new Date(note.updated_at).toLocaleDateString()}
                  </small>
                  {note.tags && note.tags.length > 0 && (
                    <div>
                      Tags: {note.tags.join(', ')}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;