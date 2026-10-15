/**
 * TEACHIT INDONESIA - CORE APPLICATION CONTROLLER
 * Handles particle canvas animation, dynamic page content loading, navbar, scroll-to-top & toasts.
 * Ultra-polished rendering for textbook-quality educational materials.
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollTop();
  initParticleCanvas();
  initPageControllers();
  initTypingEffect();
});

/**
 * Helper to fetch data safely across file:// and http:// protocols
 */
function getMateriDataAsync() {
  return new Promise((resolve) => {
    if (window.TEACHIT_DATA && window.TEACHIT_DATA.tjkt) {
      resolve(window.TEACHIT_DATA);
    } else {
      fetch('data/materi.json')
        .then(res => res.json())
        .then(data => resolve(data))
        .catch(err => {
          console.warn('Fetch fallback failed, using window.TEACHIT_DATA', err);
          resolve(window.TEACHIT_DATA || {});
        });
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

/**
 * Converts **bold** markdown syntax into styled <strong> tags.
 */
function boldify(str) {
  if (!str) return '';
  return String(str).replace(/\*\*(.+?)\*\*/g, '<strong class="explain-strong">$1</strong>');
}

/**
 * Lightweight markdown-lite formatter for the "explanation" field.
 * Correctly turns paragraphs, numbered/bulleted lists, and nested
 * sub-bullets into clean semantic HTML (<p>, <ol>, <ul>) instead of
 * leaving raw "**" and "\n" characters visible to the reader.
 */
function formatExplanation(raw) {
  if (!raw) return '';

  const blocks = raw.split(/\n\s*\n/);
  let html = '';
  let openList = null; // { ordered: bool, items: [{text, subs}] }

  const renderList = (list) => {
    const tag = list.ordered ? 'ol' : 'ul';
    return `<${tag} class="explanation-list">` + list.items.map(li => {
      let inner = boldify(li.text);
      if (li.subs.length) {
        inner += `<ul class="explanation-sublist">${li.subs.map(s => `<li>${boldify(s)}</li>`).join('')}</ul>`;
      }
      return `<li>${inner}</li>`;
    }).join('') + `</${tag}>`;
  };

  const closeOpenList = () => {
    if (openList) {
      html += renderList(openList);
      openList = null;
    }
  };

  blocks.forEach(block => {
    const lines = block.split('\n');

    // Peel off any leading plain-text lines (an intro sentence that
    // precedes a list within the very same block) as their own paragraph.
    let introLines = [];
    let i = 0;
    while (i < lines.length) {
      const trimmed = lines[i].trim();
      if (!trimmed) { i++; continue; }
      if (/^\d+\.\s+/.test(trimmed) || /^-\s+/.test(trimmed)) break;
      introLines.push(trimmed);
      i++;
    }
    if (introLines.length) {
      closeOpenList();
      html += `<p>${boldify(introLines.join(' '))}</p>`;
    }
    if (i >= lines.length) return; // block was plain text only

    const remaining = lines.slice(i);
    const firstTrim = (remaining.find(l => l.trim()) || '').trim();
    const firstIsNumbered = /^\d+\.\s+/.test(firstTrim);

    // Continue the currently open list if it's the same type, otherwise start a new one
    if (!openList || openList.ordered !== firstIsNumbered) {
      closeOpenList();
      openList = { ordered: firstIsNumbered, items: [] };
    }

    remaining.forEach(rawLine => {
      const trimmed = rawLine.trim();
      if (!trimmed) return;

      const numMatch = /^\d+\.\s+(.*)/.exec(trimmed);
      const isSubBullet = /^\s+-\s+/.test(rawLine) && openList.items.length > 0;
      const topBulletMatch = !isSubBullet && !numMatch && /^-\s+(.*)/.exec(trimmed);

      if (numMatch) {
        openList.items.push({ text: numMatch[1], subs: [] });
      } else if (topBulletMatch) {
        openList.items.push({ text: topBulletMatch[1], subs: [] });
      } else if (isSubBullet) {
        openList.items[openList.items.length - 1].subs.push(trimmed.replace(/^-\s+/, ''));
      } else if (openList.items.length) {
        openList.items[openList.items.length - 1].text += ' ' + trimmed;
      }
    });
  });

  closeOpenList();
  return html;
}

/**
 * Initializes Sticky Navbar and Mobile Menu Drawer
 */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  });

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const isOpened = navMenu.classList.contains('active');
      mobileToggle.innerHTML = isOpened ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });
  }
}

/**
 * Scroll to Top Button Handler
 */
function initScrollTop() {
  const scrollBtn = document.createElement('div');
  scrollBtn.className = 'scroll-top-btn';
  scrollBtn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
  document.body.appendChild(scrollBtn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      scrollBtn.classList.add('visible');
    } else {
      scrollBtn.classList.remove('visible');
    }
  });

  scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * Futuristic Particles Background Canvas
 */
function initParticleCanvas() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const count = Math.min(60, Math.floor(width / 20));

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2 + 1,
      color: Math.random() > 0.5 ? '#00f2fe' : '#0066ff'
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      let p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        let p2 = particles[j];
        let dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(0, 242, 254, ${1 - dist / 130 * 0.8})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }

  animate();
}

/**
 * Animated Typing Text Effect for Hero Section
 */
function initTypingEffect() {
  const elem = document.querySelector('.typing-text');
  if (!elem) return;

  const words = ['Jaringan Komputer (TJKT)', 'Rekayasa Perangkat Lunak (RPL)', 'Instalasi Sistem Operasi', 'Latihan Quiz Interaktif'];
  let wordIdx = 0;
  let charIdx = 0;
  let isDeleting = false;

  function type() {
    const currentWord = words[wordIdx];
    if (isDeleting) {
      elem.textContent = currentWord.substring(0, charIdx - 1);
      charIdx--;
    } else {
      elem.textContent = currentWord.substring(0, charIdx + 1);
      charIdx++;
    }

    let typeSpeed = isDeleting ? 40 : 80;

    if (!isDeleting && charIdx === currentWord.length) {
      typeSpeed = 2000;
      isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      wordIdx = (wordIdx + 1) % words.length;
      typeSpeed = 500;
    }

    setTimeout(type, typeSpeed);
  }

  type();
}

/**
 * Page Controllers (TJKT, RPL, OS, Dashboard)
 */
function initPageControllers() {
  const path = window.location.pathname;

  if (path.includes('tjkt.html')) {
    loadLearningModule('tjkt');
  } else if (path.includes('rpl.html')) {
    loadLearningModule('rpl');
  } else if (path.includes('os.html')) {
    loadOSModule();
  } else if (path.includes('dashboard.html')) {
    renderDashboardView();
  }
}

/**
 * Loads dynamic TJKT or RPL topics sidebar and detail view
 */
function loadLearningModule(moduleKey) {
  const sidebarContainer = document.getElementById('topic-list-sidebar');
  const viewContainer = document.getElementById('topic-detail-view');
  if (!sidebarContainer || !viewContainer) return;

  getMateriDataAsync().then(data => {
    const topics = data[moduleKey] || [];
    if (topics.length === 0) return;

    // Check URL parameters for specific topic ID
    const urlParams = new URLSearchParams(window.location.search);
    const activeId = urlParams.get('id') || topics[0].id;

    renderSidebarList(topics, activeId, moduleKey);
    renderTopicDetail(topics, activeId, moduleKey);

    // In-page search filter listener
    const filterInput = document.getElementById('sidebar-filter-input');
    if (filterInput) {
      filterInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = topics.filter(t => t.title.toLowerCase().includes(val) || (t.category && t.category.toLowerCase().includes(val)));
        renderSidebarList(filtered, activeId, moduleKey);
      });
    }
  });
}

function renderSidebarList(topics, activeId, moduleKey) {
  const sidebarContainer = document.getElementById('topic-list-sidebar');
  if (!sidebarContainer) return;

  sidebarContainer.innerHTML = topics.map(t => {
    const isDone = window.ProgressTracker ? window.ProgressTracker.isTopicCompleted(t.id) : false;
    const isActive = t.id === activeId;
    return `
      <li class="topic-item ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}" data-id="${t.id}">
        <span><i class="${t.icon || 'fa-solid fa-book'} me-2"></i>${t.title}</span>
        <i class="fa-solid fa-circle-check check-icon"></i>
      </li>`;
  }).join('');

  sidebarContainer.querySelectorAll('.topic-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      window.history.pushState(null, '', `${moduleKey}.html?id=${id}`);
      getMateriDataAsync().then(data => {
        renderSidebarList(data[moduleKey], id, moduleKey);
        renderTopicDetail(data[moduleKey], id, moduleKey);
      });
    });
  });
}

function renderTopicDetail(topics, topicId, moduleKey) {
  const viewContainer = document.getElementById('topic-detail-view');
  const topic = topics.find(t => t.id === topicId) || topics[0];
  if (!viewContainer || !topic) return;

  const isCompleted = window.ProgressTracker ? window.ProgressTracker.isTopicCompleted(topic.id) : false;

  // Format explanation text into beautiful, correctly-rendered paragraphs and lists
  let formattedExplanation = formatExplanation(topic.explanation);

  let contentHtml = `
    <div class="topic-header" data-aos="fade-up">
      <span class="badge-tech"><i class="fa-solid fa-bookmark me-1"></i>${topic.category || moduleKey.toUpperCase()}</span>
      <h2><i class="${topic.icon || 'fa-solid fa-book'} text-cyan me-2"></i>${topic.title}</h2>
    </div>

    <div class="topic-body" data-aos="fade-up">
      <div class="lead-text mb-4">
        ${formattedExplanation}
      </div>

      ${topic.illustration ? topic.illustration : ''}

      ${topic.code ? `
        <div class="code-window">
          <div class="code-header">
            <div class="mac-dots">
              <div class="mac-dot dot-red"></div>
              <div class="mac-dot dot-yellow"></div>
              <div class="mac-dot dot-green"></div>
            </div>
            <div class="code-title"><i class="fa-solid fa-file-code me-1 text-cyan"></i>${topic.title} Code Sample</div>
          </div>
          <div class="code-body"><code>${escapeHtml(topic.code)}</code></div>
        </div>
      ` : ''}

      ${topic.output ? `
        <div class="glass-card mb-4 p-3" style="background: rgba(4, 8, 18, 0.9); border-left: 4px solid var(--accent-green);">
          <strong class="text-success"><i class="fa-solid fa-terminal me-2"></i>Output Log Contoh:</strong>
          <div class="mt-2 font-monospace" style="color: #a7f3d0; font-size: 0.95rem; white-space: pre-line;">${escapeHtml(topic.output)}</div>
        </div>
      ` : ''}

      ${topic.youtube ? `
        <h4 class="mt-4 mb-2 text-cyan"><i class="fa-brands fa-youtube me-2"></i>Video Pembelajaran Embed:</h4>
        <div class="video-container">
          <iframe src="${topic.youtube}" allowfullscreen></iframe>
        </div>
      ` : ''}

      ${topic.exercise ? `
        <div class="glass-card mb-4 p-3" style="border-left: 4px solid var(--accent-purple); background: rgba(147, 51, 234, 0.08);">
          <h4 class="text-purple mb-2" style="font-size: 1.1rem;"><i class="fa-solid fa-pen-ruler me-2"></i>Latihan Mandiri:</h4>
          <p class="mb-0 text-main">${topic.exercise}</p>
        </div>
      ` : ''}

      <div class="summary-box">
        <h4 class="text-cyan mb-2" style="font-size: 1.1rem;"><i class="fa-solid fa-lightbulb me-2"></i>Ringkasan Konsep Kunci:</h4>
        <p class="mb-0 text-main">${topic.summary || 'Pahami materi di atas untuk mempersiapkan diri pada ujian quiz interaktif.'}</p>
      </div>
    </div>

    <div class="topic-actions">
      <button class="btn ${isCompleted ? 'btn-outline' : 'btn-primary'}" id="btn-toggle-complete">
        <i class="fa-solid ${isCompleted ? 'fa-circle-check text-success' : 'fa-check'} me-2"></i>
        ${isCompleted ? 'Selesai (Klik untuk Batal)' : 'Tandai Selesai'}
      </button>

      ${topic.nextId ? `
        <button class="btn btn-outline" id="btn-next-topic" data-next="${topic.nextId}">
          Topik Selanjutnya <i class="fa-solid fa-arrow-right ms-2"></i>
        </button>
      ` : '<span class="text-muted small">Modul Akhir</span>'}
    </div>`;

  viewContainer.innerHTML = contentHtml;

  // Toggle complete listener
  const toggleBtn = document.getElementById('btn-toggle-complete');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (window.ProgressTracker) {
        const done = window.ProgressTracker.toggleTopicCompletion(topic.id, moduleKey);
        renderSidebarList(topics, topic.id, moduleKey);
        renderTopicDetail(topics, topic.id, moduleKey);
        showToast(done ? 'Materi ditandai selesai! Progress diperbarui.' : 'Status materi dibatalkan.', done ? 'success' : 'info');
      }
    });
  }

  // Next topic listener
  const nextBtn = document.getElementById('btn-next-topic');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const nextId = nextBtn.dataset.next;
      window.history.pushState(null, '', `${moduleKey}.html?id=${nextId}`);
      renderSidebarList(topics, nextId, moduleKey);
      renderTopicDetail(topics, nextId, moduleKey);
    });
  }
}

/**
 * Loads OS Installation Tutorials Accordions
 */
function loadOSModule() {
  const container = document.getElementById('os-tutorials-container');
  if (!container) return;

  getMateriDataAsync().then(data => {
    const osList = data.os || [];
    renderOSList(osList);
  });
}

function renderOSList(osList) {
  const container = document.getElementById('os-tutorials-container');
  if (!container) return;

  container.innerHTML = osList.map(item => `
    <div class="glass-card mb-4" data-aos="fade-up">
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <span class="badge-tech mb-1">${item.category}</span>
          <h2 style="font-size: 1.75rem;"><i class="${item.icon} text-cyan me-2"></i>${item.title}</h2>
        </div>
        <button class="btn btn-outline btn-sm btn-toggle-os-details" data-id="${item.id}">
          <i class="fa-solid fa-chevron-down me-1"></i>Buka Panduan
        </button>
      </div>

      <p class="text-muted mb-3"><strong>Persyaratan:</strong> ${boldify(item.requirements)}</p>

      <div class="os-detail-body" id="os-details-${item.id}" style="display: none; padding-top: 1rem; border-top: 1px solid var(--border-color);">
        <h4 class="text-cyan mb-2"><i class="fa-solid fa-toolbox me-2"></i>Daftar Alat & Bahan:</h4>
        <ul class="mb-3 ps-4 text-muted">
          ${item.tools.map(tool => `<li>${boldify(tool)}</li>`).join('')}
        </ul>

        <h4 class="text-cyan mb-2"><i class="fa-solid fa-list-ol me-2"></i>Langkah Demi Langkah:</h4>
        <ol class="mb-4 ps-4" style="line-height: 1.8;">
          ${item.steps.map(step => `<li class="mb-2 text-main">${boldify(step)}</li>`).join('')}
        </ol>

        <div class="glass-card p-3 mb-3" style="border-left: 4px solid var(--accent-amber); background: rgba(245, 158, 11, 0.08);">
          <strong class="text-warning"><i class="fa-solid fa-triangle-exclamation me-1"></i>Tips Penting:</strong>
          <p class="mb-0 small text-main">${boldify(item.tips)}</p>
        </div>

        ${(item.faq && item.faq.length) ? `
        <h4 class="text-cyan mb-2 mt-4"><i class="fa-solid fa-circle-question me-2"></i>Tanya Jawab Seputar Topik Ini:</h4>
        <div class="d-flex flex-column gap-2">
          ${item.faq.map(f => `
            <div class="glass-card p-3" style="background: rgba(0, 242, 254, 0.05);">
              <p class="mb-1 text-main" style="font-weight: 700;"><i class="fa-solid fa-circle-question text-cyan me-2"></i>${boldify(f.q)}</p>
              <p class="mb-0 text-muted">${boldify(f.a)}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.btn-toggle-os-details').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const detailBody = document.getElementById(`os-details-${id}`);
      if (detailBody) {
        const isHidden = detailBody.style.display === 'none';
        detailBody.style.display = isHidden ? 'block' : 'none';
        btn.innerHTML = isHidden ? '<i class="fa-solid fa-chevron-up me-1"></i>Tutup Panduan' : '<i class="fa-solid fa-chevron-down me-1"></i>Buka Panduan';
      }
    });
  });
}

/**
 * Render Student Dashboard View
 */
function renderDashboardView() {
  const statsElem = document.getElementById('dashboard-stats');
  if (!statsElem) return;

  const stats = window.ProgressTracker ? window.ProgressTracker.getStats() : {};
  const quizHistory = window.ProgressTracker ? window.ProgressTracker.getQuizHistory() : [];

  statsElem.innerHTML = `
    <div class="features-grid mb-5">
      <div class="glass-card text-center">
        <i class="fa-solid fa-chart-line fa-3x text-cyan mb-2"></i>
        <div class="stat-number">${stats.overallPercentage || 0}%</div>
        <div class="stat-label">Total Progress Belajar</div>
      </div>

      <div class="glass-card text-center">
        <i class="fa-solid fa-book-bookmark fa-3x text-purple mb-2"></i>
        <div class="stat-number">${stats.totalDone || 0} / ${stats.totalMaterial || 41}</div>
        <div class="stat-label">Materi Selesai</div>
      </div>

      <div class="glass-card text-center">
        <i class="fa-solid fa-award fa-3x text-warning mb-2"></i>
        <div class="stat-number">${(stats.badges || []).length}</div>
        <div class="stat-label">Badge Pencapaian</div>
      </div>
    </div>

    <div class="learning-layout">
      <div>
        <h3 class="section-title text-gradient mb-3">Badge Digital</h3>
        <div class="features-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 2rem;">
          ${(stats.badges || []).length > 0 ? stats.badges.map(b => `
            <div class="glass-card text-center p-3">
              <i class="${b.icon} fa-3x ${b.color} mb-2"></i>
              <h4 style="font-size: 1.05rem;">${b.title}</h4>
              <small class="text-muted">${b.desc}</small>
            </div>
          `).join('') : '<p class="text-muted">Belum ada badge. Selesaikan materi untuk mendapatkan badge!</p>'}
        </div>
      </div>

      <div>
        <h3 class="section-title text-gradient mb-3">Riwayat Ujian Quiz</h3>
        <div class="glass-card">
          ${quizHistory.length > 0 ? `
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
              <thead>
                <tr style="border-bottom: 1px solid var(--border-color); color: var(--primary-cyan);">
                  <th class="p-2">Kategori</th>
                  <th class="p-2">Skor %</th>
                  <th class="p-2">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                ${quizHistory.map(q => `
                  <tr style="border-bottom: 1px solid var(--border-color);">
                    <td class="p-2"><strong>${q.category}</strong></td>
                    <td class="p-2 ${q.percentage >= 75 ? 'text-success' : 'text-danger'}">${q.percentage}% (${q.score}/${q.totalQuestions})</td>
                    <td class="p-2 text-muted">${q.timestamp}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p class="text-muted p-3 text-center">Belum ada riwayat kuis. Ambil kuis di menu Quiz!</p>'}
        </div>
      </div>
    </div>`;
}

/**
 * Toast Notification Utility
 */
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = 'position: fixed; bottom: 20px; left: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'glass-card p-3';
  toast.style.cssText = `min-width: 260px; max-width: 380px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#00f2fe'}; display: flex; align-items: center; gap: 10px; font-size: 0.9rem;`;
  
  toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check text-success' : 'fa-circle-info text-cyan'}"></i><div>${message}</div>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

window.showToast = showToast;
