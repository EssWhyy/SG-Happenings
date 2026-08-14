import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Divider,
  Stack,
  Tabs,
  Tab,
  Paper,
  Chip,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  CardMedia,
  Alert
} from '@mui/material';

import DeleteOutlineIcon from '@mui/icons-material/Delete';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PersonOutlineIcon from '@mui/icons-material/Person';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';

import type { Listing, User } from '../../../shared/apiContract';
import { useAuth } from 'react-oidc-context';
interface BookmarkDirectoryViewProps {
  backendUrl: string;
  cognitoUserId: string;
  listings: Listing[];
  setListings: React.Dispatch<React.SetStateAction<Listing[]>>;
  onSelectListing?: (listing: Listing) => void;
  onEditListing?: (listing: Listing) => void;
  setStatusMessage?: (msg: string) => void;
  onOpenLogin?: () => void;
}

export default function BookmarkDirectoryView({
  backendUrl,
  cognitoUserId,
  listings,
  setListings,
  onSelectListing,
  onEditListing,
  setStatusMessage,
  onOpenLogin

}: BookmarkDirectoryViewProps) {
  const [activeTab, setActiveTab] = useState<'listings' | 'users'>('listings');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [showOnlyMyListings, setShowOnlyMyListings] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const auth = useAuth();

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/debug/users`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data: User[] = await res.json();
      setUsers(data);
      if (setStatusMessage) setStatusMessage('Users synced successfully.');
    } catch (err) {
      console.error('[BookmarkView] Fetch users error:', err);
      setErrorMessage('Failed to pull user records.');
      if (setStatusMessage) setStatusMessage('Failed to pull user records.');
    }
  }, [backendUrl, setStatusMessage]);

  const filterListings = useCallback(async () => {
    try {
      let endpoint = `${backendUrl}/api/listings`;
      if (showOnlyMyListings && cognitoUserId) {
        endpoint = `${backendUrl}/api/users/${cognitoUserId}/listings`;
      } else if (selectedDistrict !== 'All') {
        endpoint = `${backendUrl}/api/listings/district/${selectedDistrict}`;
      } else if (selectedType !== 'All') {
        endpoint = `${backendUrl}/api/listings/type/${selectedType}`;
      }

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Network response was not ok');
      const data: Listing[] = await res.json();
      setListings(data);
      if (setStatusMessage) setStatusMessage('Listings synced successfully with AWS backend.');
    } catch (err) {
      console.error('[BookmarkView] Filter fetch error:', err);
      setErrorMessage('Failed to pull updated listing scopes from AWS.');
      if (setStatusMessage) setStatusMessage('Failed to pull updated listing scopes from AWS.');
    }
  }, [backendUrl, showOnlyMyListings, cognitoUserId, selectedDistrict, selectedType, setListings, setStatusMessage]);

  useEffect(() => {
    if (activeTab === 'listings') {
      filterListings();
    } else {
      fetchUsers();
    }
  }, [activeTab, filterListings, fetchUsers]);

  const handleDeleteListing = async (listingId: string, authorId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      const response = await fetch(`${backendUrl}/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorId })
      });

      if (!response.ok) throw new Error('Delete request rejected.');
      setListings(prev => prev.filter(item => item.id !== listingId));
    } catch (err) {
      console.error('[BookmarkView] Delete listing error:', err);
      setErrorMessage('Failed to delete listing.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(`Are you sure you want to delete user ${userId}?`)) return;
    try {
      const response = await fetch(`${backendUrl}/api/users/${userId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete user failed.');
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (err) {
      console.error('[BookmarkView] Delete user error:', err);
      setErrorMessage('Failed to delete user.');
    }
  };


    if (!auth.isAuthenticated) {
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            p: 4,
            bgcolor: '#ffffff',
            color: '#1e293b',
            boxSizing: 'border-box',
            gap: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a', maxWidth: '300px' }}>
            Please login to Bookmark listings on SG Happenings!
          </Typography>
          <Button
            variant="contained"
            onClick={onOpenLogin}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
            }}
          >
            Open Login
          </Button>
        </Box>
      );
    }
    
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#ffffff',
        color: '#1e293b',
        boxSizing: 'border-box',
      }}
    >
      {/* Header Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: '#e2e8f0', bgcolor: '#ffffff', px: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => {
            setActiveTab(val);
            setErrorMessage(null);
          }}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: '#64748b',
              minHeight: 48,
              '&.Mui-selected': { color: '#2563eb' },
            },
            '& .MuiTabs-indicator': { bgcolor: '#2563eb', height: 3 },
          }}
        >
          <Tab
            value="listings"
            icon={<Inventory2OutlinedIcon sx={{ fontSize: '1.2rem' }} />}
            iconPosition="start"
            label="Bookmarks & Listings"
          />
          <Tab
            value="users"
            icon={<PersonOutlineIcon sx={{ fontSize: '1.2rem' }} />}
            iconPosition="start"
            label="User Registry"
          />
        </Tabs>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        {activeTab === 'listings' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Filter Scope Panel */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                borderColor: '#e2e8f0',
                bgcolor: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', letterSpacing: 0.5 }}>
                FILTER SCOPE
              </Typography>

            <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ alignItems: { sm: 'center' } }}
            >
            <FormControl fullWidth size="small" disabled={showOnlyMyListings}>
                <InputLabel id="district-filter-label">District Target</InputLabel>
                <Select
                labelId="district-filter-label"
                value={selectedDistrict}
                label="District Target"
                onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setSelectedType('All');
                }}
                >
                <MenuItem value="All">All Regions</MenuItem>
                <MenuItem value="Central">Central</MenuItem>
                <MenuItem value="East">East</MenuItem>
                <MenuItem value="North">North</MenuItem>
                </Select>
            </FormControl>

            <FormControl fullWidth size="small" disabled={showOnlyMyListings}>
                <InputLabel id="type-filter-label">Classification</InputLabel>
                <Select
                labelId="type-filter-label"
                value={selectedType}
                label="Classification"
                onChange={(e) => {
                    setSelectedType(e.target.value);
                    setSelectedDistrict('All');
                }}
                >
                <MenuItem value="All">All Operations</MenuItem>
                <MenuItem value="Sale">Sale</MenuItem>
                <MenuItem value="Event">Event</MenuItem>
                <MenuItem value="Wanted">Wanted</MenuItem>
                </Select>
            </FormControl>
            </Stack>

              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={showOnlyMyListings}
                    onChange={(e) => {
                      setShowOnlyMyListings(e.target.checked);
                      setSelectedDistrict('All');
                      setSelectedType('All');
                    }}
                    sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#2563eb' } }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>
                    Show only my items
                  </Typography>
                }
                sx={{ m: 0 }}
              />
            </Paper>

            {/* Listings Section Header */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
              Listings ({listings.length} entries)
            </Typography>

            {/* Listings List */}
            {listings.length === 0 ? (
              <Box
                sx={{
                  py: 6,
                  textAlign: 'center',
                  bgcolor: '#f8fafc',
                  borderRadius: 2,
                  border: '1px dashed #cbd5e1',
                }}
              >
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  No listings match the current filters.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {listings.map((item) => {
                  const isOwner = item.authorId === cognitoUserId;
                  return (
                    <Card
                      key={item.id}
                      variant="outlined"
                      onClick={() => onSelectListing && onSelectListing(item)}
                      sx={{
                        borderRadius: 2,
                        cursor: 'pointer',
                        borderColor: isOwner ? '#93c5fd' : '#e2e8f0',
                        bgcolor: isOwner ? '#f8faff' : '#ffffff',
                        transition: 'box-shadow 0.2s, border-color 0.2s',
                        '&:hover': {
                          borderColor: '#3b82f6',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        },
                      }}
                    >
                      {item.image && (
                        <CardMedia
                          component="img"
                          height="140"
                          image={item.image}
                          alt={item.title}
                          sx={{ borderBottom: '1px solid #f1f5f9' }}
                        />
                      )}

                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                              {item.title}
                            </Typography>
                            <Chip
                              size="small"
                              label={`${item.type} • ${item.district}`}
                              sx={{
                                height: 22,
                                fontSize: '0.75rem',
                                bgcolor: '#eff6ff',
                                color: '#1d4ed8',
                                fontWeight: 600,
                              }}
                            />
                          </Box>

                          <Box
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isOwner && onEditListing && (
                              <IconButton
                                size="small"
                                onClick={() => onEditListing(item)}
                                sx={{ color: '#64748b', '&:hover': { color: '#2563eb', bgcolor: '#eff6ff' } }}
                              >
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteListing(item.id, item.authorId)}
                              sx={{ color: '#64748b', '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' } }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>

                        {item.description && (
                          <Typography variant="body2" sx={{ color: '#475569', mt: 1, lineHeight: 1.5 }}>
                            {item.description}
                          </Typography>
                        )}

                        <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#334155', fontWeight: 600 }}>
                          Contact: {item.contact}
                        </Typography>

                        <Divider sx={{ my: 1.25 }} />

                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                          ID: {item.id} • Author: {item.authorId}
                        </Typography>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
              Registered Users Directory ({users.length} entries)
            </Typography>

            {users.length === 0 ? (
              <Box
                sx={{
                  py: 6,
                  textAlign: 'center',
                  bgcolor: '#f8fafc',
                  borderRadius: 2,
                  border: '1px dashed #cbd5e1',
                }}
              >
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  No users found.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {users.map((u) => (
                  <Paper
                    key={u.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      borderColor: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: '#ffffff',
                    }}
                  >
                    <Box sx={{ overflow: 'hidden', pr: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }} noWrap>
                        {u.name || u.email}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b' }} noWrap>
                        {u.email}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.25 }}>
                        User ID: {u.id}
                      </Typography>
                    </Box>

                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={() => handleDeleteUser(u.id)}
                      sx={{ textTransform: 'none', fontWeight: 600, flexShrink: 0 }}
                    >
                      Delete
                    </Button>
                  </Paper>
                ))}
              </Stack>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}