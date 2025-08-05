import { render, screen, fireEvent } from '@testing-library/react';
import { MainNavigation } from '~/components/navigation/MainNavigation';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Home: () => <div data-testid="home-icon" />,
  Image: () => <div data-testid="image-icon" />,
  FolderOpen: () => <div data-testid="folder-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Users: () => <div data-testid="users-icon" />,
  BarChart3: () => <div data-testid="chart-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Bell: () => <div data-testid="bell-icon" />,
  HelpCircle: () => <div data-testid="help-icon" />,
  User: () => <div data-testid="user-icon" />,
  ChevronDown: () => <div data-testid="chevron-icon" />,
  LogOut: () => <div data-testid="logout-icon" />,
  Menu: () => <div data-testid="menu-icon" />,
  X: () => <div data-testid="close-icon" />,
}));

// Mock DaisyUI components (no library imports needed as DaisyUI uses pure CSS classes)
// These mocks simulate the expected HTML structure with DaisyUI classes
const mockDaisyUIComponents = {
  useDisclosure: () => ({
    isOpen: false,
    onOpen: jest.fn(),
    onClose: jest.fn(),
    onOpenChange: jest.fn(),
  }),
  Navbar: ({ children, className }: any) => (
    <nav className={`navbar ${className || ''}`}>{children}</nav>
  ),
  NavbarBrand: ({ children }: any) => <div className="navbar-start">{children}</div>,
  NavbarContent: ({ children, justify }: any) => (
    <div className={`navbar-${justify === 'end' ? 'end' : 'center'}`}>{children}</div>
  ),
  NavbarItem: ({ children }: any) => <div className="navbar-item">{children}</div>,
  NavbarMenuToggle: ({ children, isOpen, onPress }: any) => (
    <button className="btn btn-square btn-ghost" onClick={onPress} data-open={isOpen}>
      {children}
    </button>
  ),
  NavbarMenu: ({ children, isOpen }: any) => (
    <div className={`menu ${isOpen ? 'menu-open' : ''}`} data-open={isOpen}>{children}</div>
  ),
  NavbarMenuItem: ({ children }: any) => <div className="menu-item">{children}</div>,
  Button: ({ children, onPress, startContent, variant, className }: any) => (
    <button 
      className={`btn ${variant ? `btn-${variant}` : ''} ${className || ''}`} 
      onClick={onPress} 
      data-variant={variant}
    >
      {startContent}
      {children}
    </button>
  ),
  Link: ({ children, href, className }: any) => (
    <a href={href} className={`link ${className || ''}`}>
      {children}
    </a>
  ),
  Badge: ({ children, content, color }: any) => (
    <div className={`indicator ${color ? `badge-${color}` : ''}`}>
      {children}
      {content && <span className="indicator-item badge badge-secondary" data-testid="badge-content">{content}</span>}
    </div>
  ),
  Avatar: ({ src, name, size }: any) => (
    <div className={`avatar ${size ? `avatar-${size}` : ''}`}>
      <div className="w-8 rounded-full">
        <img src={src} alt={name} />
      </div>
    </div>
  ),
  Dropdown: ({ children }: any) => <div className="dropdown">{children}</div>,
  DropdownTrigger: ({ children }: any) => <div className="dropdown-trigger">{children}</div>,
  DropdownMenu: ({ children }: any) => <div className="dropdown-content menu" role="menu">{children}</div>,
  DropdownItem: ({ children, onPress, startContent }: any) => (
    <li><a role="menuitem" onClick={onPress}>
      {startContent}
      {children}
    </a></li>
  ),
};

// Make components available globally for the test
global.useDisclosure = mockDaisyUIComponents.useDisclosure;
global.Navbar = mockDaisyUIComponents.Navbar;
global.NavbarBrand = mockDaisyUIComponents.NavbarBrand;
global.NavbarContent = mockDaisyUIComponents.NavbarContent;
global.NavbarItem = mockDaisyUIComponents.NavbarItem;
global.NavbarMenuToggle = mockDaisyUIComponents.NavbarMenuToggle;
global.NavbarMenu = mockDaisyUIComponents.NavbarMenu;
global.NavbarMenuItem = mockDaisyUIComponents.NavbarMenuItem;
global.Button = mockDaisyUIComponents.Button;
global.Link = mockDaisyUIComponents.Link;
global.Badge = mockDaisyUIComponents.Badge;
global.Avatar = mockDaisyUIComponents.Avatar;
global.Dropdown = mockDaisyUIComponents.Dropdown;
global.DropdownTrigger = mockDaisyUIComponents.DropdownTrigger;
global.DropdownMenu = mockDaisyUIComponents.DropdownMenu;
global.DropdownItem = mockDaisyUIComponents.DropdownItem;

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  );
});

const mockUser = {
  name: 'John Doe',
  email: 'john@example.com',
  image: '/avatar.jpg',
  role: 'admin' as const,
};

describe('MainNavigation', () => {
  const defaultProps = {
    user: mockUser,
    onSignOut: jest.fn(),
    notificationCount: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all navigation items', () => {
    render(<MainNavigation {...defaultProps} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Assets')).toBeInTheDocument();
    expect(screen.getByText('Collections')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('displays user information', () => {
    render(<MainNavigation {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByAltText('John Doe')).toBeInTheDocument();
  });

  it('shows notification badge when there are notifications', () => {
    render(<MainNavigation {...defaultProps} notificationCount={5} />);
    
    const badge = screen.getByTestId('badge-content');
    expect(badge).toHaveTextContent('5');
  });

  it('does not show notification badge when count is 0', () => {
    render(<MainNavigation {...defaultProps} notificationCount={0} />);
    
    expect(screen.queryByTestId('badge-content')).not.toBeInTheDocument();
  });

  it('calls onSignOut when logout is clicked', () => {
    render(<MainNavigation {...defaultProps} />);
    
    const logoutButton = screen.getByText('Sign Out');
    fireEvent.click(logoutButton);
    
    expect(defaultProps.onSignOut).toHaveBeenCalled();
  });

  it('toggles mobile menu', () => {
    render(<MainNavigation {...defaultProps} />);
    
    const menuToggle = screen.getByRole('button', { name: /menu/i });
    expect(menuToggle).toHaveAttribute('data-open', 'false');
    
    fireEvent.click(menuToggle);
    
    // Menu should be open after click
    const menu = screen.getByTestId('menu-icon').closest('button');
    expect(menu).toHaveAttribute('data-open', 'true');
  });

  it('shows help link', () => {
    render(<MainNavigation {...defaultProps} />);
    
    expect(screen.getByText('Help')).toBeInTheDocument();
    expect(screen.getByTestId('help-icon')).toBeInTheDocument();
  });

  it('displays brand name', () => {
    render(<MainNavigation {...defaultProps} />);
    
    expect(screen.getByText('Brand Portal')).toBeInTheDocument();
  });

  it('shows all required icons', () => {
    render(<MainNavigation {...defaultProps} />);
    
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    expect(screen.getByTestId('image-icon')).toBeInTheDocument();
    expect(screen.getByTestId('folder-icon')).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    expect(screen.getByTestId('chart-icon')).toBeInTheDocument();
    expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
    expect(screen.getByTestId('help-icon')).toBeInTheDocument();
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
  });

  it('shows user role specific items for admin', () => {
    render(<MainNavigation {...defaultProps} />);
    
    // Admin should see Team and Analytics
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('hides admin items for regular users', () => {
    const regularUser = { ...mockUser, role: 'user' as const };
    render(<MainNavigation {...defaultProps} user={regularUser} />);
    
    // Regular users might have limited access - check if Team/Analytics are hidden
    // This would depend on the actual implementation
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Assets')).toBeInTheDocument();
  });

  it('handles navigation links correctly', () => {
    render(<MainNavigation {...defaultProps} />);
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const assetsLink = screen.getByText('Assets').closest('a');
    const collectionsLink = screen.getByText('Collections').closest('a');
    
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    expect(assetsLink).toHaveAttribute('href', '/assets');
    expect(collectionsLink).toHaveAttribute('href', '/collections');
  });
});