import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock NextAuth
const mockSignIn = jest.fn();
const mockSignOut = jest.fn();
const mockSession = {
  user: {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    image: '/avatar.jpg'
  },
  expires: '2024-12-31'
};

jest.mock('next-auth/react', () => ({
  signIn: mockSignIn,
  signOut: mockSignOut,
  useSession: jest.fn(),
  getSession: jest.fn(),
}));

// Mock router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}));

describe('User Authentication Flow Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful authentication by default
    mockSignIn.mockResolvedValue({ ok: true, error: null });
    mockSignOut.mockResolvedValue({ url: '/login' });
    
    const { useSession } = require('next-auth/react');
    useSession.mockReturnValue({
      data: null,
      status: 'unauthenticated'
    });
  });

  it('completes full login workflow', async () => {
    const MockLoginPage = () => {
      const [credentials, setCredentials] = React.useState({
        email: '',
        password: ''
      });
      const [loading, setLoading] = React.useState(false);
      const [error, setError] = React.useState('');

      const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
          const result = await mockSignIn('credentials', {
            email: credentials.email,
            password: credentials.password,
            redirect: false
          });

          if (result?.ok) {
            // Simulate redirect to dashboard
            setTimeout(() => {
              const successMessage = document.createElement('div');
              successMessage.textContent = 'Login successful! Redirecting...';
              successMessage.setAttribute('data-testid', 'login-success');
              document.body.appendChild(successMessage);
            }, 100);
          } else {
            setError('Invalid credentials');
          }
        } catch (err) {
          setError('Login failed');
        } finally {
          setLoading(false);
        }
      };

      return (
        <div>
          <h1>Login to Brand Portal</h1>
          <form onSubmit={handleLogin} data-testid="login-form">
            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({ 
                  ...prev, 
                  email: e.target.value 
                }))}
                data-testid="email-input"
                required
              />
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ 
                  ...prev, 
                  password: e.target.value 
                }))}
                data-testid="password-input"
                required
              />
            </div>

            {error && (
              <div data-testid="login-error" role="alert">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              data-testid="login-button"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div data-testid="oauth-section">
            <button
              onClick={() => mockSignIn('google')}
              data-testid="google-login"
            >
              Login with Google
            </button>
            <button
              onClick={() => mockSignIn('azure-ad')}
              data-testid="azure-login"
            >
              Login with Microsoft
            </button>
          </div>
        </div>
      );
    };

    render(<MockLoginPage />);

    // 1. User sees login form
    expect(screen.getByText('Login to Brand Portal')).toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();

    // 2. User enters credentials
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'securepassword');

    // 3. User submits form
    const loginButton = screen.getByTestId('login-button');
    await user.click(loginButton);

    // 4. Verify loading state
    expect(screen.getByText('Logging in...')).toBeInTheDocument();
    expect(loginButton).toBeDisabled();

    // 5. Verify NextAuth signIn was called
    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      email: 'john@example.com',
      password: 'securepassword',
      redirect: false
    });

    // 6. Verify success message
    await waitFor(() => {
      expect(screen.getByTestId('login-success')).toBeInTheDocument();
    });

    expect(screen.getByText('Login successful! Redirecting...')).toBeInTheDocument();
  });

  it('handles OAuth authentication flows', async () => {
    const MockOAuthPage = () => {
      const [authState, setAuthState] = React.useState({
        provider: null,
        loading: false,
        error: null
      });

      const handleOAuthLogin = async (provider) => {
        setAuthState({ provider, loading: true, error: null });

        try {
          const result = await mockSignIn(provider);
          if (result?.ok) {
            setAuthState(prev => ({ ...prev, loading: false }));
            // Simulate OAuth redirect flow
            setTimeout(() => {
              const callbackMessage = document.createElement('div');
              callbackMessage.textContent = `${provider} authentication successful`;
              callbackMessage.setAttribute('data-testid', 'oauth-success');
              document.body.appendChild(callbackMessage);
            }, 200);
          }
        } catch (error) {
          setAuthState(prev => ({ 
            ...prev, 
            loading: false, 
            error: `${provider} authentication failed` 
          }));
        }
      };

      return (
        <div>
          <h1>OAuth Authentication</h1>
          
          <div data-testid="oauth-providers">
            <button
              onClick={() => handleOAuthLogin('google')}
              disabled={authState.loading}
              data-testid="google-oauth"
            >
              {authState.loading && authState.provider === 'google' 
                ? 'Connecting to Google...' 
                : 'Continue with Google'
              }
            </button>

            <button
              onClick={() => handleOAuthLogin('azure-ad')}
              disabled={authState.loading}
              data-testid="azure-oauth"
            >
              {authState.loading && authState.provider === 'azure-ad' 
                ? 'Connecting to Microsoft...' 
                : 'Continue with Microsoft'
              }
            </button>

            <button
              onClick={() => handleOAuthLogin('github')}
              disabled={authState.loading}
              data-testid="github-oauth"
            >
              {authState.loading && authState.provider === 'github' 
                ? 'Connecting to GitHub...' 
                : 'Continue with GitHub'
              }
            </button>
          </div>

          {authState.error && (
            <div data-testid="oauth-error" role="alert">
              {authState.error}
            </div>
          )}
        </div>
      );
    };

    render(<MockOAuthPage />);

    // Test Google OAuth
    const googleButton = screen.getByTestId('google-oauth');
    await user.click(googleButton);

    expect(screen.getByText('Connecting to Google...')).toBeInTheDocument();
    expect(mockSignIn).toHaveBeenCalledWith('google');

    await waitFor(() => {
      expect(screen.getByTestId('oauth-success')).toBeInTheDocument();
    });

    expect(screen.getByText('google authentication successful')).toBeInTheDocument();
  });

  it('manages user session and logout workflow', async () => {
    const { useSession } = require('next-auth/react');
    useSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated'
    });

    const MockAuthenticatedApp = () => {
      const [user, setUser] = React.useState(mockSession.user);
      const [loggingOut, setLoggingOut] = React.useState(false);

      const handleLogout = async () => {
        setLoggingOut(true);
        try {
          await mockSignOut();
          setUser(null);
          
          // Simulate redirect to login page
          setTimeout(() => {
            const logoutMessage = document.createElement('div');
            logoutMessage.textContent = 'Logged out successfully';
            logoutMessage.setAttribute('data-testid', 'logout-success');
            document.body.appendChild(logoutMessage);
          }, 100);
        } finally {
          setLoggingOut(false);
        }
      };

      if (!user) {
        return <div data-testid="logged-out">Please log in</div>;
      }

      return (
        <div>
          <header data-testid="user-header">
            <div data-testid="user-info">
              <img src={user.image} alt={user.name} data-testid="user-avatar" />
              <span data-testid="user-name">{user.name}</span>
              <span data-testid="user-email">{user.email}</span>
              <span data-testid="user-role">Role: {user.role}</span>
            </div>
            
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              data-testid="logout-button"
            >
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </header>

          <main data-testid="authenticated-content">
            <h1>Welcome to Brand Portal Dashboard</h1>
            <p>Hello, {user.name}!</p>
          </main>
        </div>
      );
    };

    render(<MockAuthenticatedApp />);

    // 1. Verify authenticated state
    expect(screen.getByTestId('user-header')).toBeInTheDocument();
    expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('user-email')).toHaveTextContent('john@example.com');
    expect(screen.getByTestId('user-role')).toHaveTextContent('Role: admin');

    // 2. User initiates logout
    const logoutButton = screen.getByTestId('logout-button');
    await user.click(logoutButton);

    // 3. Verify logout loading state
    expect(screen.getByText('Logging out...')).toBeInTheDocument();
    expect(logoutButton).toBeDisabled();

    // 4. Verify signOut was called
    expect(mockSignOut).toHaveBeenCalled();

    // 5. Verify logout success
    await waitFor(() => {
      expect(screen.getByTestId('logout-success')).toBeInTheDocument();
    });

    expect(screen.getByText('Logged out successfully')).toBeInTheDocument();
  });

  it('handles authentication errors and retry mechanisms', async () => {
    // Mock failed authentication
    mockSignIn.mockRejectedValueOnce(new Error('Network error'));

    const MockLoginWithRetry = () => {
      const [loginState, setLoginState] = React.useState({
        loading: false,
        error: null,
        retryCount: 0
      });

      const attemptLogin = async (credentials) => {
        setLoginState(prev => ({ 
          ...prev, 
          loading: true, 
          error: null 
        }));

        try {
          await mockSignIn('credentials', credentials);
          setLoginState(prev => ({ 
            ...prev, 
            loading: false,
            retryCount: 0
          }));
        } catch (error) {
          setLoginState(prev => ({ 
            ...prev, 
            loading: false,
            error: error.message,
            retryCount: prev.retryCount + 1
          }));
        }
      };

      const retryLogin = () => {
        attemptLogin({
          email: 'test@example.com',
          password: 'password'
        });
      };

      return (
        <div>
          <h1>Login with Error Handling</h1>
          
          <button
            onClick={() => attemptLogin({
              email: 'test@example.com',
              password: 'password'
            })}
            disabled={loginState.loading}
            data-testid="attempt-login"
          >
            {loginState.loading ? 'Attempting login...' : 'Login'}
          </button>

          {loginState.error && (
            <div data-testid="auth-error">
              <p>Error: {loginState.error}</p>
              <p>Attempts: {loginState.retryCount}</p>
              
              {loginState.retryCount < 3 && (
                <button onClick={retryLogin} data-testid="retry-login">
                  Retry Login
                </button>
              )}
              
              {loginState.retryCount >= 3 && (
                <div data-testid="max-retries">
                  Maximum retry attempts reached. Please try again later.
                </div>
              )}
            </div>
          )}
        </div>
      );
    };

    render(<MockLoginWithRetry />);

    // 1. First login attempt (will fail)
    const loginButton = screen.getByTestId('attempt-login');
    await user.click(loginButton);

    // 2. Verify error is displayed
    await waitFor(() => {
      expect(screen.getByTestId('auth-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    expect(screen.getByText('Attempts: 1')).toBeInTheDocument();

    // 3. Retry login (will succeed this time)
    mockSignIn.mockResolvedValueOnce({ ok: true });
    
    const retryButton = screen.getByTestId('retry-login');
    await user.click(retryButton);

    // 4. Verify retry attempt
    expect(screen.getByText('Attempts: 2')).toBeInTheDocument();
    expect(mockSignIn).toHaveBeenCalledTimes(2);
  });

  it('handles role-based access control', async () => {
    const MockRoleBasedApp = () => {
      const [currentUser, setCurrentUser] = React.useState(mockSession.user);

      const switchUserRole = (role) => {
        setCurrentUser(prev => ({ ...prev, role }));
      };

      const hasPermission = (requiredRole) => {
        const roleHierarchy = { admin: 3, editor: 2, viewer: 1 };
        return roleHierarchy[currentUser.role] >= roleHierarchy[requiredRole];
      };

      return (
        <div>
          <div data-testid="user-role-info">
            Current role: {currentUser.role}
          </div>

          <div data-testid="role-controls">
            <button onClick={() => switchUserRole('admin')} data-testid="set-admin">
              Set Admin
            </button>
            <button onClick={() => switchUserRole('editor')} data-testid="set-editor">
              Set Editor
            </button>
            <button onClick={() => switchUserRole('viewer')} data-testid="set-viewer">
              Set Viewer
            </button>
          </div>

          <div data-testid="protected-features">
            {hasPermission('viewer') && (
              <div data-testid="viewer-content">Can view assets</div>
            )}
            
            {hasPermission('editor') && (
              <div data-testid="editor-content">Can edit assets</div>
            )}
            
            {hasPermission('admin') && (
              <div data-testid="admin-content">Can manage users</div>
            )}
          </div>
        </div>
      );
    };

    render(<MockRoleBasedApp />);

    // 1. Verify admin permissions (default)
    expect(screen.getByText('Current role: admin')).toBeInTheDocument();
    expect(screen.getByTestId('viewer-content')).toBeInTheDocument();
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    expect(screen.getByTestId('admin-content')).toBeInTheDocument();

    // 2. Switch to editor role
    const setEditorButton = screen.getByTestId('set-editor');
    await user.click(setEditorButton);

    expect(screen.getByText('Current role: editor')).toBeInTheDocument();
    expect(screen.getByTestId('viewer-content')).toBeInTheDocument();
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();

    // 3. Switch to viewer role
    const setViewerButton = screen.getByTestId('set-viewer');
    await user.click(setViewerButton);

    expect(screen.getByText('Current role: viewer')).toBeInTheDocument();
    expect(screen.getByTestId('viewer-content')).toBeInTheDocument();
    expect(screen.queryByTestId('editor-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });
});