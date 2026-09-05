import React, { useState } from 'react';
import { Box, Fab, SpeedDial, SpeedDialAction, SpeedDialIcon, Badge, Tooltip } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';

export interface OverlayConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  active: boolean;
}

interface MapControlsProps {
  addEventMode: boolean;
  onToggleAddEventMode: () => void;
  overlays: OverlayConfig[];
  onToggleOverlay: (id: string) => void;
}

export const MapControls: React.FC<MapControlsProps> = ({ 
  addEventMode, 
  onToggleAddEventMode,
  overlays,
  onToggleOverlay,
}) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Extract the user filter to render as a dedicated standalone button
  const myNodesOverlay = overlays.find((o) => o.id === 'myNodesOnly');
  
  // Keep map overlays (MRT, Parks, Food, etc.) inside the SpeedDial
  const mapOverlays = overlays.filter((o) => o.id !== 'myNodesOnly');
  const activeOverlayCount = mapOverlays.filter((o) => o.active).length;

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 2,
      }}
    >
      {/* Dynamic Extensible Map Overlays SpeedDial */}
      <SpeedDial
        ariaLabel="Map Overlays"
        icon={
          <Badge badgeContent={activeOverlayCount} color="error">
            <SpeedDialIcon icon={<FilterListIcon />} />
          </Badge>
        }
        onClose={handleClose}
        onOpen={handleOpen}
        open={open}
        direction="up"
        FabProps={{
          color: 'primary',
          size: 'medium',
        }}
      >
        {mapOverlays.map((overlay) => (
          <SpeedDialAction
            key={overlay.id}
            icon={overlay.icon}
            slotProps={{
              tooltip: {
                title: `${overlay.active ? 'Hide' : 'Show'} ${overlay.name}`,
              },
            }}
            onClick={() => onToggleOverlay(overlay.id)}
            sx={{
              backgroundColor: overlay.active ? 'primary.light' : 'background.paper',
              color: overlay.active ? 'primary.contrastText' : 'text.primary',
              '&:hover': {
                backgroundColor: overlay.active ? 'primary.main' : 'action.hover',
              },
            }}
          />
        ))}
      </SpeedDial>

      {/* Dedicated Standalone "My Posts" Button */}
      {myNodesOverlay && (
        <Tooltip title={myNodesOverlay.active ? "Show All Posts" : "Show My Posts Only"}>
          <Fab
            color={myNodesOverlay.active ? 'primary' : 'default'}
            size="medium"
            aria-label="filter my posts"
            onClick={() => onToggleOverlay('myNodesOnly')}
            sx={{
              backgroundColor: myNodesOverlay.active ? '#1976d2' : '#ffffff',
              color: myNodesOverlay.active ? '#ffffff' : '#424242',
              '&:hover': {
                backgroundColor: myNodesOverlay.active ? '#1565c0' : '#f5f5f5',
              },
            }}
          >
            <PersonIcon />
          </Fab>
        </Tooltip>
      )}

      {/* Dynamic Add Button */}
      <Fab 
        color={addEventMode ? 'error' : 'secondary'}
        size="medium" 
        aria-label="add location"
        onClick={onToggleAddEventMode}
      >
        {addEventMode ? <CloseIcon /> : <AddIcon />}
      </Fab>
    </Box>
  );
};

export default MapControls;