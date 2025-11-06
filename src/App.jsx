
import React from 'react';
import { InventoryProvider } from './context/InventoryContext';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Closing from './pages/Closing';
import Items from './pages/Items';
import Purchases from './pages/Purchases';
// import Returns from './pages/Returns';
import ReturnsStore from './pages/ReturnsStore';
import ReturnsStore2 from './pages/ReturnsStore2';
import Warehouse from './pages/Warehouse';
import Transfers from './pages/Transfers';
import Store from './pages/Store';
import Store2 from './pages/Store2';
import Sales from './pages/Sales';
import SalesStore2 from './pages/SalesStore2';
import Customers from './pages/Customers';
import Expenses from './pages/Expenses';
import PartsRequests from './pages/PartsRequests';
import PartsInventory from './pages/PartsInventory';
import Settings from './pages/Settings';
import Technicians from './pages/Technicians';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import UsersList from './pages/UsersList';
import Documents from './pages/Documents';
import Time from './pages/Time';
import Sheets from './pages/Sheets';
import ChecklistEnhanced from './pages/ChecklistEnhanced';
import ChecklistReports from './pages/ChecklistReports';
import InventoryBoxes from './pages/InventoryBoxes';
import BiometricKiosk from './pages/BiometricKiosk';
import BiometricManagement from './pages/BiometricManagement';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { Box, Toolbar, CssBaseline } from '@mui/material';

const drawerWidth = 260;



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
  const hideSidebar = location.pathname === '/login' || location.pathname === '/biometric-kiosk';

  const navigate = useNavigate();


  return (
    <InventoryProvider>
      <InventoryInitializer />
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        {!hideSidebar && <Sidebar />}
        <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
          <Routes>
            <Route path="/login" element={<Login onLogin={() => navigate('/')} />} />
            <Route path="/biometric-kiosk" element={<BiometricKiosk />} />
            <Route path="/biometric-management" element={<ProtectedRoute roles={["admin", "manager"]}><BiometricManagement /></ProtectedRoute>} />
            <Route path="/settings/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><UsersList /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/items" element={<ProtectedRoute permission={{ section: 'items', action: 'view' }}><Items /></ProtectedRoute>} />
            <Route path="/inventory-boxes" element={<ProtectedRoute permission={{ section: 'inventoryBoxes', action: 'view' }}><InventoryBoxes /></ProtectedRoute>} />
            <Route path="/checklists" element={<ProtectedRoute><ChecklistEnhanced /></ProtectedRoute>} />
            <Route path="/checklist-reports" element={<ProtectedRoute><ChecklistReports /></ProtectedRoute>} />
            <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
            {/* <Route path="/returns" element={<ProtectedRoute><Returns /></ProtectedRoute>} /> */}
            <Route path="/returns-store" element={<ProtectedRoute><ReturnsStore /></ProtectedRoute>} />
            <Route path="/returns-store2" element={<ProtectedRoute><ReturnsStore2 /></ProtectedRoute>} />
            <Route path="/warehouse" element={<ProtectedRoute><Warehouse /></ProtectedRoute>} />
            {/* Require explicit permission to view Transfers */}
            <Route
              path="/transfers"
              element={
                <ProtectedRoute permission={{ section: 'transfers', action: 'view' }}>
                  <Transfers />
                </ProtectedRoute>
              }
            />
            <Route path="/store" element={<ProtectedRoute><Store /></ProtectedRoute>} />
            <Route path="/store2" element={<ProtectedRoute><Store2 /></ProtectedRoute>} />
            <Route
              path="/sales"
              element={
                <ProtectedRoute permission={{ section: 'sales', action: 'view' }}>
                  <Sales />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales-store2"
              element={
                <ProtectedRoute permission={{ section: 'sales', action: 'view' }}>
                  <SalesStore2 />
                </ProtectedRoute>
              }
            />
            <Route path="/parts-inventory" element={<ProtectedRoute><PartsInventory /></ProtectedRoute>} />
            <Route path="/parts-requests" element={<ProtectedRoute><PartsRequests /></ProtectedRoute>} />
            <Route 
              path="/sheets" 
              element={
                <ProtectedRoute permission={{ section: 'purchaseSheets', action: 'view' }}>
                  <Sheets />
                </ProtectedRoute>
              } 
            />
            <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/time" element={<ProtectedRoute><Time /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route
              path="/technicians"
              element={
                <ProtectedRoute permission={{ section: 'technicians', action: 'view' }}>
                  <Technicians />
                </ProtectedRoute>
              }
            />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/closing/store1" element={<ProtectedRoute><Closing storeType="store1" /></ProtectedRoute>} />
            <Route path="/closing/store2" element={<ProtectedRoute><Closing storeType="store2" /></ProtectedRoute>} />
          </Routes>
        </Box>
      </Box>
    </InventoryProvider>
  );
}

export default App;
