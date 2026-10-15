/**
 * TEACHIT INDONESIA - GLOBAL SEARCH & FILTER ENGINE
 * Handles quick search modal and in-page filters across all educational modules.
 */

document.addEventListener('DOMContentLoaded', () => {
  const searchTriggers = document.querySelectorAll('.search-trigger');
  const searchModal = document.getElementById('search-modal');
  const searchModalInput = document.getElementById('modal-search-input');
  const searchResultsContainer = document.getElementById('modal-search-results');
  const closeModalBtn = document.getElementById('close-search-modal');

  let materiData = window.TEACHIT_DATA || null;

  if (!materiData) {
    fetch('data/materi.json')
      .then(res => res.json())
      .then(data => { materiData = data; })
      .catch(err => {
        materiData = window.TEACHIT_DATA || {};
      });
  }

  // Open modal listeners
  searchTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (searchModal) {
        searchModal.classList.add('active');
        if (searchModalInput) {
          searchModalInput.focus();
        }
      }
    });
  });

  // Close modal listeners
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      searchModal.classList.remove('active');
    });
  }

  if (searchModal) {
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) {
        searchModal.classList.remove('active');
      }
    });
  }

  // Keyboard shortcut Ctrl+K or ESC
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (searchModal) {
        searchModal.classList.add('active');
        if (searchModalInput) searchModalInput.focus();
      }
    }
    if (e.key === 'Escape' && searchModal && searchModal.classList.contains('active')) {
      searchModal.classList.remove('active');
    }
  });

  // Perform search on modal input keyup
  if (searchModalInput) {
    searchModalInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      renderSearchResults(query);
    });
  }

  function renderSearchResults(query) {
    if (!searchResultsContainer) return;

    if (!query || query.length < 2) {
      searchResultsContainer.innerHTML = `
        <div class="text-center p-4 text-dim">
          <i class="fa-solid fa-magnifying-glass fa-2x mb-2 text-cyan"></i>
          <p>Ketik kata kunci untuk mencari materi TJKT, RPL, OS, atau Quiz...</p>
        </div>`;
      return;
    }

    const currentData = materiData || window.TEACHIT_DATA || {};
    const matches = [];

    // Search TJKT
    (currentData.tjkt || []).forEach(item => {
      if (item.title.toLowerCase().includes(query) || item.explanation.toLowerCase().includes(query) || (item.category && item.category.toLowerCase().includes(query))) {
        matches.push({ title: item.title, cat: 'TJKT', link: `tjkt.html?id=${item.id}`, icon: item.icon || 'fa-solid fa-network-wired', desc: item.summary || item.category });
      }
    });

    // Search RPL
    (currentData.rpl || []).forEach(item => {
      if (item.title.toLowerCase().includes(query) || item.explanation.toLowerCase().includes(query) || (item.category && item.category.toLowerCase().includes(query))) {
        matches.push({ title: item.title, cat: 'RPL', link: `rpl.html?id=${item.id}`, icon: item.icon || 'fa-solid fa-code', desc: item.category });
      }
    });

    // Search OS
    (currentData.os || []).forEach(item => {
      if (item.title.toLowerCase().includes(query) || item.requirements.toLowerCase().includes(query) || (item.category && item.category.toLowerCase().includes(query))) {
        matches.push({ title: item.title, cat: 'Tutorial OS', link: `os.html?id=${item.id}`, icon: item.icon || 'fa-brands fa-linux', desc: item.category });
      }
    });

    if ('quiz'.includes(query) || 'ujian'.includes(query) || 'soal'.includes(query)) {
      matches.push({ title: 'Ujian Interactive Quiz (TJKT & RPL)', cat: 'Quiz', link: 'quiz.html', icon: 'fa-solid fa-gamepad', desc: 'Uji kemampuan teknismu dengan 40 soal interaktif' });
    }

    if (matches.length === 0) {
      searchResultsContainer.innerHTML = `
        <div class="text-center p-4 text-muted">
          <i class="fa-solid fa-circle-exclamation fa-2x mb-2 text-warning"></i>
          <p>Materi "${query}" tidak ditemukan. Coba kata kunci lain.</p>
        </div>`;
      return;
    }

    let html = '';
    matches.slice(0, 10).forEach(match => {
      html += `
        <a href="${match.link}" class="search-result-item">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="badge-tech mb-1">${match.cat}</span>
              <h4 style="font-size: 1rem; color: var(--text-main); margin: 0.2rem 0;">
                <i class="${match.icon} text-cyan me-2"></i>${match.title}
              </h4>
              <small style="color: var(--text-muted);">${match.desc}</small>
            </div>
            <i class="fa-solid fa-chevron-right text-cyan"></i>
          </div>
        </a>`;
    });

    searchResultsContainer.innerHTML = html;
  }
});
