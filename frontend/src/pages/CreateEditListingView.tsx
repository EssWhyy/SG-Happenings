import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Divider,
  Stack,
  Alert
} from '@mui/material';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';

import type { CreateEditListingResponse, Listing } from '../../../shared/apiContract';

interface CreateEditListingViewProps {
  backendUrl: string;
  cognitoUserId: string;
  selectedListing?: Listing | null;
  pendingCoords: { lat: number; lng: number } | null;
  listings: Listing[];
  setListings: React.Dispatch<React.SetStateAction<Listing[]>>;
  onSuccess?: (newListing: Listing) => void;
  onClose?: () => void;
  setStatusMessage?: (msg: string) => void;
}

const EMOJI_REGEX = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})*$/u;

export default function CreateEditListingView({
  backendUrl,
  cognitoUserId,
  selectedListing,
  pendingCoords,
  listings,
  setListings,
  onSuccess,
  onClose,
  setStatusMessage,
}: CreateEditListingViewProps) {
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Sale');
  const [contact, setContact] = useState('');
  const [district, setDistrict] = useState('Central');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📍');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearForm = () => {
    setEditingListingId(null);
    setTitle('');
    setType('Sale');
    setEmoji('📍');
    setContact('');
    setDistrict('Central');
    setDescription('');
    setSelectedFile(null);
    setImagePreview(null);
    setExistingImageUrl('');
    setErrorMessage(null);
  };

  useEffect(() => {
    if (selectedListing) {
      setEditingListingId(selectedListing.id);
      setTitle(selectedListing.title);
      setType(selectedListing.type);
      setEmoji(selectedListing.emoji || '📍');
      setContact(selectedListing.contact || '');
      setDistrict(selectedListing.district || 'Central');
      setDescription(selectedListing.description || '');
      setExistingImageUrl(selectedListing.image || '');
      setImagePreview(selectedListing.image || null);
      setSelectedFile(null);
    } else {
      clearForm();
    }
  }, [selectedListing]);

  const handleCancelOrClose = () => {
    clearForm();
    if (onClose) onClose();
  };

  const handleEmojiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || EMOJI_REGEX.test(value)) setEmoji(value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP).');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 5 MB limit.');
      e.target.value = '';
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setExistingImageUrl('');
  };

  const uploadImageToS3 = async (file: File): Promise<string> => {
    const res = await fetch(`${backendUrl}/api/s3/presigned-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileType: file.type }),
    });

    if (!res.ok) throw new Error('Failed to obtain presigned upload URL.');
    const { uploadUrl, cdnUrl } = await res.json();

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!uploadRes.ok) throw new Error('Failed to upload file to S3.');
    return cdnUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !contact) {
      setErrorMessage('Please fill out both Title and Contact fields.');
      return;
    }
    if (!editingListingId && !pendingCoords) {
      setErrorMessage('Please select a location on the map before creating a listing.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const currentListing = listings.find((item) => item.id === editingListingId);
    const latitude = pendingCoords ? pendingCoords.lat : (currentListing?.latitude ?? 1.3521);
    const longitude = pendingCoords ? pendingCoords.lng : (currentListing?.longitude ?? 103.8198);

    try {
      if (setStatusMessage) setStatusMessage('Deploying image to S3/CloudFront...');

      let imageUrl = existingImageUrl;
      if (selectedFile) imageUrl = await uploadImageToS3(selectedFile);

      if (editingListingId) {
        const payload = {
          title, type, contact, district, description,
          authorId: cognitoUserId, latitude, longitude, image: imageUrl
        };

        const response = await fetch(`${backendUrl}/api/listings/${editingListingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to update listing');
        const data: CreateEditListingResponse = await response.json();

        if (data.success) {
          setListings(prev => prev.map(item => item.id === editingListingId ? data.listing : item));
          clearForm();
          if (onSuccess) onSuccess(data.listing);
        }
      } else {
        const payload = {
          title, type, emoji: emoji || '📍', contact, district,
          description, authorId: cognitoUserId, latitude, longitude, image: imageUrl,
        };

        const response = await fetch(`${backendUrl}/api/listings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to create listing');
        const data: CreateEditListingResponse = await response.json();

        if (data.success) {
          clearForm();
          if (onSuccess) onSuccess(data.listing);
        }
      }
    } catch (err) {
      console.error('[Dashboard] Deploy error:', err);
      setErrorMessage('Error saving listing or uploading image to AWS.');
    } finally {
      setIsSubmitting(false);
      if (setStatusMessage) setStatusMessage('Listings synced successfully with AWS backend.');
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
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
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
          {editingListingId ? '✏️ Edit Listing' : '✨ Create New Listing'}
        </Typography>
        <IconButton
          size="small"
          onClick={handleCancelOrClose}
          aria-label="close"
          sx={{
            color: '#64748b',
            fontSize: '1rem',
            fontWeight: 'bold',
            lineHeight: 1,
            p: 0.75,
            '&:hover': { color: '#0f172a', bgcolor: '#f1f5f9' },
          }}
        >
          ✕
        </IconButton>
      </Box>

      <Divider />

      {/* Form Content Area with Scrolling */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 3,
          py: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.2,
        }}
      >
        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        {/* Image Upload Area */}
        <Box>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.75, fontWeight: 700, color: '#475569', letterSpacing: 0.5 }}>
            LISTING IMAGE (MAX 5MB)
          </Typography>

          {imagePreview ? (
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: 150,
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
              }}
            >
              <Box
                component="img"
                src={imagePreview}
                alt="Listing Preview"
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <IconButton
                size="small"
                onClick={handleRemoveImage}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(15, 23, 42, 0.75)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  p: 0.75,
                  '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.95)' },
                }}
              >
                ✕
              </IconButton>
            </Box>
          ) : (
            <Button
              component="label"
              variant="outlined"
              fullWidth
              startIcon={<CloudUploadIcon />}
              sx={{
                py: 2,
                borderStyle: 'dashed',
                borderWidth: 1.5,
                borderColor: '#cbd5e1',
                color: '#64748b',
                textTransform: 'none',
                fontWeight: 500,
                bgcolor: '#f8fafc',
                '&:hover': { borderColor: '#3b82f6', bgcolor: '#f0f9ff', borderStyle: 'dashed' },
              }}
            >
              Choose Image
              <input type="file" accept="image/*" hidden onChange={handleFileChange} />
            </Button>
          )}
        </Box>

        {/* Title and Icon Row */}
        <Stack direction="row" spacing={1.5}>
          <TextField
            label="Title"
            required
            fullWidth
            size="small"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            label="Icon"
            size="small"
            sx={{ width: 85 }}
            slotProps={{
              htmlInput: {
                maxLength: 2,
                style: { textAlign: 'center', fontSize: '1.2rem' },
              },
            }}
            placeholder="📍"
            value={emoji}
            onChange={handleEmojiChange}
          />
        </Stack>

        {/* Type & District Row */}
        <Stack direction="row" spacing={1.5}>
          <FormControl fullWidth size="small">
            <InputLabel id="type-select-label">Type</InputLabel>
            <Select
              labelId="type-select-label"
              value={type}
              label="Type"
              onChange={(e) => setType(e.target.value)}
            >
              <MenuItem value="Sale">Sale</MenuItem>
              <MenuItem value="Event">Event</MenuItem>
              <MenuItem value="Wanted">Wanted</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel id="district-select-label">District GRC</InputLabel>
            <Select
              labelId="district-select-label"
              value={district}
              label="District GRC"
              onChange={(e) => setDistrict(e.target.value)}
            >
              <MenuItem value="Central">Central</MenuItem>
              <MenuItem value="East">East</MenuItem>
              <MenuItem value="North">North</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Contact Routing */}
        <TextField
          label="Contact Routing Info"
          required
          fullWidth
          size="small"
          placeholder="e.g., @telegram_user / phone"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />

        {/* Description */}
        <TextField
          label="Description"
          multiline
          rows={4}
          fullWidth
          size="small"
          placeholder="Add details about this listing..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Box>

      <Divider />

      {/* Sticky Bottom Actions */}
      <Box
        sx={{
          px: 3,
          py: 2,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: '#ffffff',
        }}
      >
        <Button
          variant="text"
          disabled={isSubmitting}
          onClick={handleCancelOrClose}
          sx={{ textTransform: 'none', color: '#64748b', '&:hover': { color: '#0f172a' } }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          endIcon={<SendIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            px: 2.5,
            bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' },
          }}
        >
          {isSubmitting ? 'Saving...' : editingListingId ? 'Push Update Payload' : 'Deploy to Master DB'}
        </Button>
      </Box>
    </Box>
  );
}