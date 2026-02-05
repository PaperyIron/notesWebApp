import { useState } from 'react';

function SearchNotes({ folders, onSearchResults, onClearSearch }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
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

  const handleClear = () => {
    setSearchQuery('');
    setSelectedFolder('');
    onClearSearch();
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        {error && <div>{error}</div>}
        
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            disabled={isLoading}
          />
        </div>

        <div>
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            disabled={isLoading}
          >
            <option value="">All Folders</option>
            {folders.map(folder => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button type="submit" disabled={isLoading || !searchQuery.trim()}>
            {isLoading ? 'Searching...' : 'Search'}
          </button>
          {searchQuery && (
            <button type="button" onClick={handleClear} disabled={isLoading}>
              Clear
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default SearchNotes;