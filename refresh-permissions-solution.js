// Add this function to UsersList.jsx if you want a refresh permissions feature

const refreshUserPermissions = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await api.get('/users/profile');
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.location.reload(); // Refresh to update UI
    }
  } catch (error) {
    console.error('Failed to refresh permissions:', error);
  }
};

// Add this button to the UI:
// <Button onClick={refreshUserPermissions} variant="outlined" sx={{ ml: 2 }}>
//   Refresh Permissions
// </Button>