/**
 * TEACHIT INDONESIA - DARK / LIGHT MODE SWITCHER MODULE
 * Uses localStorage to persist theme across sessions.
 */

document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtns = document.querySelectorAll('.theme-toggle');
  const currentTheme = localStorage.getItem('teachit_theme') || 'dark';

  // Apply stored theme on launch
  if (currentTheme === 'light') {
    document.body.classList.add('light-theme');
    updateThemeIcons('light');
  } else {
    document.body.classList.remove('light-theme');
    updateThemeIcons('dark');
  }

  // Add click listeners to all theme toggle buttons
  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      const newTheme = isLight ? 'light' : 'dark';
      
      localStorage.setItem('teachit_theme', newTheme);
      updateThemeIcons(newTheme);

      // Trigger optional toast notification
      if (window.showToast) {
        window.showToast(`Mode ${newTheme === 'light' ? 'Terang' : 'Gelap (Cyber)'} diaktifkan`, 'info');
      }
    });
  });

  /**
   * Updates font awesome icon depending on current active theme
   * @param {string} theme - 'light' or 'dark'
   */
  function updateThemeIcons(theme) {
    themeToggleBtns.forEach(btn => {
      const icon = btn.querySelector('i');
      if (icon) {
        if (theme === 'light') {
          icon.className = 'fa-solid fa-sun text-warning';
        } else {
          icon.className = 'fa-solid fa-moon text-cyan';
        }
      }
    });
  }
});
