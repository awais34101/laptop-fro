
import React from 'react';
import { InventoryProvider } from './context/InventoryContext';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import Purchases from './pages/Purchases';
import Warehouse from './pages/Warehouse';
import Transfers from './pages/Transfers';
import Store from './pages/Store';
import Store2 from './pages/Store2';
import Sales from './pages/Sales';
import SalesStore2 from './pages/SalesStore2';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import Technicians from './pages/Technicians';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import UsersList from './pages/UsersList';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { Box, Toolbar, CssBaseline } from '@mui/material';

const drawerWidth = 220;



import { useInventory } from './context/InventoryContext';
import { useEffect } from 'react';

// This component will trigger fetchInventory on app load if logged in
function InventoryInitializer() {
  const token = localStorage.getItem('token');
  const { fetchInventory } = useInventory();
  useEffect(() => {
    if (token && fetchInventory) {
      fetchInventory();
    }
  }, [token, fetchInventory]);
  return null;
}

function App() {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Hide sidebar on login page
  const hideSidebar = location.pathname === '/login';

  const navigate = useNavigate();


  return (
    <InventoryProvider>
      <InventoryInitializer />
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        {!hideSidebar && <Sidebar />}
        <Box component="main" sx={{ flexGrow: 1, p: 3, ml: !hideSidebar ? `${drawerWidth}px` : 0 }}>
          {!hideSidebar && <Toolbar />}
          <Routes>
            <Route path="/login" element={<Login onLogin={() => navigate('/')} />} />
            <Route path="/settings/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><UsersList /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/items" element={<ProtectedRoute><Items /></ProtectedRoute>} />
            <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
            <Route path="/warehouse" element={<ProtectedRoute><Warehouse /></ProtectedRoute>} />
            <Route path="/transfers" element={<ProtectedRoute><Transfers /></ProtectedRoute>} />
            <Route path="/store" element={<ProtectedRoute><Store /></ProtectedRoute>} />
            <Route path="/store2" element={<ProtectedRoute><Store2 /></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
            <Route path="/sales-store2" element={<ProtectedRoute><SalesStore2 /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/technicians" element={<ProtectedRoute><Technicians /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          </Routes>
        </Box>
      </Box>
    </InventoryProvider>
  );
}

export default App;
