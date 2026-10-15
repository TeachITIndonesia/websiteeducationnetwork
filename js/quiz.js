/**
 * TEACHIT INDONESIA - INTERACTIVE QUIZ ENGINE MODULE
 * Handles category selection, timer, scoring, local storage, and detailed answer review.
 */

document.addEventListener('DOMContentLoaded', () => {
  const quizApp = document.getElementById('quiz-app');
  if (!quizApp) return;

  let quizData = (window.TEACHIT_DATA && window.TEACHIT_DATA.quiz) ? window.TEACHIT_DATA.quiz : null;
  let activeQuestions = [];
  let currentIndex = 0;
  let userAnswers = {};
  let timerInterval = null;
  let secondsRemaining = 1200;
  let selectedCategory = 'tjkt';

  if (!quizData) {
    fetch('data/quiz.json')
      .then(res => res.json())
      .then(data => {
        quizData = data;
        renderQuizSetup();
      })
      .catch(err => {
        quizData = (window.TEACHIT_DATA && window.TEACHIT_DATA.quiz) || {};
        renderQuizSetup();
      });
  } else {
    renderQuizSetup();
  }

  /**
   * Render initial setup screen (Choose Category)
   */
  function renderQuizSetup() {
    quizApp.innerHTML = `
      <div class="glass-card quiz-card text-center" data-aos="fade-up">
        <span class="badge-tech mb-2"><i class="fa-solid fa-gamepad me-2"></i>Interactive Assessment</span>
        <h2 class="section-title text-gradient mb-3">Uji Kemampuan Teknologi</h2>
        <p class="section-subtitle mb-4">Pilih kategori soal untuk memulai ujian interaktif dengan timer & pembahasan otomatis.</p>
        
        <div class="features-grid mb-4" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
          <div class="glass-card text-center quiz-select-card" id="select-tjkt" style="cursor: pointer;">
            <i class="fa-solid fa-network-wired fa-3x text-cyan mb-3"></i>
            <h3>Kuis TJKT</h3>
            <p class="text-muted small">20 Soal Jaringan & Telekomunikasi</p>
            <span class="badge-tech mt-2">Waktu: 20 Menit</span>
          </div>

          <div class="glass-card text-center quiz-select-card" id="select-rpl" style="cursor: pointer;">
            <i class="fa-solid fa-code fa-3x text-purple mb-3"></i>
            <h3>Kuis RPL</h3>
            <p class="text-muted small">20 Soal Pemrograman & Web Dev</p>
            <span class="badge-tech mt-2">Waktu: 20 Menit</span>
          </div>
        </div>

        <button class="btn btn-primary btn-lg" id="btn-start-quiz">
          <i class="fa-solid fa-play me-2"></i>Mulai Ujian Sekarang
        </button>
      </div>`;

    const tjktCard = document.getElementById('select-tjkt');
    const rplCard = document.getElementById('select-rpl');

    tjktCard.classList.add('active-selection');
    tjktCard.style.borderColor = 'var(--primary-cyan)';

    tjktCard.addEventListener('click', () => {
      selectedCategory = 'tjkt';
      tjktCard.style.borderColor = 'var(--primary-cyan)';
      rplCard.style.borderColor = 'var(--border-color)';
    });

    rplCard.addEventListener('click', () => {
      selectedCategory = 'rpl';
      rplCard.style.borderColor = 'var(--accent-purple)';
      tjktCard.style.borderColor = 'var(--border-color)';
    });

    document.getElementById('btn-start-quiz').addEventListener('click', startQuiz);
  }

  /**
   * Initializes and starts the quiz session
   */
  function startQuiz() {
    const dataObj = quizData || (window.TEACHIT_DATA && window.TEACHIT_DATA.quiz) || {};
    if (!dataObj || !dataObj[selectedCategory]) return;

    activeQuestions = dataObj[selectedCategory];
    currentIndex = 0;
    userAnswers = {};
    secondsRemaining = activeQuestions.length * 60; // 1 min per question

    startTimer();
    renderQuestion();
  }

  /**
   * Starts the countdown timer
   */
  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      secondsRemaining--;
      updateTimerDisplay();

      if (secondsRemaining <= 0) {
        clearInterval(timerInterval);
        finishQuiz();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const timerElem = document.getElementById('quiz-timer');
    if (!timerElem) return;

    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    timerElem.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Renders the current question and options
   */
  function renderQuestion() {
    const q = activeQuestions[currentIndex];
    const progressPercent = Math.round(((currentIndex + 1) / activeQuestions.length) * 100);

    quizApp.innerHTML = `
      <div class="glass-card quiz-card" data-aos="fade-up">
        <div class="quiz-header">
          <div>
            <span class="badge-tech me-2">Soal ${currentIndex + 1} / ${activeQuestions.length}</span>
            <span class="text-muted" style="font-size: 0.9rem;">Kategori: ${selectedCategory.toUpperCase()}</span>
          </div>
          <div class="timer-box" id="quiz-timer">
            <i class="fa-solid fa-clock me-1"></i>20:00
          </div>
        </div>

        <div class="progress-track mb-4">
          <div class="progress-fill" style="width: ${progressPercent}%;"></div>
        </div>

        <h3 class="mb-4" style="font-size: 1.25rem; line-height: 1.5;">${q.question}</h3>

        <div class="options-grid">
          ${q.options.map((opt, idx) => {
            const isSelected = userAnswers[currentIndex] === idx;
            return `
              <button class="option-btn ${isSelected ? 'selected' : ''}" data-idx="${idx}">
                <span class="code-badge me-2">${String.fromCharCode(65 + idx)}</span>
                ${opt}
              </button>`;
          }).join('')}
        </div>

        <div class="d-flex justify-content-between align-items-center mt-4 pt-3" style="border-top: 1px solid var(--border-color);">
          <button class="btn btn-outline btn-sm" id="btn-prev-q" ${currentIndex === 0 ? 'disabled' : ''}>
            <i class="fa-solid fa-arrow-left me-1"></i>Sebelumnya
          </button>
          
          ${currentIndex === activeQuestions.length - 1 ? `
            <button class="btn btn-primary btn-sm" id="btn-finish-quiz">
              <i class="fa-solid fa-check-double me-1"></i>Selesaikan Ujian
            </button>
          ` : `
            <button class="btn btn-primary btn-sm" id="btn-next-q">
              Selanjutnya<i class="fa-solid fa-arrow-right ms-1"></i>
            </button>
          `}
        </div>
      </div>`;

    updateTimerDisplay();

    const optionBtns = quizApp.querySelectorAll('.option-btn');
    optionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedIdx = parseInt(btn.dataset.idx);
        userAnswers[currentIndex] = selectedIdx;
        optionBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    const prevBtn = document.getElementById('btn-prev-q');
    const nextBtn = document.getElementById('btn-next-q');
    const finishBtn = document.getElementById('btn-finish-quiz');

    if (prevBtn) prevBtn.addEventListener('click', () => { currentIndex--; renderQuestion(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { currentIndex++; renderQuestion(); });
    if (finishBtn) finishBtn.addEventListener('click', finishQuiz);
  }

  /**
   * Computes score, saves result, and displays final score summary
   */
  function finishQuiz() {
    clearInterval(timerInterval);

    let correctCount = 0;
    activeQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.answer) {
        correctCount++;
      }
    });

    const totalCount = activeQuestions.length;
    const finalScore = Math.round((correctCount / totalCount) * 100);

    if (window.ProgressTracker) {
      window.ProgressTracker.saveQuizScore(selectedCategory.toUpperCase(), correctCount, totalCount);
    }

    renderQuizResults(correctCount, totalCount, finalScore);
  }

  /**
   * Displays the results view and options to review answers
   */
  function renderQuizResults(correct, total, score) {
    const isPassed = score >= 75;

    quizApp.innerHTML = `
      <div class="glass-card quiz-card text-center" data-aos="zoom-in">
        <i class="${isPassed ? 'fa-solid fa-trophy fa-4x text-cyan' : 'fa-solid fa-circle-exclamation fa-4x text-warning'} mb-3"></i>
        <h2 class="section-title mb-1">${isPassed ? 'Selamat! Ujian Lulus' : 'Coba Lagi! Ujian Belum Memenuhi Standard'}</h2>
        <p class="text-muted mb-4">Hasil Evaluasi Kuis ${selectedCategory.toUpperCase()}</p>

        <div class="stat-item mb-4" style="max-width: 250px; margin: 0 auto;">
          <div class="stat-number" style="font-size: 3.5rem;">${score}</div>
          <div class="stat-label">Skor Akhir (KKM: 75)</div>
        </div>

        <div class="d-flex justify-content-center gap-4 mb-4">
          <div class="text-success"><i class="fa-solid fa-circle-check me-1"></i>Benar: ${correct} Soal</div>
          <div class="text-danger"><i class="fa-solid fa-circle-xmark me-1"></i>Salah: ${total - correct} Soal</div>
        </div>

        <div class="d-flex justify-content-center gap-3">
          <button class="btn btn-outline" id="btn-review-answers">
            <i class="fa-solid fa-list-check me-2"></i>Pembahasan Jawaban
          </button>
          <button class="btn btn-primary" id="btn-restart-quiz">
            <i class="fa-solid fa-rotate-right me-2"></i>Ulangi Ujian
          </button>
        </div>
      </div>
      
      <div id="review-container" class="mt-4" style="display: none;"></div>`;

    document.getElementById('btn-restart-quiz').addEventListener('click', startQuiz);
    document.getElementById('btn-review-answers').addEventListener('click', () => {
      renderAnswerReview();
    });
  }

  /**
   * Renders itemized review of answers with detailed explanations
   */
  function renderAnswerReview() {
    const reviewContainer = document.getElementById('review-container');
    if (!reviewContainer) return;

    reviewContainer.style.display = 'block';
    let html = '<h3 class="mb-3 text-cyan">Detail Pembahasan Soal:</h3>';

    activeQuestions.forEach((q, idx) => {
      const userAns = userAnswers[idx];
      const isCorrect = userAns === q.answer;

      html += `
        <div class="glass-card mb-3" style="border-left: 4px solid ${isCorrect ? 'var(--accent-green)' : 'var(--accent-rose)'};">
          <div class="d-flex justify-content-between mb-2">
            <strong>Soal #${idx + 1}</strong>
            <span class="${isCorrect ? 'text-success' : 'text-danger'} font-weight-bold">
              ${isCorrect ? '<i class="fa-solid fa-check me-1"></i> Benar' : '<i class="fa-solid fa-xmark me-1"></i> Salah'}
            </span>
          </div>
          <p class="mb-3">${q.question}</p>
          <div class="small mb-2">
            <div>Jawaban Anda: <span class="${isCorrect ? 'text-success' : 'text-danger'}">${userAns !== undefined ? q.options[userAns] : 'Tidak Dijawab'}</span></div>
            <div>Jawaban Benar: <span class="text-success font-weight-bold">${q.options[q.answer]}</span></div>
          </div>
          <div class="summary-box p-2 small mt-2" style="font-size: 0.85rem;">
            <strong><i class="fa-solid fa-lightbulb text-warning me-1"></i>Pembahasan:</strong> ${q.explanation}
          </div>
        </div>`;
    });

    reviewContainer.innerHTML = html;
  }
});
