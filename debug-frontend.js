// Frontend Debug Helper
// Copy and paste this into browser console on the Users page to debug

console.log('🔍 Frontend Debugging for Add Staff Issue');

// Check current user in localStorage
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
console.log('\n📋 Current User in localStorage:');
console.log('Name:', currentUser.name);
console.log('Email:', currentUser.email);
console.log('Role:', currentUser.role);
console.log('Permissions:', currentUser.permissions);
console.log('Users permissions:', currentUser.permissions?.users);
console.log('Has users.add permission:', !!currentUser.permissions?.users?.add);

// Check if Add Staff button should be visible
const shouldShowAddButton = !!currentUser.permissions?.users?.add;
console.log('\n🔘 Add Staff Button Visibility:');
console.log('Should show Add Staff button:', shouldShowAddButton);

// Check if Add Staff button actually exists in DOM
const addButton = document.querySelector('button:contains("Add Staff")') || 
                  Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Add Staff'));
console.log('Add Staff button found in DOM:', !!addButton);

if (addButton) {
  console.log('Add Staff button text:', addButton.textContent);
  console.log('Add Staff button visible:', !addButton.hidden && addButton.style.display !== 'none');
} else {
  console.log('❌ Add Staff button NOT found in DOM');
}

// Check API token
const token = localStorage.getItem('token');
console.log('\n🔑 Authentication:');
console.log('Has token:', !!token);
console.log('Token length:', token ? token.length : 0);

console.log('\n💡 Recommendations:');
if (!currentUser.permissions?.users?.add) {
  console.log('❌ Missing users.add permission - try refreshing the page or re-logging in');
}
if (!token) {
  console.log('❌ Missing authentication token - please login again');
}
if (currentUser.permissions?.users?.add && token) {
  console.log('✅ All permissions look good - try creating a staff user now');
}