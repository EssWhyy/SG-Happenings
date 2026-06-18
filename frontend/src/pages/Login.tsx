// pages/LoginPage.tsx
import { useAuth } from "react-oidc-context";
import { useEffect } from "react";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const auth = useAuth();

  // Automatically trigger the onLogin callback once react-oidc-context 
  // successfully authenticates the user after the redirect loop.
  useEffect(() => {
    if (auth.isAuthenticated) {
      onLogin();
    }
  }, [auth.isAuthenticated, onLogin]);

  if (auth.isLoading) {
    return <div className="login-container">Loading authentication state...</div>;
  }

  if (auth.error) {
    return <div className="login-container">Authentication error: {auth.error.message}</div>;
  }

  return (
    <div className="login-container">
      <h2>Login</h2>
      <p>Sign in securely via AWS Cognito</p>
      <button 
        className="submit-btn" 
        onClick={() => auth.signinRedirect()}
      >
        Sign In with Cognito
      </button>
    </div>
  );
}