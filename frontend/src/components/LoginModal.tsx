import React, { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Grow,
  Box,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>,
) {
  return <Grow ref={ref} {...props} />;
});

// Google SVG Icon component
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.41 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.13z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.59 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
      />
    </svg>
  );
}

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLogin?: () => void;
}

export default function LoginModal({ open, onClose, onLogin }: LoginModalProps) {
  const auth = useAuth();

  useEffect(() => {
    if (auth.isAuthenticated) {
      if (onLogin) onLogin();
      onClose();
    }
  }, [auth.isAuthenticated, onLogin, onClose]);

  const handleGoogleSignIn = () => {
    auth.signinRedirect({
      extraQueryParams: {
        identity_provider: 'Google',
      },
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slots={{
        transition: Transition,
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            p: 2,
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          },
        },
      }}
      keepMounted
      maxWidth="xs"
      fullWidth
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton onClick={onClose} size="small" aria-label="close">
          ✕
        </IconButton>
      </Box>

      <DialogTitle sx={{ pt: 0, fontWeight: 700, fontSize: '1.5rem' }}>
        Welcome Back
      </DialogTitle>

      <DialogContent sx={{ py: 1 }}>
        {auth.isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
              Authenticating...
            </Typography>
          </Box>
        ) : auth.error ? (
          <Alert severity="error" sx={{ my: 1 }}>
            Authentication error: {auth.error.message}
          </Alert>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Sign in to manage your bookmarks and saved listings.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ flexDirection: 'column', gap: 1.5, pb: 2, pt: 1, px: 3 }}>
        <Button
          fullWidth
          variant="outlined"
          disabled={auth.isLoading}
          startIcon={<GoogleIcon />}
          onClick={handleGoogleSignIn}
          sx={{
            py: 1.2,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            borderColor: '#dadce0',
            color: '#3c4043',
            backgroundColor: '#ffffff',
            '&:hover': {
              backgroundColor: '#f8f9fa',
              borderColor: '#dadce0',
            },
          }}
        >
          Sign in with Google
        </Button>

        <Divider sx={{ width: '100%', my: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            OR
          </Typography>
        </Divider>

        <Button
          fullWidth
          variant="contained"
          disabled={auth.isLoading}
          onClick={() => auth.signinRedirect()}
          sx={{
            py: 1.2,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Sign in with Cognito Hosted UI
        </Button>
      </DialogActions>
    </Dialog>
  );
}