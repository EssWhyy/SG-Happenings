import React, { useState } from 'react';
import { Box, Fab, SpeedDial, SpeedDialAction, SpeedDialIcon, Badge } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import TrainIcon from '@mui/icons-material/Train';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalParkIcon from '@mui/icons-material/Park';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';

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

  const activeOverlayCount = overlays.filter((o) => o.active).length;

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
      {/* Dynamic Extensible Overlays SpeedDial */}
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
      {overlays.map((overlay) => (
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