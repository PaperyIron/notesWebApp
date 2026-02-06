import { useState } from 'react';

function SearchNotes({ folders, onSearchResults, onClearSearch }) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Perform search
  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Build the search URL
      let url = `/api/notes/search?q=${encodeURIComponent(searchQuery)}`;
      if (selectedFolder) {
        url += `&folder_id=${selectedFolder}`;
      }

      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        onSearchResults(data.notes, searchQuery);
      } else {
        setError('Search failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear search and show all notes
  const handleClear = () => {
    setSearchQuery('');
    setSelectedFolder('');
    onClearSearch();
  };

  return (
    <div className="card">
      <form onSubmit={handleSearch} className="search-form">
        {error && <div className="error-message">{error}</div>}
        
        {/* Search input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
          disabled={isLoading}
          className="search-input"
        />

        {/* Folder filter */}
        <select
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          disabled={isLoading}
          className="search-folder-select"
        >
          <option value="">All Folders</option>
          {folders.map(folder => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>

        {/* Search button */}
        <button
          type="submit"
          disabled={isLoading || !searchQuery.trim()}
          className="btn-primary"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>

        {/* Clear button (only show if there's a search) */}
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading}
            className="btn-secondary"
          >
            Clear
          </button>
        )}
      </form>
    </div>
  );
}

export default SearchNotes;