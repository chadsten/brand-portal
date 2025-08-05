import { render, screen, fireEvent } from '@testing-library/react';
import { AssetGrid, type Asset } from '~/components/assets/AssetGrid';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Download: () => <div data-testid="download-icon" />,
  Share: () => <div data-testid="share-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  MoreVertical: () => <div data-testid="more-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  User: () => <div data-testid="user-icon" />,
  HardDrive: () => <div data-testid="harddrive-icon" />,
  FileText: () => <div data-testid="file-icon" />,
}));

// Mock DaisyUI components (no library imports needed as DaisyUI uses pure CSS classes)
// These mocks simulate the expected HTML structure with DaisyUI classes
const mockDaisyUIComponents = {
  Card: ({ children, className, onPress, ...props }: any) => (
    <div className={`card ${className || ''}`} onClick={onPress} {...props}>
      {children}
    </div>
  ),
  CardBody: ({ children, className }: any) => (
    <div className={`card-body ${className || ''}`}>{children}</div>
  ),
  CardFooter: ({ children, className }: any) => (
    <div className={`card-actions ${className || ''}`}>{children}</div>
  ),
  Image: ({ src, alt, className }: any) => (
    <img src={src} alt={alt} className={className || ''} />
  ),
  Checkbox: ({ isSelected, onValueChange, className }: any) => (
    <input
      type="checkbox"
      className={`checkbox ${className || ''}`}
      checked={isSelected}
      onChange={(e) => onValueChange?.(e.target.checked)}
    />
  ),
  Chip: ({ children, className }: any) => (
    <span className={`badge ${className || ''}`}>{children}</span>
  ),
  Button: ({ children, onPress, startContent, className, isIconOnly }: any) => (
    <button className={`btn ${className || ''}`} onClick={onPress}>
      {startContent}
      {!isIconOnly && children}
    </button>
  ),
  Dropdown: ({ children }: any) => <div className="dropdown">{children}</div>,
  DropdownTrigger: ({ children }: any) => <div className="dropdown-trigger">{children}</div>,
  DropdownMenu: ({ children }: any) => <div className="dropdown-content" role="menu">{children}</div>,
  DropdownItem: ({ children, onPress, startContent }: any) => (
    <div className="dropdown-item" role="menuitem" onClick={onPress}>
      {startContent}
      {children}
    </div>
  ),
  Progress: ({ value, className }: any) => (
    <progress 
      className={`progress ${className || ''}`} 
      value={value} 
      max="100"
      aria-valuenow={value} 
      role="progressbar"
    >
      {value}%
    </progress>
  ),
};

// Make components available globally for the test
global.Card = mockDaisyUIComponents.Card;
global.CardBody = mockDaisyUIComponents.CardBody;
global.CardFooter = mockDaisyUIComponents.CardFooter;
global.Image = mockDaisyUIComponents.Image;
global.Checkbox = mockDaisyUIComponents.Checkbox;
global.Chip = mockDaisyUIComponents.Chip;
global.Button = mockDaisyUIComponents.Button;
global.Dropdown = mockDaisyUIComponents.Dropdown;
global.DropdownTrigger = mockDaisyUIComponents.DropdownTrigger;
global.DropdownMenu = mockDaisyUIComponents.DropdownMenu;
global.DropdownItem = mockDaisyUIComponents.DropdownItem;
global.Progress = mockDaisyUIComponents.Progress;

// Mock utility functions
jest.mock('~/lib/utils', () => ({
  formatBytes: (bytes: number) => `${bytes} bytes`,
  formatDistanceToNow: (date: Date) => '2 hours ago',
}));

const mockAssets: Asset[] = [
  {
    id: '1',
    fileName: 'test-image.jpg',
    title: 'Test Image',
    description: 'A test image',
    fileType: 'image/jpeg',
    mimeType: 'image/jpeg',
    fileSize: 1024000,
    thumbnailKey: 'thumb-1',
    tags: ['test', 'image'],
    metadata: { width: 1920, height: 1080 },
    processingStatus: 'completed',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    uploader: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com'
    }
  },
  {
    id: '2',
    fileName: 'document.pdf',
    title: 'Test Document',
    description: 'A test document',
    fileType: 'application/pdf',
    mimeType: 'application/pdf',
    fileSize: 512000,
    tags: ['document', 'test'],
    metadata: { pages: 10 },
    processingStatus: 'processing',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    uploader: {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com'
    }
  }
];

describe('AssetGrid', () => {
  const defaultProps = {
    assets: mockAssets,
    selectedAssets: new Set<string>(),
    onAssetClick: jest.fn(),
    onAssetSelect: jest.fn(),
    getThumbnailUrl: jest.fn((asset: Asset) => 
      asset.thumbnailKey ? `/thumbnails/${asset.thumbnailKey}.jpg` : null
    ),
    getFileTypeIcon: jest.fn(() => 'FileText'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all assets in grid format', () => {
    render(<AssetGrid {...defaultProps} />);
    
    expect(screen.getByText('Test Image')).toBeInTheDocument();
    expect(screen.getByText('Test Document')).toBeInTheDocument();
    expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
  });

  it('displays asset thumbnails when available', () => {
    render(<AssetGrid {...defaultProps} />);
    
    const thumbnail = screen.getByAltText('Test Image');
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveAttribute('src', '/thumbnails/thumb-1.jpg');
  });

  it('shows file type icon when no thumbnail available', () => {
    render(<AssetGrid {...defaultProps} />);
    
    // Document should show file icon instead of thumbnail
    expect(screen.getByTestId('file-icon')).toBeInTheDocument();
  });

  it('displays asset tags', () => {
    render(<AssetGrid {...defaultProps} />);
    
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('image')).toBeInTheDocument();
    expect(screen.getByText('document')).toBeInTheDocument();
  });

  it('shows processing status for assets being processed', () => {
    render(<AssetGrid {...defaultProps} />);
    
    expect(screen.getByText('processing')).toBeInTheDocument();
  });

  it('displays progress bar for processing assets', () => {
    render(<AssetGrid {...defaultProps} />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('calls onAssetClick when asset is clicked', () => {
    render(<AssetGrid {...defaultProps} />);
    
    const assetCard = screen.getByText('Test Image').closest('div[class*="group"]');
    fireEvent.click(assetCard!);
    
    expect(defaultProps.onAssetClick).toHaveBeenCalledWith('1');
  });

  it('shows selection checkbox when onAssetSelect is provided', () => {
    render(<AssetGrid {...defaultProps} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('calls onAssetSelect when checkbox is toggled', () => {
    render(<AssetGrid {...defaultProps} />);
    
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);
    
    expect(defaultProps.onAssetSelect).toHaveBeenCalledWith('1', true);
  });

  it('highlights selected assets', () => {
    const selectedAssets = new Set(['1']);
    render(<AssetGrid {...defaultProps} selectedAssets={selectedAssets} />);
    
    const selectedCard = screen.getByText('Test Image').closest('div[class*="group"]');
    expect(selectedCard).toHaveClass('ring-2', 'ring-primary');
  });

  it('displays asset metadata', () => {
    render(<AssetGrid {...defaultProps} />);
    
    // File sizes should be displayed
    expect(screen.getByText('1024000 bytes')).toBeInTheDocument();
    expect(screen.getByText('512000 bytes')).toBeInTheDocument();
  });

  it('shows file type in uppercase', () => {
    render(<AssetGrid {...defaultProps} />);
    
    expect(screen.getByText('IMAGE/JPEG')).toBeInTheDocument();
    expect(screen.getByText('APPLICATION/PDF')).toBeInTheDocument();
  });

  it('displays uploader information on hover', () => {
    render(<AssetGrid {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows action menu with correct options', () => {
    render(<AssetGrid {...defaultProps} />);
    
    // Action menus should contain various options
    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Download')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('limits displayed tags to 2 with overflow indicator', () => {
    const assetWithManyTags: Asset = {
      ...mockAssets[0],
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
    };
    
    render(<AssetGrid {...defaultProps} assets={[assetWithManyTags]} />);
    
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument(); // Overflow indicator
  });

  it('handles empty assets array', () => {
    const { container } = render(<AssetGrid {...defaultProps} assets={[]} />);
    
    expect(container.firstChild).toBeEmptyDOMElement();
  });
});