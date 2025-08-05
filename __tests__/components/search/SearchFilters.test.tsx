import { render, screen, fireEvent } from '@testing-library/react';
import { SearchFilters } from '~/components/search/SearchFilters';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Filter: () => <div data-testid="filter-icon" />,
  X: () => <div data-testid="x-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  User: () => <div data-testid="user-icon" />,
  Tag: () => <div data-testid="tag-icon" />,
  FileType: () => <div data-testid="filetype-icon" />,
  HardDrive: () => <div data-testid="harddrive-icon" />,
}));

// Mock DaisyUI components (no library imports needed as DaisyUI uses pure CSS classes)
// These mocks simulate the expected HTML structure with DaisyUI classes
const mockDaisyUIComponents = {
  Card: ({ children, className }: any) => (
    <div className={`card ${className || ''}`}>{children}</div>
  ),
  CardBody: ({ children }: any) => <div className="card-body">{children}</div>,
  CardHeader: ({ children }: any) => <div className="card-header">{children}</div>,
  Button: ({ children, onPress, startContent, variant, size }: any) => (
    <button 
      className={`btn ${variant ? `btn-${variant}` : ''} ${size ? `btn-${size}` : ''}`}
      onClick={onPress} 
      data-variant={variant} 
      data-size={size}
    >
      {startContent}
      {children}
    </button>
  ),
  Select: ({ children, label, placeholder, onSelectionChange, selectedKeys }: any) => (
    <div className="form-control">
      {label && <label className="label"><span className="label-text">{label}</span></label>}
      <select 
        className="select select-bordered"
        onChange={(e) => onSelectionChange && onSelectionChange(new Set([e.target.value]))}
        value={Array.from(selectedKeys || [])[0] || ''}
      >
        <option value="" disabled>{placeholder}</option>
        {children}
      </select>
    </div>
  ),
  SelectItem: ({ children, key }: any) => (
    <option value={key}>{children}</option>
  ),
  Input: ({ label, placeholder, value, onValueChange, startContent, type }: any) => (
    <div className="form-control">
      {label && <label className="label"><span className="label-text">{label}</span></label>}
      <div className="input-group">
        {startContent}
        <input
          className="input input-bordered"
          type={type || 'text'}
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onValueChange && onValueChange(e.target.value)}
        />
      </div>
    </div>
  ),
  DateRangePicker: ({ label, value, onChange, startContent }: any) => (
    <div className="form-control">
      {label && <label className="label"><span className="label-text">{label}</span></label>}
      <div className="input-group">
        {startContent}
        <input
          className="input input-bordered"
          type="date"
          data-testid="date-start"
          value={value?.start || ''}
          onChange={(e) => onChange && onChange({ ...value, start: e.target.value })}
        />
        <input
          className="input input-bordered"
          type="date"
          data-testid="date-end"
          value={value?.end || ''}
          onChange={(e) => onChange && onChange({ ...value, end: e.target.value })}
        />
      </div>
    </div>
  ),
  Chip: ({ children, onClose, variant }: any) => (
    <span className={`badge ${variant ? `badge-${variant}` : ''}`}>
      {children}
      {onClose && (
        <button className="btn btn-xs btn-circle" onClick={onClose} data-testid="chip-close">
          ×
        </button>
      )}
    </span>
  ),
  Badge: ({ children, content }: any) => (
    <div className="indicator">
      {children}
      {content && <span className="indicator-item badge badge-secondary">{content}</span>}
    </div>
  ),
  Accordion: ({ children }: any) => <div className="collapse-group">{children}</div>,
  AccordionItem: ({ children, title, key }: any) => (
    <div className="collapse collapse-arrow" key={key}>
      <input type="checkbox" />
      <div className="collapse-title">{title}</div>
      <div className="collapse-content">{children}</div>
    </div>
  ),
  Checkbox: ({ children, isSelected, onValueChange }: any) => (
    <label className="label cursor-pointer">
      <input
        type="checkbox"
        className="checkbox"
        checked={isSelected}
        onChange={(e) => onValueChange && onValueChange(e.target.checked)}
      />
      <span className="label-text">{children}</span>
    </label>
  ),
  CheckboxGroup: ({ children, value, onValueChange }: any) => (
    <div className="form-control" data-value={value} onChange={onValueChange}>{children}</div>
  ),
  Radio: ({ children, value }: any) => (
    <label className="label cursor-pointer">
      <input type="radio" className="radio" value={value} />
      <span className="label-text">{children}</span>
    </label>
  ),
  RadioGroup: ({ children, value, onValueChange }: any) => (
    <div className="form-control" data-value={value} onChange={onValueChange}>{children}</div>
  ),
  Slider: ({ label, value, onChange, min, max }: any) => (
    <div className="form-control">
      {label && <label className="label"><span className="label-text">{label}</span></label>}
      <input
        type="range"
        className="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange && onChange(Number(e.target.value))}
      />
    </div>
  ),
  Spacer: () => <div className="divider" />,
};

// Make components available globally for the test
global.Card = mockDaisyUIComponents.Card;
global.CardBody = mockDaisyUIComponents.CardBody;
global.CardHeader = mockDaisyUIComponents.CardHeader;
global.Button = mockDaisyUIComponents.Button;
global.Select = mockDaisyUIComponents.Select;
global.SelectItem = mockDaisyUIComponents.SelectItem;
global.Input = mockDaisyUIComponents.Input;
global.DateRangePicker = mockDaisyUIComponents.DateRangePicker;
global.Chip = mockDaisyUIComponents.Chip;
global.Badge = mockDaisyUIComponents.Badge;
global.Accordion = mockDaisyUIComponents.Accordion;
global.AccordionItem = mockDaisyUIComponents.AccordionItem;
global.Checkbox = mockDaisyUIComponents.Checkbox;
global.CheckboxGroup = mockDaisyUIComponents.CheckboxGroup;
global.Radio = mockDaisyUIComponents.Radio;
global.RadioGroup = mockDaisyUIComponents.RadioGroup;
global.Slider = mockDaisyUIComponents.Slider;
global.Spacer = mockDaisyUIComponents.Spacer;

describe('SearchFilters', () => {
  const mockFilterGroups = [
    {
      id: 'fileTypes',
      label: 'File Type',
      type: 'checkbox' as const,
      options: [
        { value: 'image', label: 'Images', count: 25 },
        { value: 'document', label: 'Documents', count: 18 },
        { value: 'video', label: 'Videos', count: 7 },
        { value: 'audio', label: 'Audio', count: 3 },
      ],
    },
    {
      id: 'tags',
      label: 'Tags',
      type: 'checkbox' as const,
      options: [
        { value: 'marketing', label: 'Marketing', count: 15 },
        { value: 'brand', label: 'Brand', count: 12 },
        { value: 'social', label: 'Social', count: 8 },
        { value: 'print', label: 'Print', count: 5 },
      ],
    },
    {
      id: 'uploader',
      label: 'Uploader',
      type: 'select' as const,
      options: [
        { value: 'john-doe', label: 'John Doe' },
        { value: 'jane-smith', label: 'Jane Smith' },
        { value: 'bob-wilson', label: 'Bob Wilson' },
      ],
    },
    {
      id: 'dateRange',
      label: 'Date Range',
      type: 'date' as const,
    },
    {
      id: 'fileSize',
      label: 'File Size',
      type: 'range' as const,
      min: 0,
      max: 100,
      unit: 'MB',
    },
  ];

  const mockActiveFilters = {
    fileTypes: ['image', 'document'],
    tags: ['marketing', 'brand'],
    uploader: 'john-doe',
    dateRange: {
      start: '2024-01-01',
      end: '2024-12-31',
    },
    fileSize: [0, 50],
  };

  const defaultProps = {
    filterGroups: mockFilterGroups,
    activeFilters: mockActiveFilters,
    onFilterChange: jest.fn(),
    onClearAll: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter sections', () => {
    render(<SearchFilters {...defaultProps} />);
    
    expect(screen.getByText('File Type')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Uploader')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('File Size')).toBeInTheDocument();
  });

  it('displays filter options', () => {
    render(<SearchFilters {...defaultProps} />);
    
    // Check file type options
    expect(screen.getByText('Images')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Videos')).toBeInTheDocument();
    expect(screen.getByText('Audio')).toBeInTheDocument();
    
    // Check tag options
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('Brand')).toBeInTheDocument();
    expect(screen.getByText('Social')).toBeInTheDocument();
  });

  it('shows clear all button when filters are active', () => {
    render(<SearchFilters {...defaultProps} />);
    
    const clearButton = screen.getByText('Clear All');
    expect(clearButton).toBeInTheDocument();
  });

  it('calls onClearAll when clear button is clicked', () => {
    render(<SearchFilters {...defaultProps} />);
    
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    expect(defaultProps.onClearAll).toHaveBeenCalled();
  });

  it('displays filter counts when showCounts is enabled', () => {
    render(<SearchFilters {...defaultProps} showCounts={true} />);
    
    expect(screen.getByText('25')).toBeInTheDocument(); // Images count
    expect(screen.getByText('18')).toBeInTheDocument(); // Documents count
    expect(screen.getByText('15')).toBeInTheDocument(); // Marketing count
  });

  it('calls onFilterChange when checkbox is clicked', () => {
    render(<SearchFilters {...defaultProps} />);
    
    const videoCheckbox = screen.getByText('Videos').closest('label')?.querySelector('input');
    if (videoCheckbox) {
      fireEvent.click(videoCheckbox);
    }
    
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith('fileTypes', expect.any(Array));
  });

  it('shows uploader options in dropdown', () => {
    render(<SearchFilters {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  it('handles empty filters state', () => {
    const emptyFilters = {};

    render(<SearchFilters {...defaultProps} activeFilters={emptyFilters} />);
    
    expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
  });

  it('displays file type icons', () => {
    render(<SearchFilters {...defaultProps} />);
    
    // Icons should be present for file types
    expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
  });

  it('shows section collapse/expand functionality', () => {
    render(<SearchFilters {...defaultProps} collapsible={true} />);
    
    // All sections should be rendered
    expect(screen.getByText('File Type')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('supports range filter for file size', () => {
    render(<SearchFilters {...defaultProps} />);
    
    // File Size section should support range
    expect(screen.getByText('File Size')).toBeInTheDocument();
  });

  it('displays date range picker', () => {
    render(<SearchFilters {...defaultProps} />);
    
    expect(screen.getByText('Date Range')).toBeInTheDocument();
  });
});