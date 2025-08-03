import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsCard } from '~/components/settings/SettingsCard';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  User: () => <div data-testid="user-icon" />,
  Bell: () => <div data-testid="bell-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  Palette: () => <div data-testid="palette-icon" />,
}));

// Mock @heroui/react components
jest.mock('@heroui/react', () => ({
  Card: ({ children, className, isPressable, onPress }: any) => (
    <div 
      className={className} 
      onClick={isPressable ? onPress : undefined}
      role={isPressable ? "button" : undefined}
      tabIndex={isPressable ? 0 : undefined}
    >
      {children}
    </div>
  ),
  CardBody: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardFooter: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  Button: ({ children, onPress, startContent, variant, size, color }: any) => (
    <button 
      onClick={onPress} 
      data-variant={variant} 
      data-size={size}
      data-color={color}
    >
      {startContent}
      {children}
    </button>
  ),
  Switch: ({ isSelected, onValueChange, children }: any) => (
    <label>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => onValueChange && onValueChange(e.target.checked)}
      />
      {children}
    </label>
  ),
  Select: ({ children, label, placeholder, onSelectionChange, selectedKeys }: any) => (
    <div>
      <label>{label}</label>
      <select 
        onChange={(e) => onSelectionChange && onSelectionChange(new Set([e.target.value]))}
        value={Array.from(selectedKeys || [])[0] || ''}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
    </div>
  ),
  SelectItem: ({ children, key }: any) => (
    <option value={key}>{children}</option>
  ),
  Input: ({ label, placeholder, value, onValueChange, type }: any) => (
    <div>
      {label && <label>{label}</label>}
      <input
        type={type || 'text'}
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onValueChange && onValueChange(e.target.value)}
      />
    </div>
  ),
  Divider: () => <hr />,
}));

describe('SettingsCard', () => {
  const defaultProps = {
    title: 'Test Setting',
    description: 'This is a test setting description',
    icon: 'Settings' as const,
  };

  it('renders title and description', () => {
    render(<SettingsCard {...defaultProps} />);
    
    expect(screen.getByText('Test Setting')).toBeInTheDocument();
    expect(screen.getByText('This is a test setting description')).toBeInTheDocument();
  });

  it('renders the correct icon', () => {
    render(<SettingsCard {...defaultProps} />);
    
    expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
  });

  it('renders different icons based on icon prop', () => {
    const { rerender } = render(<SettingsCard {...defaultProps} icon="User" />);
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();

    rerender(<SettingsCard {...defaultProps} icon="Bell" />);
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();

    rerender(<SettingsCard {...defaultProps} icon="Shield" />);
    expect(screen.getByTestId('shield-icon')).toBeInTheDocument();

    rerender(<SettingsCard {...defaultProps} icon="Palette" />);
    expect(screen.getByTestId('palette-icon')).toBeInTheDocument();
  });

  it('renders children when provided', () => {
    render(
      <SettingsCard {...defaultProps}>
        <div>Custom content</div>
      </SettingsCard>
    );
    
    expect(screen.getByText('Custom content')).toBeInTheDocument();
  });

  it('is clickable when onClick is provided', () => {
    const mockOnClick = jest.fn();
    render(<SettingsCard {...defaultProps} onClick={mockOnClick} />);
    
    const card = screen.getByRole('button');
    expect(card).toBeInTheDocument();
    
    fireEvent.click(card);
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('shows chevron icon when clickable', () => {
    const mockOnClick = jest.fn();
    render(<SettingsCard {...defaultProps} onClick={mockOnClick} />);
    
    expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
  });

  it('does not show chevron icon when not clickable', () => {
    render(<SettingsCard {...defaultProps} />);
    
    expect(screen.queryByTestId('chevron-right-icon')).not.toBeInTheDocument();
  });

  it('renders with action buttons', () => {
    render(
      <SettingsCard 
        {...defaultProps}
        actions={
          <Button color="primary">Save</Button>
        }
      />
    );
    
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('renders with switch toggle', () => {
    const mockOnToggle = jest.fn();
    render(
      <SettingsCard {...defaultProps}>
        <Switch isSelected={true} onValueChange={mockOnToggle}>
          Enable feature
        </Switch>
      </SettingsCard>
    );
    
    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeChecked();
    
    fireEvent.click(toggle);
    expect(mockOnToggle).toHaveBeenCalledWith(false);
  });

  it('renders with select dropdown', () => {
    render(
      <SettingsCard {...defaultProps}>
        <Select label="Theme" placeholder="Select theme">
          <SelectItem key="light">Light</SelectItem>
          <SelectItem key="dark">Dark</SelectItem>
          <SelectItem key="auto">Auto</SelectItem>
        </Select>
      </SettingsCard>
    );
    
    expect(screen.getByLabelText('Theme')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('Auto')).toBeInTheDocument();
  });

  it('renders with input field', () => {
    render(
      <SettingsCard {...defaultProps}>
        <Input 
          label="Display Name" 
          placeholder="Enter your name"
          value="John Doe"
        />
      </SettingsCard>
    );
    
    expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SettingsCard {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles complex nested content', () => {
    render(
      <SettingsCard {...defaultProps}>
        <div>
          <h4>Advanced Settings</h4>
          <Switch isSelected={false}>Auto-save</Switch>
          <Divider />
          <Input label="API Key" type="password" />
          <Button variant="flat">Reset</Button>
        </div>
      </SettingsCard>
    );
    
    expect(screen.getByText('Advanced Settings')).toBeInTheDocument();
    expect(screen.getByText('Auto-save')).toBeInTheDocument();
    expect(screen.getByLabelText('API Key')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(
      <SettingsCard {...defaultProps} disabled={true}>
        <Switch isSelected={true}>Disabled feature</Switch>
      </SettingsCard>
    );
    
    const card = screen.getByText('Test Setting').closest('div');
    expect(card).toHaveClass('opacity-50');
  });

  it('shows loading state', () => {
    render(
      <SettingsCard {...defaultProps} loading={true}>
        <div>Loading content...</div>
      </SettingsCard>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles error state', () => {
    render(
      <SettingsCard {...defaultProps} error="Something went wrong">
        <div>Content</div>
      </SettingsCard>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});