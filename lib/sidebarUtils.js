/**
 * Utility functions for sidebar interactions
 */

// Adjust main content margin based on sidebar state
export function adjustMainContentMargin(collapsed) {
  if (typeof window !== 'undefined') {
    const mainContent = document.getElementById('main-content');
    const sidebar = document.getElementById('desktop-sidebar');
    
    if (mainContent) {
      if (collapsed) {
        // For collapsed sidebar - use exact pixels to prevent overlap
        mainContent.style.marginLeft = '5rem'; // 5rem = 80px (matches the w-20 class)
        // Ensure we rely on direct styling rather than Tailwind classes for this case
        mainContent.classList.remove('md:ml-64');
        
        // Store the previous state in localStorage for persistence
        localStorage.setItem('sidebarCollapsed', 'true');
      } else {
        // For expanded sidebar - revert to using Tailwind classes
        mainContent.style.marginLeft = ''; // Clear the inline style
        mainContent.classList.remove('md:ml-20');
        mainContent.classList.add('md:ml-64');
        
        // Store the previous state in localStorage for persistence
        localStorage.setItem('sidebarCollapsed', 'false');
      }
      
      // Trigger resize event to force any responsive components to update
      window.dispatchEvent(new Event('resize'));
    }
  }
}

// Get stored sidebar state from localStorage
export function getSavedSidebarState() {
  if (typeof window !== 'undefined') {
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState === 'true';
  }
  return false;
}