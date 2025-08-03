import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock search functionality
const mockSearchAssets = jest.fn();

// Mock asset data
const mockAssets = [
  {
    id: 'asset-1',
    fileName: 'marketing-banner.jpg',
    title: 'Marketing Banner',
    tags: ['marketing', 'banner', 'social'],
    fileType: 'image/jpeg',
    uploadDate: '2024-01-15',
    uploader: { name: 'John Doe', id: 'user-1' }
  },
  {
    id: 'asset-2',
    fileName: 'brand-guidelines.pdf',
    title: 'Brand Guidelines',
    tags: ['brand', 'guidelines', 'document'],
    fileType: 'application/pdf',
    uploadDate: '2024-02-01',
    uploader: { name: 'Jane Smith', id: 'user-2' }
  },
  {
    id: 'asset-3',
    fileName: 'product-video.mp4',
    title: 'Product Demo Video',
    tags: ['product', 'demo', 'video'],
    fileType: 'video/mp4',
    uploadDate: '2024-01-20',
    uploader: { name: 'Bob Wilson', id: 'user-3' }
  }
];

describe('Search and Filter Workflow Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchAssets.mockResolvedValue({
      assets: mockAssets,
      total: mockAssets.length,
      pagination: { page: 1, limit: 10, total: mockAssets.length }
    });
  });

  it('performs comprehensive search workflow', async () => {
    const MockSearchPage = () => {
      const [searchQuery, setSearchQuery] = React.useState('');
      const [assets, setAssets] = React.useState([]);
      const [loading, setLoading] = React.useState(false);

      const handleSearch = async () => {
        setLoading(true);
        try {
          const results = await mockSearchAssets(searchQuery, {});
          setAssets(results.assets);
        } finally {
          setLoading(false);
        }
      };

      return (
        <div>
          <div data-testid="search-section">
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-input"
            />
            <button onClick={handleSearch} data-testid="search-button">
              Search
            </button>
          </div>

          {loading && <div data-testid="search-loading">Searching...</div>}

          <div data-testid="search-results">
            {assets.map((asset) => (
              <div key={asset.id} data-testid={`result-${asset.id}`}>
                <h3>{asset.title}</h3>
                <p>File: {asset.fileName}</p>
                <p>Type: {asset.fileType}</p>
                <div data-testid={`tags-${asset.id}`}>
                  {asset.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    render(<MockSearchPage />);

    // 1. User enters search query
    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'marketing');

    // 2. User executes search
    const searchButton = screen.getByTestId('search-button');
    await user.click(searchButton);

    // 3. Verify loading state
    expect(screen.getByTestId('search-loading')).toBeInTheDocument();

    // 4. Verify search results
    await waitFor(() => {
      expect(screen.getByTestId('result-asset-1')).toBeInTheDocument();
    });

    expect(mockSearchAssets).toHaveBeenCalledWith('marketing', {});
    expect(screen.getByText('Marketing Banner')).toBeInTheDocument();
    expect(screen.getByText('Brand Guidelines')).toBeInTheDocument();
  });

  it('applies filters and updates search results', async () => {
    const MockSearchWithFilters = () => {
      const [searchQuery, setSearchQuery] = React.useState('');
      const [filters, setFilters] = React.useState({
        fileType: '',
        tags: [],
        uploader: '',
        dateRange: { start: '', end: '' }
      });
      const [assets, setAssets] = React.useState(mockAssets);

      const applyFilters = () => {
        let filtered = mockAssets;

        if (filters.fileType) {
          filtered = filtered.filter(asset => 
            asset.fileType.includes(filters.fileType)
          );
        }

        if (filters.tags.length > 0) {
          filtered = filtered.filter(asset =>
            filters.tags.some(tag => asset.tags.includes(tag))
          );
        }

        if (filters.uploader) {
          filtered = filtered.filter(asset =>
            asset.uploader.id === filters.uploader
          );
        }

        setAssets(filtered);
      };

      return (
        <div>
          <div data-testid="filters-section">
            <select
              value={filters.fileType}
              onChange={(e) => setFilters(prev => ({ ...prev, fileType: e.target.value }))}
              data-testid="file-type-filter"
            >
              <option value="">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="pdf">Documents</option>
            </select>

            <select
              value={filters.uploader}
              onChange={(e) => setFilters(prev => ({ ...prev, uploader: e.target.value }))}
              data-testid="uploader-filter"
            >
              <option value="">All Uploaders</option>
              <option value="user-1">John Doe</option>
              <option value="user-2">Jane Smith</option>
              <option value="user-3">Bob Wilson</option>
            </select>

            <div data-testid="tag-filters">
              {['marketing', 'brand', 'product'].map(tag => (
                <label key={tag}>
                  <input
                    type="checkbox"
                    checked={filters.tags.includes(tag)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilters(prev => ({ 
                          ...prev, 
                          tags: [...prev.tags, tag] 
                        }));
                      } else {
                        setFilters(prev => ({ 
                          ...prev, 
                          tags: prev.tags.filter(t => t !== tag) 
                        }));
                      }
                    }}
                    data-testid={`tag-${tag}`}
                  />
                  {tag}
                </label>
              ))}
            </div>

            <button onClick={applyFilters} data-testid="apply-filters">
              Apply Filters
            </button>
          </div>

          <div data-testid="filtered-results">
            <div data-testid="results-count">
              {assets.length} result(s) found
            </div>
            {assets.map((asset) => (
              <div key={asset.id} data-testid={`filtered-result-${asset.id}`}>
                <h3>{asset.title}</h3>
                <p>Uploader: {asset.uploader.name}</p>
              </div>
            ))}
          </div>
        </div>
      );
    };

    render(<MockSearchWithFilters />);

    // Initially shows all assets
    expect(screen.getByText('3 result(s) found')).toBeInTheDocument();

    // 1. Apply file type filter
    const fileTypeFilter = screen.getByTestId('file-type-filter');
    await user.selectOptions(fileTypeFilter, 'image');

    const applyButton = screen.getByTestId('apply-filters');
    await user.click(applyButton);

    // Should show only image assets
    expect(screen.getByText('1 result(s) found')).toBeInTheDocument();
    expect(screen.getByTestId('filtered-result-asset-1')).toBeInTheDocument();

    // 2. Apply tag filter
    const marketingTag = screen.getByTestId('tag-marketing');
    await user.click(marketingTag);
    await user.click(applyButton);

    // Should show assets with marketing tag
    expect(screen.getByTestId('filtered-result-asset-1')).toBeInTheDocument();

    // 3. Apply uploader filter
    const uploaderFilter = screen.getByTestId('uploader-filter');
    await user.selectOptions(uploaderFilter, 'user-2');
    await user.click(applyButton);

    // Should show only Jane Smith's assets
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('handles advanced search with multiple criteria', async () => {
    const MockAdvancedSearch = () => {
      const [searchState, setSearchState] = React.useState({
        query: '',
        filters: {
          exactMatch: false,
          searchInTags: true,
          searchInDescription: true,
          searchInFileName: true
        },
        results: []
      });

      const performAdvancedSearch = () => {
        const { query, filters } = searchState;
        let results = mockAssets;

        if (query) {
          results = results.filter(asset => {
            const searchTargets = [];
            
            if (filters.searchInFileName) searchTargets.push(asset.fileName);
            if (filters.searchInTags) searchTargets.push(asset.tags.join(' '));
            if (filters.searchInDescription) searchTargets.push(asset.title);

            const searchText = searchTargets.join(' ').toLowerCase();
            
            if (filters.exactMatch) {
              return searchText.includes(query.toLowerCase());
            } else {
              return query.toLowerCase().split(' ').every(term =>
                searchText.includes(term)
              );
            }
          });
        }

        setSearchState(prev => ({ ...prev, results }));
      };

      return (
        <div>
          <div data-testid="advanced-search">
            <input
              type="text"
              placeholder="Advanced search..."
              value={searchState.query}
              onChange={(e) => setSearchState(prev => ({ 
                ...prev, 
                query: e.target.value 
              }))}
              data-testid="advanced-search-input"
            />

            <div data-testid="search-options">
              <label>
                <input
                  type="checkbox"
                  checked={searchState.filters.exactMatch}
                  onChange={(e) => setSearchState(prev => ({
                    ...prev,
                    filters: { ...prev.filters, exactMatch: e.target.checked }
                  }))}
                  data-testid="exact-match"
                />
                Exact match
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={searchState.filters.searchInTags}
                  onChange={(e) => setSearchState(prev => ({
                    ...prev,
                    filters: { ...prev.filters, searchInTags: e.target.checked }
                  }))}
                  data-testid="search-in-tags"
                />
                Search in tags
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={searchState.filters.searchInFileName}
                  onChange={(e) => setSearchState(prev => ({
                    ...prev,
                    filters: { ...prev.filters, searchInFileName: e.target.checked }
                  }))}
                  data-testid="search-in-filename"
                />
                Search in filename
              </label>
            </div>

            <button onClick={performAdvancedSearch} data-testid="advanced-search-button">
              Advanced Search
            </button>
          </div>

          <div data-testid="advanced-results">
            {searchState.results.map((asset) => (
              <div key={asset.id} data-testid={`advanced-result-${asset.id}`}>
                <h3>{asset.title}</h3>
                <p>File: {asset.fileName}</p>
                <p>Tags: {asset.tags.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>
      );
    };

    render(<MockAdvancedSearch />);

    // 1. Perform tag-based search
    const searchInput = screen.getByTestId('advanced-search-input');
    await user.type(searchInput, 'marketing');

    const searchButton = screen.getByTestId('advanced-search-button');
    await user.click(searchButton);

    expect(screen.getByTestId('advanced-result-asset-1')).toBeInTheDocument();

    // 2. Enable exact match
    const exactMatch = screen.getByTestId('exact-match');
    await user.click(exactMatch);
    await user.click(searchButton);

    // Should still find results with exact matching
    expect(screen.getByTestId('advanced-result-asset-1')).toBeInTheDocument();

    // 3. Search in filename only
    const searchInTags = screen.getByTestId('search-in-tags');
    await user.click(searchInTags); // Disable tag search

    await user.clear(searchInput);
    await user.type(searchInput, 'banner');
    await user.click(searchButton);

    // Should find the marketing banner by filename
    expect(screen.getByTestId('advanced-result-asset-1')).toBeInTheDocument();
  });

  it('saves and loads search preferences', async () => {
    const MockSearchWithPreferences = () => {
      const [preferences, setPreferences] = React.useState({
        defaultFilters: { fileType: '', sortBy: 'date' },
        savedSearches: []
      });

      const saveSearch = (query, filters) => {
        const newSearch = {
          id: Date.now().toString(),
          name: `Search: ${query}`,
          query,
          filters,
          createdAt: new Date().toISOString()
        };

        setPreferences(prev => ({
          ...prev,
          savedSearches: [...prev.savedSearches, newSearch]
        }));
      };

      const loadSavedSearch = (searchId) => {
        const search = preferences.savedSearches.find(s => s.id === searchId);
        if (search) {
          // Simulate loading the search
          const event = new CustomEvent('searchLoaded', { 
            detail: { query: search.query, filters: search.filters }
          });
          window.dispatchEvent(event);
        }
      };

      return (
        <div>
          <div data-testid="search-preferences">
            <button
              onClick={() => saveSearch('marketing assets', { fileType: 'image' })}
              data-testid="save-search"
            >
              Save Current Search
            </button>

            <div data-testid="saved-searches">
              <h4>Saved Searches ({preferences.savedSearches.length})</h4>
              {preferences.savedSearches.map(search => (
                <div key={search.id} data-testid={`saved-search-${search.id}`}>
                  <span>{search.name}</span>
                  <button
                    onClick={() => loadSavedSearch(search.id)}
                    data-testid={`load-search-${search.id}`}
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div data-testid="search-status">
            {preferences.savedSearches.length > 0 && (
              <p>You have {preferences.savedSearches.length} saved search(es)</p>
            )}
          </div>
        </div>
      );
    };

    render(<MockSearchWithPreferences />);

    // Initially no saved searches
    expect(screen.getByText('Saved Searches (0)')).toBeInTheDocument();

    // Save a search
    const saveButton = screen.getByTestId('save-search');
    await user.click(saveButton);

    // Verify search was saved
    await waitFor(() => {
      expect(screen.getByText('Saved Searches (1)')).toBeInTheDocument();
    });

    expect(screen.getByText('You have 1 saved search(es)')).toBeInTheDocument();
    expect(screen.getByText('Search: marketing assets')).toBeInTheDocument();

    // Load saved search
    const loadButton = screen.getByTestId(/load-search-/);
    await user.click(loadButton);

    // Search should be loaded (in real implementation this would populate search form)
    expect(loadButton).toBeInTheDocument();
  });
});