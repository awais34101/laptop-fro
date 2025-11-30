import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Box, Divider, Button, Typography, Collapse, Avatar, Chip, useTheme, useMediaQuery } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import StoreIcon from '@mui/icons-material/Store';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ChecklistIcon from '@mui/icons-material/Checklist';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import TabletIcon from '@mui/icons-material/Tablet';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Link, useLocation } from 'react-router-dom';

const drawerWidth = 280;



const navSections = [
  {
    label: 'Main',
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/', perm: { section: 'dashboard', action: 'view' } },
      { text: 'Items', icon: <InventoryIcon />, path: '/items', perm: { section: 'items', action: 'view' } },
      { text: 'Inventory Boxes', icon: <InventoryIcon />, path: '/inventory-boxes', perm: { section: 'inventoryBoxes', action: 'view' } },
    ]
  },
  {
    label: 'Checklists',
    items: [
      { text: 'Checklists', icon: <ChecklistIcon />, path: '/checklists', perm: { section: 'checklists', action: 'view' } },
      { text: 'Checklist Reports', icon: <AssessmentIcon />, path: '/checklist-reports', perm: { section: 'checklists', action: 'view' } },
    ]
  },
  {
    label: 'Purchasing',
    items: [
      { text: 'Purchases', icon: <ShoppingCartIcon />, path: '/purchases', perm: { section: 'purchases', action: 'view' } },
      { text: 'Warehouse', icon: <StoreIcon />, path: '/warehouse', perm: { section: 'warehouse', action: 'view' } },
      { text: 'Transfers', icon: <CompareArrowsIcon />, path: '/transfers', perm: { section: 'transfers', action: 'view' } },
    ]
  },
  {
    label: 'Store 1',
    items: [
      { text: 'Store', icon: <StoreIcon />, path: '/store', perm: { section: 'store', action: 'view' } },
      { text: 'Returns Store', icon: <AssignmentReturnIcon />, path: '/returns-store', perm: { section: 'returnsStore', action: 'view' } },
      { text: 'Sales', icon: <PointOfSaleIcon />, path: '/sales', perm: { section: 'sales', action: 'view' } },
      { text: 'Closing', icon: <PointOfSaleIcon />, path: '/closing/store1', perm: { section: 'closingStore1', action: 'view' } },
    ]
  },
  {
    label: 'Store 2',
    items: [
      { text: 'Store2', icon: <StoreIcon />, path: '/store2', perm: { section: 'store2', action: 'view' } },
      { text: 'Returns Store2', icon: <AssignmentReturnIcon />, path: '/returns-store2', perm: { section: 'returnsStore2', action: 'view' } },
      { text: 'Sales Store2', icon: <PointOfSaleIcon />, path: '/sales-store2', perm: { section: 'salesStore2', action: 'view' } },
      { text: 'Closing', icon: <PointOfSaleIcon />, path: '/closing/store2', perm: { section: 'closingStore2', action: 'view' } },
    ]
  },
  {
    label: 'Parts',
    items: [
      { text: 'Parts Inventory', icon: <InventoryIcon />, path: '/parts-inventory', perm: { section: 'partsInventory', action: 'view' } },
      { text: 'Parts Requests', icon: <ShoppingCartIcon />, path: '/parts-requests', perm: { section: 'parts', action: 'view' } },
    ]
  },
  {
    label: 'Sheets',
    items: [
      { text: 'Purchase Sheets', icon: <AssignmentIcon />, path: '/sheets', perm: { section: 'purchaseSheets', action: 'view' } },
      { text: 'Transfer Sheets', icon: <CompareArrowsIcon />, path: '/transfer-sheets', perm: { section: 'transfers', action: 'view' } },
    ]
  },
  {
    label: 'Reports',
    items: [
      { text: 'Profit & Loss', icon: <TrendingUpIcon />, path: '/profit-loss', perm: { section: 'sales', action: 'view' } },
    ]
  },
  {
    label: 'Other',
    items: [
      { text: 'Documents', icon: <DescriptionIcon />, path: '/documents', perm: { section: 'documents', action: 'view' } },
      { text: 'Expenses', icon: <ShoppingCartIcon />, path: '/expenses', perm: { section: 'expenses', action: 'view' } },
      { text: 'Time', icon: <AccessTimeIcon />, path: '/time', perm: { section: 'time', action: 'view' } },
      { text: 'Biometric Kiosk', icon: <TabletIcon />, path: '/biometric-kiosk', perm: null, badge: 'iPad' },
      { text: 'Biometric Setup', icon: <FingerprintIcon />, path: '/biometric-management', perm: { section: 'users', action: 'edit' }, badge: 'Admin' },
      { text: 'Customers', icon: <PeopleIcon />, path: '/customers', perm: { section: 'customers', action: 'view' } },
      { text: 'Technicians', icon: <PeopleIcon />, path: '/technicians', perm: { section: 'technicians', action: 'view' } },
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings', perm: { section: 'settings', action: 'view' } },
    ]
  }
];

export default function Sidebar({ mobileOpen, onDrawerToggle }) {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const permissions = user.permissions || {};
  const isAdmin = user.role === 'admin';
  const token = localStorage.getItem('token');
  
  // State for collapsible sections
  const [openSections, setOpenSections] = useState({
    Main: true,
    Checklists: true,
    Purchasing: true,
    'Store 1': true,
    'Store 2': true,
    Parts: true,
    Sheets: true,
    Reports: true,
    Other: true
  });

  const toggleSection = (label) => {
    setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (!token) return null;

  const drawerContent = (
    <>
      {/* Header with Logo */}
      <Box 
        sx={{ 
          p: 0.5,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1, py: 0.5 }}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              fontWeight: 900,
              fontSize: '0.75rem'
            }}
          >
            💼
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: 0.5, color: '#fff', fontSize: '0.75rem', lineHeight: 1.1 }}>
              PRO CRM
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Avatar 
            sx={{ 
              width: 24, 
              height: 24,
              bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontWeight: 700,
              fontSize: '0.65rem',
              border: '1px solid rgba(255,255,255,0.3)'
            }}
          >
            {user.username?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
        </Box>
      </Box>
      
      <Box sx={{ overflow: 'auto', height: '100%', py: 2, px: 1.5 }}>
        <List sx={{ px: 0 }}>
          {navSections.map(section => {
            // Filter items by permission
            const visibleItems = section.items.filter(({ perm }) => {
              if (isAdmin) return true;
              if (!perm) return true;
              const { section: sec, action } = perm;
              return permissions[sec]?.[action];
            });
            if (visibleItems.length === 0) return null;
            
            const isOpen = openSections[section.label];
            
            return (
              <React.Fragment key={section.label}>
                {/* Section Header - Collapsible */}
                <ListItem
                  button
                  onClick={() => toggleSection(section.label)}
                  sx={{
                    py: 1,
                    px: 2,
                    mb: 0.5,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.05)',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <ListItemText 
                    primary={section.label}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: { 
                        color: '#90caf9', 
                        fontWeight: 800, 
                        letterSpacing: 1.5,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase'
                      }
                    }}
                  />
                  {isOpen ? <ExpandLess sx={{ color: '#90caf9', fontSize: '1.2rem' }} /> : <ExpandMore sx={{ color: '#90caf9', fontSize: '1.2rem' }} />}
                </ListItem>
                
                {/* Section Items */}
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {visibleItems.map(({ text, icon, path, badge }) => {
                      const isActive = location.pathname === path;
                      return (
                        <ListItem
                          button
                          key={text}
                          component={Link}
                          to={path}
                          sx={{
                            my: 0.3,
                            mx: 1,
                            px: 2,
                            py: 1.2,
                            borderRadius: 2,
                            background: isActive 
                              ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)'
                              : 'transparent',
                            border: isActive ? '1px solid rgba(102, 126, 234, 0.5)' : '1px solid transparent',
                            boxShadow: isActive ? '0 4px 12px rgba(102, 126, 234, 0.2)' : 'none',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              background: isActive 
                                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.4) 0%, rgba(118, 75, 162, 0.4) 100%)'
                                : 'rgba(255,255,255,0.08)',
                              transform: 'translateX(4px)',
                              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                            },
                            color: '#fff',
                          }}
                        >
                          <ListItemIcon 
                            sx={{ 
                              color: isActive ? '#90caf9' : 'rgba(255,255,255,0.8)', 
                              minWidth: 42,
                              '& .MuiSvgIcon-root': {
                                fontSize: '1.5rem',
                                filter: isActive ? 'drop-shadow(0 2px 4px rgba(144, 202, 249, 0.3))' : 'none'
                              }
                            }}
                          >
                            {icon}
                          </ListItemIcon>
                          <ListItemText 
                            primary={text} 
                            primaryTypographyProps={{
                              sx: { 
                                fontWeight: isActive ? 700 : 600,
                                fontSize: '0.95rem',
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.9)'
                              }
                            }}
                          />
                          {badge && (
                            <Chip
                              label={badge}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: badge === 'iPad' 
                                  ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                                  : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.3)',
                                ml: 1
                              }}
                            />
                          )}
                          {isActive && (
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)',
                                boxShadow: '0 0 8px rgba(144, 202, 249, 0.8)'
                              }}
                            />
                          )}
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          })}
          
          {/* Settings section extra links */}
          {location.pathname.startsWith('/settings') && (
            <Collapse in={true} timeout="auto">
              <List component="div" disablePadding>
                {user.role === 'admin' && (
                  <ListItem 
                    button 
                    component={Link} 
                    to="/admin/users" 
                    selected={location.pathname === '/admin/users'}
                    sx={{
                      my: 0.3,
                      mx: 1,
                      px: 2,
                      py: 1.2,
                      borderRadius: 2,
                      '&:hover': {
                        background: 'rgba(255,255,255,0.08)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)', minWidth: 42, '& .MuiSvgIcon-root': { fontSize: '1.5rem' } }}>
                      <PeopleIcon />
                    </ListItemIcon>
                    <ListItemText primary="Staff Management" primaryTypographyProps={{ sx: { fontSize: '1rem', fontWeight: 600 } }} />
                  </ListItem>
                )}
                <ListItem 
                  button 
                  component={Link} 
                  to="/settings/change-password" 
                  selected={location.pathname === '/settings/change-password'}
                  sx={{
                    my: 0.3,
                    mx: 1,
                    px: 2,
                    py: 1.2,
                    borderRadius: 2,
                    '&:hover': {
                      background: 'rgba(255,255,255,0.08)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)', minWidth: 42, '& .MuiSvgIcon-root': { fontSize: '1.5rem' } }}>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText primary="Change Password" primaryTypographyProps={{ sx: { fontSize: '1rem', fontWeight: 600 } }} />
                </ListItem>
              </List>
            </Collapse>
          )}
        </List>
      </Box>
      
      {/* Logout Button - Fixed at Bottom */}
      <Box 
        sx={{ 
          p: 2,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 100%)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Button
          variant="contained"
          fullWidth
          onClick={handleLogout}
          startIcon={<LogoutIcon sx={{ fontSize: '1.3rem' }} />}
          sx={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: '#fff',
            fontWeight: 700,
            py: 1.5,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(245, 87, 108, 0.4)',
            textTransform: 'none',
            fontSize: '1.05rem',
            '&:hover': {
              background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
              boxShadow: '0 6px 16px rgba(245, 87, 108, 0.5)',
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          Logout
        </Button>
      </Box>
    </>
  );

  return (
    <>
      {/* Desktop Drawer - Always visible */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
            color: '#fff',
            borderRight: 'none',
            boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Mobile Drawer - Toggleable */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
            color: '#fff',
            borderRight: 'none',
            boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
