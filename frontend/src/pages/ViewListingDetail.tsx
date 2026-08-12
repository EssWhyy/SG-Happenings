import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Paper,
  CardMedia,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import PersonOutlineIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubble';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';

import type { Listing } from '../../../shared/apiContract';

interface ViewListingDetailProps {
  selectedListing?: Listing | null;
  cognitoUserId: string;
  onEditListing?: (listing: Listing) => void;
  onClose?: () => void;
  onChat?: (listing: Listing) => void;
  onBookmark?: (listing: Listing) => void;
  onReport?: (listing: Listing) => void;
}

export default function ViewListingDetail({
  selectedListing,
  cognitoUserId,
  onEditListing,
  onClose,
  onChat,
  onBookmark,
  onReport,
}: ViewListingDetailProps) {
  if (!selectedListing) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No listing selected.</Typography>
      </Box>
    );
  }

  const isAuthor = selectedListing.authorId === cognitoUserId;
  const coordinatesText =
    selectedListing.latitude !== undefined && selectedListing.longitude !== undefined
      ? `(${selectedListing.latitude}, ${selectedListing.longitude})`
      : selectedListing.district || 'Location unavailable';

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 480,
        mx: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {/* Top Navigation Bar: Close & Edit */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <IconButton onClick={onClose} aria-label="close" size="small">
          <CloseIcon />
        </IconButton>

        {isAuthor && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => onEditListing && onEditListing(selectedListing)}
            sx={{ textTransform: 'none' }}
          >
            Edit
          </Button>
        )}
      </Box>

      {/* Media Image / Placeholder */}
      <Box
        sx={{
          width: '100%',
          height: 200,
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {selectedListing.image ? (
          <CardMedia
            component="img"
            image={selectedListing.image}
            alt={selectedListing.title}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              color: 'text.secondary',
            }}
          >
            <ImageNotSupportedOutlinedIcon sx={{ fontSize: 40 }} />
            <Typography variant="body2">Picture if any (else blank placeholder)</Typography>
          </Box>
        )}
      </Box>

      {/* (Type) + Title */}
      <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
        ({selectedListing.type}) {selectedListing.title}
      </Typography>

      {/* Author & Date / Time */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: 3,
          alignItems: 'center',
          color: 'text.secondary',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5, alignItems: 'center' }}>
          <PersonOutlineIcon fontSize="small" />
          <Typography variant="body2">
            {selectedListing.contact || selectedListing.authorId}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5, alignItems: 'center' }}>
          <CalendarTodayIcon fontSize="small" />
          <Typography variant="body2">
            {selectedListing.expiryDate
              ? new Date(selectedListing.expiryDate).toLocaleDateString()
              : 'N/A'}
          </Typography>
        </Box>
      </Box>

      {/* Location */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: 0.5,
          alignItems: 'center',
          color: 'text.secondary',
        }}
      >
        <LocationOnOutlinedIcon fontSize="small" />
        <Typography variant="body2">{coordinatesText}</Typography>
      </Box>

      {/* Action Buttons: Chat & Bookmark */}
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mt: 0.5 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<ChatBubbleOutlineIcon />}
          onClick={() => onChat && onChat(selectedListing)}
          sx={{ textTransform: 'none', py: 1 }}
        >
          Chat
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<BookmarkBorderIcon />}
          onClick={() => onBookmark && onBookmark(selectedListing)}
          sx={{ textTransform: 'none', py: 1 }}
        >
          Bookmark
        </Button>
      </Box>

      {/* Description Section */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          minHeight: 180,
          borderRadius: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Description
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {selectedListing.description || 'No description provided.'}
        </Typography>
      </Paper>

      {/* Report Event Button */}
      <Button
        fullWidth
        variant="outlined"
        color="error"
        startIcon={<WarningAmberIcon />}
        onClick={() => onReport && onReport(selectedListing)}
        sx={{ textTransform: 'none', py: 1, mt: 1 }}
      >
        Report Event
      </Button>
    </Box>
  );
}