// components/LoginModal.tsx
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
        Login
      </DialogTitle>

      <DialogContent sx={{ py: 1 }}>
        {auth.isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
              Loading authentication state...
            </Typography>
          </Box>
        ) : auth.error ? (
          <Alert severity="error" sx={{ my: 1 }}>
            Authentication error: {auth.error.message}
          </Alert>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Sign in securely via AWS Cognito to manage bookmarks and listings.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 2, pt: 1 }}>
        <Button
          variant="contained"
          disabled={auth.isLoading}
          onClick={() => auth.signinRedirect()}
          sx={{
            px: 4,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Sign In with Cognito
        </Button>
      </DialogActions>
    </Dialog>
  );
}