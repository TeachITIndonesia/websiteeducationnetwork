/**
 * TEACHIT INDONESIA - LEARNING PROGRESS TRACKER MODULE
 * Manages topic completions, percentage calculation, badges, and LocalStorage.
 */

const ProgressTracker = (() => {
  const STORAGE_KEY = 'teachit_progress';
  const QUIZ_KEY = 'teachit_quiz_history';

  // Total topics baseline for calculation
  const TOTAL_TJKT = 16;
  const TOTAL_RPL = 17;
  const TOTAL_OS = 8;
  const TOTAL_MATERIAL = TOTAL_TJKT + TOTAL_RPL + TOTAL_OS;

  /**
   * Retrieves raw progress object from LocalStorage
   * @returns {Object} { completedTopics: Array, quizScores: Array }
   */
  function getRawProgress() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { completedTopics: [], completedDetails: {} };
  }

  /**
   * Saves progress object to LocalStorage
   * @param {Object} data 
   */
  function saveRawProgress(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Marks a specific topic as completed or toggles its status
   * @param {string} topicId 
   * @param {string} category - 'tjkt', 'rpl', or 'os'
   * @returns {boolean} isNowCompleted
   */
  function toggleTopicCompletion(topicId, category = 'tjkt') {
    const progress = getRawProgress();
    const index = progress.completedTopics.indexOf(topicId);
    let isCompleted = false;

    if (index > -1) {
      progress.completedTopics.splice(index, 1);
      delete progress.completedDetails[topicId];
    } else {
      progress.completedTopics.push(topicId);
      progress.completedDetails[topicId] = {
        category,
        timestamp: new Date().toISOString()
      };
      isCompleted = true;
    }

    saveRawProgress(progress);
    return isCompleted;
  }

  /**
   * Checks if a topic is marked as completed
   * @param {string} topicId 
   * @returns {boolean}
   */
  function isTopicCompleted(topicId) {
    const progress = getRawProgress();
    return progress.completedTopics.includes(topicId);
  }

  /**
   * Computes statistics for dashboard rendering
   * @returns {Object} Stats object
   */
  function getStats() {
    const progress = getRawProgress();
    const completedList = progress.completedTopics || [];

    let tjktDone = 0;
    let rplDone = 0;
    let osDone = 0;

    Object.keys(progress.completedDetails || {}).forEach(id => {
      const cat = progress.completedDetails[id].category;
      if (cat === 'tjkt') tjktDone++;
      if (cat === 'rpl') rplDone++;
      if (cat === 'os') osDone++;
    });

    const totalDone = completedList.length;
    const overallPercentage = Math.min(100, Math.round((totalDone / TOTAL_MATERIAL) * 100));

    // Calculate earned badges
    const badges = getEarnedBadges(tjktDone, rplDone, osDone, totalDone);

    return {
      totalDone,
      totalMaterial: TOTAL_MATERIAL,
      overallPercentage,
      tjktDone,
      tjktTotal: TOTAL_TJKT,
      rplDone,
      rplTotal: TOTAL_RPL,
      osDone,
      osTotal: TOTAL_OS,
      badges
    };
  }

  /**
   * Evaluates dynamic badges based on user learning milestones
   */
  function getEarnedBadges(tjktDone, rplDone, osDone, totalDone) {
    const badges = [];

    if (totalDone >= 1) {
      badges.push({ title: 'Langkah Pertama', icon: 'fa-solid fa-seedling', desc: 'Menyelesaikan 1 materi pertama di TeachIT', color: 'text-success' });
    }
    if (tjktDone >= 5) {
      badges.push({ title: 'Net Cadet', icon: 'fa-solid fa-network-wired', desc: 'Menyelesaikan 5+ materi TJKT', color: 'text-cyan' });
    }
    if (rplDone >= 5) {
      badges.push({ title: 'Code Apprentice', icon: 'fa-solid fa-code', desc: 'Menyelesaikan 5+ materi RPL', color: 'text-purple' });
    }
    if (osDone >= 3) {
      badges.push({ title: 'OS Architect', icon: 'fa-brands fa-linux', desc: 'Menyiapkan 3+ Sistem Operasi', color: 'text-warning' });
    }
    if (totalDone >= 20) {
      badges.push({ title: 'Master Tech IT', icon: 'fa-solid fa-crown', desc: 'Menyelesaikan 20+ materi di seluruh modul', color: 'text-cyan' });
    }

    return badges;
  }

  /**
   * Saves completed quiz results
   */
  function saveQuizScore(category, score, totalQuestions, answers) {
    const history = JSON.parse(localStorage.getItem(QUIZ_KEY) || '[]');
    history.unshift({
      category,
      score,
      totalQuestions,
      percentage: Math.round((score / totalQuestions) * 100),
      timestamp: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem(QUIZ_KEY, JSON.stringify(history.slice(0, 10)));
  }

  /**
   * Gets quiz history
   */
  function getQuizHistory() {
    return JSON.parse(localStorage.getItem(QUIZ_KEY) || '[]');
  }

  return {
    toggleTopicCompletion,
    isTopicCompleted,
    getStats,
    saveQuizScore,
    getQuizHistory
  };
})();

window.ProgressTracker = ProgressTracker;
