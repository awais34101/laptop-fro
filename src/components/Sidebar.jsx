import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Box, Divider, Button, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StoreIcon from '@mui/icons-material/Store';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import DescriptionIcon from '@mui/icons-material/Description';
import { Link, useLocation } from 'react-router-dom';

const drawerWidth = 220;


const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/', perm: { section: 'dashboard', action: 'view' } },
  { text: 'Items', icon: <InventoryIcon />, path: '/items', perm: { section: 'items', action: 'view' } },
  { text: 'Purchases', icon: <ShoppingCartIcon />, path: '/purchases', perm: { section: 'purchases', action: 'view' } },
  { text: 'Warehouse', icon: <StoreIcon />, path: '/warehouse', perm: { section: 'warehouse', action: 'view' } },
  { text: 'Transfers', icon: <CompareArrowsIcon />, path: '/transfers', perm: { section: 'transfers', action: 'view' } },
  { text: 'Store', icon: <StoreIcon />, path: '/store', perm: { section: 'store', action: 'view' } },
  { text: 'Store2', icon: <StoreIcon />, path: '/store2', perm: { section: 'store2', action: 'view' } },
  { text: 'Sales', icon: <PointOfSaleIcon />, path: '/sales', perm: { section: 'sales', action: 'view' } },
  { text: 'Sales Store2', icon: <PointOfSaleIcon />, path: '/sales-store2', perm: { section: 'sales', action: 'view' } },
  { text: 'Parts Inventory', icon: <InventoryIcon />, path: '/parts-inventory', perm: { section: 'partsInventory', action: 'view' } },
  { text: 'Parts Requests', icon: <ShoppingCartIcon />, path: '/parts-requests', perm: { section: 'parts', action: 'view' } },
  { text: 'Documents', icon: <DescriptionIcon />, path: '/documents', perm: { section: 'documents', action: 'view' } },
  { text: 'Expenses', icon: <ShoppingCartIcon />, path: '/expenses', perm: { section: 'expenses', action: 'view' } },
  { text: 'Customers', icon: <PeopleIcon />, path: '/customers', perm: { section: 'customers', action: 'view' } },
  { text: 'Technicians', icon: <PeopleIcon />, path: '/technicians', perm: { section: 'technicians', action: 'view' } },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings', perm: { section: 'settings', action: 'view' } },
];

export default function Sidebar() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const permissions = user.permissions || {};
  const isAdmin = user.role === 'admin';
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (!token) return null;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'linear-gradient(135deg, #1976d2 60%, #42a5f5 100%)',
          color: '#fff',
          borderRight: 'none',
        },
      }}
    >
      <Toolbar sx={{ minHeight: 64 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1, color: '#fff', mx: 'auto' }}>
          <span style={{ color: '#fff', fontWeight: 900 }}>PRO CRM</span>
        </Typography>
      </Toolbar>
      <Box sx={{ overflow: 'auto', height: '100%' }}>
        <List sx={{ mt: 2 }}>
          {navItems.filter(({ perm }) => {
            if (isAdmin) return true;
            if (!perm) return true;
            const { section, action } = perm;
            return permissions[section]?.[action];
          }).map(({ text, icon, path }) => (
            <ListItem
              button
              key={text}
              component={Link}
              to={path}
              selected={location.pathname === path}
              sx={{
                my: 0.5,
                borderRadius: 2,
                background: location.pathname === path ? 'rgba(255,255,255,0.12)' : 'none',
                '&:hover': {
                  background: 'rgba(255,255,255,0.18)',
                },
                color: '#fff',
              }}
            >
              <ListItemIcon sx={{ color: '#fff', minWidth: 36 }}>{icon}</ListItemIcon>
              <ListItemText primary={text} sx={{ '.MuiTypography-root': { fontWeight: location.pathname === path ? 700 : 500 } }} />
            </ListItem>
          ))}
          <Divider sx={{ my: 1 }} />
          {/* Settings section extra links */}
          {location.pathname.startsWith('/settings') && (
            <>
              {user.role === 'admin' && (
                <ListItem button component={Link} to="/admin/users" selected={location.pathname === '/admin/users'}>
                  <ListItemIcon><PeopleIcon /></ListItemIcon>
                  <ListItemText primary="Staff Management" />
                </ListItem>
              )}
              <ListItem button component={Link} to="/settings/change-password" selected={location.pathname === '/settings/change-password'}>
                <ListItemIcon><SettingsIcon /></ListItemIcon>
                <ListItemText primary="Change Password" />
              </ListItem>
            </>
          )}
          <Divider sx={{ my: 1 }} />
          <ListItem>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={handleLogout}
              sx={{
                color: '#fff',
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(156,39,176,0.12)',
                mt: 2,
              }}
            >
              Logout
            </Button>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
}
