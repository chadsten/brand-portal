import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '~/components/common/ErrorBoundary';

// Mock console.error to prevent error logs in tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  afterEach(() => {
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /report error/i })).toBeInTheDocument();
  });

  it('displays error details in development mode', () => {
    render(
      <ErrorBoundary showDetails={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details:')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const mockOnError = jest.fn();

    render(
      <ErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('resets error state when try again is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainButton);

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('handles go home button click', () => {
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' };

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const goHomeButton = screen.getByRole('button', { name: /go home/i });
    fireEvent.click(goHomeButton);

    expect(window.location.href).toBe('/');

    window.location = originalLocation;
  });

  it('handles report error button click', async () => {
    // Mock clipboard API
    const mockWriteText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText
      },
      configurable: true
    });

    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reportButton = screen.getByRole('button', { name: /report error/i });
    fireEvent.click(reportButton);

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockWriteText).toHaveBeenCalledWith(
      expect.stringContaining('Test error')
    );

    mockAlert.mockRestore();
  });
});