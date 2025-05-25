// Check login status
const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
const loginSignup = document.getElementById('loginSignup');
const profileSection = document.getElementById('profileSection');
const profileDropdown = document.getElementById('profileDropdown');
const profileButton = document.getElementById('profileButton');
const ctaLoggedOut = document.getElementById('ctaLoggedOut');
const ctaLoggedIn = document.getElementById('ctaLoggedIn');
const searchInput = document.getElementById('searchInput');

// Toggle search box
function toggleSearch() {
    if (searchInput && searchInput.classList.contains('w-0')) {
        searchInput.classList.remove('w-0');
        searchInput.classList.add('w-64');
        searchInput.focus();
    } else if (searchInput) {
        searchInput.classList.remove('w-64');
        searchInput.classList.add('w-0');
    }
}

// Close search box when clicking outside
document.addEventListener('click', (e) => {
    if (searchInput && !searchInput.contains(e.target) && !e.target.closest('button')) {
        searchInput.classList.remove('w-64');
        searchInput.classList.add('w-0');
    }
});

// Update navigation and CTA based on login status
if (isLoggedIn) {
    if (loginSignup) loginSignup.classList.add('hidden');
    if (profileSection) profileSection.classList.remove('hidden');
    if (ctaLoggedOut) ctaLoggedOut.classList.add('hidden');
    if (ctaLoggedIn) ctaLoggedIn.classList.remove('hidden');
} else {
    if (loginSignup) loginSignup.classList.remove('hidden');
    if (profileSection) profileSection.classList.add('hidden');
    if (ctaLoggedOut) ctaLoggedOut.classList.remove('hidden');
    if (ctaLoggedIn) ctaLoggedIn.classList.add('hidden');
}

// Toggle profile dropdown
if (profileButton) {
    profileButton.addEventListener('click', () => {
        if (profileDropdown) profileDropdown.classList.toggle('hidden');
    });
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (profileSection && !profileSection.contains(e.target)) {
        if (profileDropdown) profileDropdown.classList.add('hidden');
    }
});

// Handle logout
function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    window.location.reload();
}

// Handle login form submission
const loginForm = document.querySelector('form');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        localStorage.setItem('isLoggedIn', 'true');
        window.location.href = 'games.html';
    });
} 