import { AuthProvider } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';

const cognitoAuthConfig = {  
  authority: "https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_8JmiWWMJZ",  
  client_id: "5lqa9a9o0nd3eb66uulika4ahs",  
  redirect_uri: "http://localhost:5173",  
  response_type: "code",  
  scope: "phone openid email",
};

export default function AuthProviderWithNavigate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const onSigninCallback = () => {
    // Clean up the URL query parameters (like ?code=...) using React Router after successful login
    navigate(window.location.pathname, { replace: true });
  };

  return (
    <AuthProvider {...cognitoAuthConfig} onSigninCallback={onSigninCallback}>
      {children}
    </AuthProvider>
  );
}