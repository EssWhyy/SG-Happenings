import React, { useState } from 'react';
import { Box, Fab, SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close'; // Useful to show an 'X' when active
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalParkIcon from '@mui/icons-material/Park';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';

const filterActions = [
  { icon: <RestaurantIcon />, name: 'Food & Dining', id: 'food' },
  { icon: <LocalParkIcon />, name: 'Parks & Nature', id: 'parks' },
  { icon: <ShoppingBagIcon />, name: 'Shopping', id: 'shopping' },
];

interface MapControlsProps {
  addEventMode: boolean;
  onToggleAddEventMode: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({ 
  addEventMode, 
  onToggleAddEventMode 
}) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleFilterClick = (id: string) => {
    console.log(`Filter clicked: ${id}`);
    handleClose();
  };

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
      {/* Filter Expandable Button */}
      <SpeedDial
        ariaLabel="Map Filters"
        icon={<SpeedDialIcon icon={<FilterListIcon />} />}
        onClose={handleClose}
        onOpen={handleOpen}
        open={open}
        direction="up"
        FabProps={{
          color: 'primary',
          size: 'medium',
        }}
      >
        {filterActions.map((action) => (
          <SpeedDialAction
            key={action.id}
            icon={action.icon}
            slotProps={{
                tooltip: {
                title: action.name,
                },
            }}
            onClick={() => handleFilterClick(action.id)}
          />
        ))}
      </SpeedDial>

      {/* Dynamic Add Button */}
      <Fab 
        color={addEventMode ? 'error' : 'secondary'} // Turns red when active
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