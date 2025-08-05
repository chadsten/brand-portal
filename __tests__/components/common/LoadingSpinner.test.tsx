import { render, screen } from '@testing-library/react';
import { 
  LoadingSpinner, 
  PageLoading, 
  SkeletonCard, 
  SkeletonGrid, 
  SkeletonTable, 
  SkeletonList 
} from '~/components/common/LoadingSpinner';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Loader2: ({ className }: any) => <div className={className} data-testid="loader2-icon" />,
}));

// Mock DaisyUI components (no library imports needed as DaisyUI uses pure CSS classes)
// These mocks simulate the expected HTML structure with DaisyUI classes
const mockDaisyUIComponents = {
  Spinner: ({ size, color }: any) => (
    <span 
      className={`loading loading-spinner ${size ? `loading-${size}` : ''} ${color ? `text-${color}` : ''}`}
      role="progressbar" 
    />
  ),
  Card: ({ children, className }: any) => (
    <div className={`card ${className || ''}`} role="presentation">{children}</div>
  ),
  CardBody: ({ children }: any) => <div className="card-body">{children}</div>,
  Skeleton: ({ children, isLoaded, className }: any) => (
    <div 
      className={`${isLoaded ? '' : 'skeleton'} ${className || ''}`} 
      data-loaded={isLoaded ? "true" : "false"}
    >
      {isLoaded ? children : null}
    </div>
  ),
};

// Make components available globally for the test
global.Spinner = mockDaisyUIComponents.Spinner;
global.Card = mockDaisyUIComponents.Card;
global.CardBody = mockDaisyUIComponents.CardBody;
global.Skeleton = mockDaisyUIComponents.Skeleton;

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('loading', 'loading-spinner');
  });

  it('renders with custom label', () => {
    render(<LoadingSpinner label="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('PageLoading', () => {
  it('renders with default title', () => {
    render(<PageLoading />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom title and description', () => {
    render(<PageLoading title="Custom Loading" description="Please wait while we load your data" />);
    expect(screen.getByText('Custom Loading')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we load your data')).toBeInTheDocument();
  });
});

describe('SkeletonCard', () => {
  it('renders with default number of lines', () => {
    const { container } = render(<SkeletonCard />);
    const skeletons = container.querySelectorAll('[data-loaded="false"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders with avatar when showAvatar is true', () => {
    const { container } = render(<SkeletonCard showAvatar={true} />);
    const roundedSkeletons = container.querySelectorAll('.rounded-full');
    expect(roundedSkeletons.length).toBeGreaterThan(0);
  });

  it('renders with image when showImage is true', () => {
    const { container } = render(<SkeletonCard showImage={true} />);
    const imageSkeletons = container.querySelectorAll('.h-48');
    expect(imageSkeletons.length).toBeGreaterThan(0);
  });

  it('renders custom number of lines', () => {
    const { container } = render(<SkeletonCard lines={5} />);
    // Should have the specified number of line skeletons
    const lineSkeletons = container.querySelectorAll('.space-y-2 > *');
    expect(lineSkeletons.length).toBe(5);
  });
});

describe('SkeletonGrid', () => {
  it('renders default number of skeleton cards', () => {
    const { container } = render(<SkeletonGrid />);
    const cards = container.querySelectorAll('[role="presentation"]');
    expect(cards.length).toBe(6); // default count
  });

  it('renders custom number of skeleton cards', () => {
    const { container } = render(<SkeletonGrid count={4} />);
    const gridItems = container.querySelector('.grid')?.children;
    expect(gridItems?.length).toBe(4);
  });

  it('applies correct grid columns for different column counts', () => {
    const { container } = render(<SkeletonGrid columns={4} />);
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('xl:grid-cols-4');
  });
});

describe('SkeletonTable', () => {
  it('renders with default rows and columns', () => {
    const { container } = render(<SkeletonTable />);
    const headerCells = container.querySelectorAll('thead th');
    const bodyRows = container.querySelectorAll('tbody tr');
    
    expect(headerCells.length).toBe(4); // default columns
    expect(bodyRows.length).toBe(5); // default rows
  });

  it('renders with custom rows and columns', () => {
    const { container } = render(<SkeletonTable rows={3} columns={5} />);
    const headerCells = container.querySelectorAll('thead th');
    const bodyRows = container.querySelectorAll('tbody tr');
    
    expect(headerCells.length).toBe(5);
    expect(bodyRows.length).toBe(3);
  });
});

describe('SkeletonList', () => {
  it('renders default number of list items', () => {
    const { container } = render(<SkeletonList />);
    const listItems = container.querySelectorAll('.space-y-3 > *');
    expect(listItems.length).toBe(5); // default items
  });

  it('renders custom number of list items', () => {
    const { container } = render(<SkeletonList items={3} />);
    const listItems = container.querySelectorAll('.space-y-3 > *');
    expect(listItems.length).toBe(3);
  });

  it('shows avatar when showAvatar is true', () => {
    const { container } = render(<SkeletonList showAvatar={true} />);
    const avatars = container.querySelectorAll('.rounded-full');
    expect(avatars.length).toBeGreaterThan(0);
  });

  it('shows image when showImage is true', () => {
    const { container } = render(<SkeletonList showImage={true} />);
    const images = container.querySelectorAll('.h-16.w-16');
    expect(images.length).toBeGreaterThan(0);
  });
});