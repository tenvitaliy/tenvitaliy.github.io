/**
 * StudyVerse Application Logic
 * Persistent LocalStorage Data Manager, Pomodoro Timer, Lesson Grid,
 * Deadlines Manager, and Interactive 3D Flashcards Engine.
 */

const STORAGE_KEY = 'studyverse_data_v1';

// Initial Sample Data Structure (fallback if empty)
const DEFAULT_DATA = {
  lessons: [
    {
      id: 'lesson-1',
      name: 'World History',
      deadlines: [
        { id: 'dl-1', title: 'WWII Term Paper', date: '2026-08-15' },
        { id: 'dl-2', title: 'Ancient Civilizations Exam', date: '2026-08-28' }
      ],
      decks: [
        {
          deckId: 'deck-1',
          deckName: 'Key Dates & Events',
          cards: [
            { id: 'c-1', front: 'Start of WW2 in Europe', back: 'September 1, 1939' },
            { id: 'c-2', front: 'Signing of the Magna Carta', back: '1215' },
            { id: 'c-3', front: 'French Revolution Begins', back: '1789' },
            { id: 'c-4', front: 'Fall of the Berlin Wall', back: 'November 9, 1989' }
          ]
        }
      ]
    },
    {
      id: 'lesson-2',
      name: 'Computer Science',
      deadlines: [
        { id: 'dl-3', title: 'Frontend Capstone Project', date: '2026-08-05' }
      ],
      decks: [
        {
          deckId: 'deck-2',
          deckName: 'JavaScript Fundamentals',
          cards: [
            { id: 'c-5', front: 'What is localStorage?', back: 'A Web Storage API that saves key-value pairs persistently across browser sessions.' },
            { id: 'c-6', front: 'Difference between let and const?', back: 'let allows re-assigning values, whereas const creates a read-only variable reference.' },
            { id: 'c-7', front: 'What is a Closure?', back: 'A function enclosed with references to its surrounding lexical environment.' }
          ]
        }
      ]
    }
  ],
  settings: {
    workTime: 25 * 60,
    shortBreakTime: 5 * 60,
    longBreakTime: 15 * 60
  }
};

class StudyApp {
  constructor() {
    this.data = this.loadData();
    this.currentLessonId = null;
    this.currentManageDeckId = null;

    // Study Mode state
    this.studyDeck = null;
    this.studyCards = [];
    this.studyIndex = 0;
    this.isCardFlipped = false;

    // Pomodoro Timer state
    this.pomoMode = 'work'; // 'work', 'shortBreak', 'longBreak'
    this.pomoDurations = {
      work: 25 * 60,
      shortBreak: 5 * 60,
      longBreak: 15 * 60
    };
    this.pomoTimeLeft = this.pomoDurations.work;
    this.pomoTimerId = null;
    this.isPomoRunning = false;

    this.init();
  }

  // --- LocalStorage Data Persistence ---
  loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse localStorage data:', e);
    }
    // Save fallback default data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
    return DEFAULT_DATA;
  }

  saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    this.updateGlobalHeaderStats();
  }

  // --- Initialization & Event Listeners ---
  init() {
    this.bindEvents();
    this.updateGlobalHeaderStats();
    this.renderDashboard();
    this.initPomodoro();
  }

  bindEvents() {
    // Navigation
    document.getElementById('btnLogoHome').addEventListener('click', () => this.showView('dashboardView'));
    document.getElementById('btnBackToDashboard').addEventListener('click', () => this.showView('dashboardView'));

    // Modal Triggers
    document.getElementById('btnOpenAddLessonModal').addEventListener('click', () => this.openModal('modalAddLesson'));
    document.getElementById('btnOpenCreateDeckModal').addEventListener('click', () => this.openModal('modalCreateDeck'));

    // Close Modal buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.currentTarget.getAttribute('data-close-modal');
        this.closeModal(modalId);
      });
    });

    // Form Submissions
    document.getElementById('formAddLesson').addEventListener('submit', (e) => this.handleAddLesson(e));
    document.getElementById('formCreateDeck').addEventListener('submit', (e) => this.handleCreateDeck(e));
    document.getElementById('formAddDeadline').addEventListener('submit', (e) => this.handleAddDeadline(e));
    document.getElementById('formAddCard').addEventListener('submit', (e) => this.handleAddCard(e));
    document.getElementById('btnDeleteLesson').addEventListener('click', () => this.handleDeleteLesson());

    // Pomodoro Controls
    document.querySelectorAll('.pomo-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.pomo-mode-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.setPomoMode(e.target.getAttribute('data-mode'));
      });
    });

    document.getElementById('btnTimerStartPause').addEventListener('click', () => this.togglePomodoro());
    document.getElementById('btnTimerReset').addEventListener('click', () => this.resetPomodoro());

    // Study Overlay Events
    document.getElementById('btnCloseStudy').addEventListener('click', () => this.closeStudyOverlay());
    document.getElementById('flashcardScene').addEventListener('click', () => this.flipStudyCard());
    document.getElementById('btnStudyFlip').addEventListener('click', () => this.flipStudyCard());
    document.getElementById('btnStudyNext').addEventListener('click', () => this.nextStudyCard());
    document.getElementById('btnStudyPrev').addEventListener('click', () => this.prevStudyCard());

    // Keyboard Shortcuts for Study Mode
    document.addEventListener('keydown', (e) => {
      const studyOverlay = document.getElementById('studyOverlay');
      if (!studyOverlay.classList.contains('active')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.flipStudyCard();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.nextStudyCard();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.prevStudyCard();
      } else if (e.code === 'Escape') {
        this.closeStudyOverlay();
      }
    });
  }

  // --- View Navigation & Header Stats ---
  showView(viewId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    if (viewId === 'dashboardView') {
      this.currentLessonId = null;
      this.renderDashboard();
    }
  }

  updateGlobalHeaderStats() {
    const totalLessons = this.data.lessons.length;
    let totalDecks = 0;
    let totalDeadlines = 0;

    this.data.lessons.forEach(l => {
      totalDecks += (l.decks ? l.decks.length : 0);
      totalDeadlines += (l.deadlines ? l.deadlines.length : 0);
    });

    document.getElementById('statLessonsCount').textContent = totalLessons;
    document.getElementById('statDecksCount').textContent = totalDecks;
    document.getElementById('statDeadlinesCount').textContent = totalDeadlines;
  }

  openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
  }

  closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
  }

  // --- Lessons CRUD ---
  renderDashboard() {
    const grid = document.getElementById('lessonsGrid');
    grid.innerHTML = '';

    this.data.lessons.forEach(lesson => {
      const deckCount = lesson.decks ? lesson.decks.length : 0;
      const deadlineCount = lesson.deadlines ? lesson.deadlines.length : 0;

      const card = document.createElement('div');
      card.className = 'card lesson-card';
      card.innerHTML = `
        <div class="lesson-card-top">
          <div class="lesson-icon-badge">
            <i class="fa-solid fa-book-bookmark"></i>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-dim);">${deckCount} Decks</span>
        </div>
        <div>
          <h3 class="lesson-title">${this.escapeHTML(lesson.name)}</h3>
          <div class="lesson-meta">
            <span class="meta-item"><i class="fa-solid fa-clone"></i> ${deckCount} decks</span>
            <span class="meta-item"><i class="fa-regular fa-calendar"></i> ${deadlineCount} deadlines</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => this.openLessonDetail(lesson.id));
      grid.appendChild(card);
    });

    // Add Lesson Action Card
    const addCard = document.createElement('div');
    addCard.className = 'card add-lesson-card';
    addCard.innerHTML = `
      <div class="add-icon-circle">
        <i class="fa-solid fa-plus"></i>
      </div>
      <span style="font-weight: 600; font-size: 0.95rem; color: var(--text-muted);">Add New Subject</span>
    `;
    addCard.addEventListener('click', () => this.openModal('modalAddLesson'));
    grid.appendChild(addCard);
  }

  handleAddLesson(e) {
    e.preventDefault();
    const input = document.getElementById('inputLessonName');
    const name = input.value.trim();
    if (!name) return;

    const newLesson = {
      id: 'lesson-' + Date.now(),
      name: name,
      deadlines: [],
      decks: []
    };

    this.data.lessons.push(newLesson);
    this.saveData();
    input.value = '';
    this.closeModal('modalAddLesson');
    this.renderDashboard();
  }

  openLessonDetail(lessonId) {
    this.currentLessonId = lessonId;
    const lesson = this.data.lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    document.getElementById('currentLessonTitle').textContent = lesson.name;
    this.updateLessonBannerMeta(lesson);
    this.renderDeadlines(lesson);
    this.renderDecks(lesson);
    this.showView('lessonView');
  }

  updateLessonBannerMeta(lesson) {
    const deckCount = lesson.decks ? lesson.decks.length : 0;
    const deadlineCount = lesson.deadlines ? lesson.deadlines.length : 0;
    document.getElementById('currentLessonMeta').textContent = `${deckCount} Flashcard Decks • ${deadlineCount} Upcoming Deadlines`;
  }

  handleDeleteLesson() {
    if (!this.currentLessonId) return;
    const lesson = this.data.lessons.find(l => l.id === this.currentLessonId);
    if (!lesson) return;

    if (confirm(`Are you sure you want to delete "${lesson.name}" and all its flashcard decks and deadlines?`)) {
      this.data.lessons = this.data.lessons.filter(l => l.id !== this.currentLessonId);
      this.saveData();
      this.showView('dashboardView');
    }
  }

  // --- Deadlines Controller ---
  renderDeadlines(lesson) {
    const list = document.getElementById('deadlineList');
    list.innerHTML = '';

    if (!lesson.deadlines || lesson.deadlines.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <i class="fa-regular fa-calendar-xmark empty-state-icon"></i>
          <p style="font-size: 0.85rem;">No deadlines set for this subject yet.</p>
        </div>
      `;
      return;
    }

    // Sort chronologically
    const sorted = [...lesson.deadlines].sort((a, b) => new Date(a.date) - new Date(b.date));

    sorted.forEach(dl => {
      const item = document.createElement('div');
      item.className = 'deadline-item';

      const daysLeft = this.calculateDaysLeft(dl.date);
      let badgeColor = 'var(--accent-amber)';
      let badgeText = `${daysLeft} days left`;
      
      if (daysLeft === 0) {
        badgeText = 'Due Today!';
        badgeColor = 'var(--accent-pink)';
      } else if (daysLeft < 0) {
        badgeText = 'Overdue';
        badgeColor = 'var(--accent-rose)';
      }

      item.innerHTML = `
        <div class="deadline-info">
          <h5>${this.escapeHTML(dl.title)}</h5>
          <div class="deadline-date" style="color: ${badgeColor};">
            <i class="fa-regular fa-clock"></i> ${dl.date} (${badgeText})
          </div>
        </div>
        <button class="delete-btn-sm" title="Delete Deadline">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;

      item.querySelector('.delete-btn-sm').addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleDeleteDeadline(dl.id);
      });

      list.appendChild(item);
    });
  }

  handleAddDeadline(e) {
    e.preventDefault();
    if (!this.currentLessonId) return;

    const titleInput = document.getElementById('inputDeadlineTitle');
    const dateInput = document.getElementById('inputDeadlineDate');

    const title = titleInput.value.trim();
    const date = dateInput.value;

    if (!title || !date) return;

    const lesson = this.data.lessons.find(l => l.id === this.currentLessonId);
    if (!lesson) return;

    if (!lesson.deadlines) lesson.deadlines = [];
    lesson.deadlines.push({
      id: 'dl-' + Date.now(),
      title: title,
      date: date
    });

    this.saveData();
    titleInput.value = '';
    dateInput.value = '';
    this.updateLessonBannerMeta(lesson);
    this.renderDeadlines(lesson);
  }

  handleDeleteDeadline(deadlineId) {
    const lesson = this.data.lessons.find(l => l.id === this.currentLessonId);
    if (!lesson) return;

    lesson.deadlines = lesson.deadlines.filter(d => d.id !== deadlineId);
    this.saveData();
    this.updateLessonBannerMeta(lesson);
    this.renderDeadlines(lesson);
  }

  calculateDaysLeft(targetDateStr) {
    const target = new Date(targetDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // --- Decks & Cards Controller ---
  renderDecks(lesson) {
    const grid = document.getElementById('decksGrid');
    grid.innerHTML = '';

    if (!lesson.decks || lesson.decks.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <i class="fa-solid fa-layer-group empty-state-icon"></i>
          <p style="font-size: 0.9rem;">No flashcard decks created yet.</p>
          <button class="btn btn-secondary" style="margin-top: 1rem;" id="btnInlineCreateDeck">
            <i class="fa-solid fa-plus"></i> Create First Deck
          </button>
        </div>
      `;
      const inlineBtn = document.getElementById('btnInlineCreateDeck');
      if (inlineBtn) {
        inlineBtn.addEventListener('click', () => this.openModal('modalCreateDeck'));
      }
      return;
    }

    lesson.decks.forEach(deck => {
      const cardCount = deck.cards ? deck.cards.length : 0;
      const cardEl = document.createElement('div');
      cardEl.className = 'deck-card';
      cardEl.innerHTML = `
        <div>
          <h4 class="deck-title">${this.escapeHTML(deck.deckName)}</h4>
          <span class="deck-badge"><i class="fa-solid fa-cards"></i> ${cardCount} cards</span>
        </div>
        <div class="deck-actions">
          <button class="btn btn-primary btn-study" ${cardCount === 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
            <i class="fa-solid fa-play"></i> Study
          </button>
          <button class="btn btn-secondary btn-manage">
            <i class="fa-solid fa-gear"></i> Cards
          </button>
          <button class="btn btn-danger btn-icon-only btn-delete-deck" title="Delete Deck">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;

      cardEl.querySelector('.btn-study').addEventListener('click', () => this.startStudyMode(deck));
      cardEl.querySelector('.btn-manage').addEventListener('click', () => this.openManageCardsModal(deck.deckId));
      cardEl.querySelector('.btn-delete-deck').addEventListener('click', () => this.handleDeleteDeck(deck.deckId));

      grid.appendChild(cardEl);
    });
  }

  handleCreateDeck(e) {
    e.preventDefault();
    if (!this.currentLessonId) return;

    const input = document.getElementById('inputDeckName');
    const name = input.value.trim();
    if (!name) return;

    const lesson = this.data.lessons.find(l => l.id === this.currentLessonId);
    if (!lesson) return;

    if (!lesson.decks) lesson.decks = [];
    lesson.decks.push({
      deckId: 'deck-' + Date.now(),
      deckName: name,
      cards: []
    });

    this.saveData();
    input.value = '';
    this.closeModal('modalCreateDeck');
    this.updateLessonBannerMeta(lesson);
    this.renderDecks(lesson);
  }

  handleDeleteDeck(deckId) {
    const lesson = this.data.lessons.find(l => l.id === this.currentLessonId);
    if (!lesson) return;

    if (confirm('Delete this flashcard deck?')) {
      lesson.decks = lesson.decks.filter(d => d.deckId !== deckId);
      this.saveData();
      this.updateLessonBannerMeta(lesson);
      this.renderDecks(lesson);
    }
  }

  // --- Manage Cards Modal ---
  openManageCardsModal(deckId) {
    this.currentManageDeckId = deckId;
    const lesson = this.data.lessons.find(l => l.id === this.currentLessonId);
    if (!lesson) return;
    const deck = lesson.decks.find(d => d.deckId === deckId);
    if (!deck) return;

    document.getElementById('manageCardsDeckTitle').textContent = `Manage: ${deck.deckName}`;
    this.renderManageCardsList(deck);
    this.openModal('modalManageCards');
  }

  renderManageCardsList(deck) {
    const list = document.getElementById('cardsModalList');
    list.innerHTML = '';

    if (!deck.cards || deck.cards.length === 0) {
      list.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-dim); text-align: center; padding: 1rem;">No cards in this deck yet. Add one above!</p>';
      return;
    }

    deck.cards.forEach(card => {
      const row = document.createElement('div');
      row.className = 'card-item-row';
      row.innerHTML = `
        <div class="card-item-content">
          <span class="card-front-text">Q: ${this.escapeHTML(card.front)}</span>
          <span class="card-back-text">A: ${this.escapeHTML(card.back)}</span>
        </div>
        <button class="delete-btn-sm" title="Delete Card">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;

      row.querySelector('.delete-btn-sm').addEventListener('click', () => this.handleDeleteCard(card.id));
      list.appendChild(row);
    });
  }

  handleAddCard(e) {
    e.preventDefault();
    if (!this.currentLessonId || !this.currentManageDeckId) return;

    const frontInput = document.getElementById('inputCardFront');
    const backInput = document.getElementById('inputCardBack');
    const front = frontInput.value.trim();
    const back = backInput.value.trim();

    if (!front || !back) return;

    const lesson = this.data.lessons.find(l => l.id === this.currentLessonId);
    const deck = lesson.decks.find(d => d.deckId === this.currentManageDeckId);
    if (!deck) return;

    if (!deck.cards) deck.cards = [];
    deck.cards.push({
      id: 'c-' + Date.now(),
      front: front,
      back: back
    });

    this.saveData();
    frontInput.value = '';
    backInput.value = '';
    this.renderManageCardsList(deck);
    this.renderDecks(lesson);
  }

  handleDeleteCard(cardId) {
    const lesson = this.data.lessons.find(l => l.id === this.currentLessonId);
    const deck = lesson.decks.find(d => d.deckId === this.currentManageDeckId);
    if (!deck) return;

    deck.cards = deck.cards.filter(c => c.id !== cardId);
    this.saveData();
    this.renderManageCardsList(deck);
    this.renderDecks(lesson);
  }

  // --- Interactive 3D Study Mode ---
  startStudyMode(deck) {
    if (!deck.cards || deck.cards.length === 0) return;

    this.studyDeck = deck;
    this.studyCards = [...deck.cards];
    this.studyIndex = 0;
    this.isCardFlipped = false;

    document.getElementById('studyDeckTitle').textContent = deck.deckName;
    document.getElementById('studyOverlay').classList.add('active');
    this.updateStudyCardUI();
  }

  closeStudyOverlay() {
    document.getElementById('studyOverlay').classList.remove('active');
  }

  flipStudyCard() {
    const scene = document.getElementById('flashcardScene');
    this.isCardFlipped = !this.isCardFlipped;
    scene.classList.toggle('flipped', this.isCardFlipped);
  }

  nextStudyCard() {
    if (this.studyIndex < this.studyCards.length - 1) {
      this.studyIndex++;
      this.resetFlipAndChangeCard();
    }
  }

  prevStudyCard() {
    if (this.studyIndex > 0) {
      this.studyIndex--;
      this.resetFlipAndChangeCard();
    }
  }

  resetFlipAndChangeCard() {
    const scene = document.getElementById('flashcardScene');
    if (this.isCardFlipped) {
      this.isCardFlipped = false;
      scene.classList.remove('flipped');
      setTimeout(() => this.updateStudyCardUI(), 200);
    } else {
      this.updateStudyCardUI();
    }
  }

  updateStudyCardUI() {
    const card = this.studyCards[this.studyIndex];
    if (!card) return;

    document.getElementById('flashcardFrontText').textContent = card.front;
    document.getElementById('flashcardBackText').textContent = card.back;

    // Progress bar and counter text
    const total = this.studyCards.length;
    const current = this.studyIndex + 1;
    const progressPercent = (current / total) * 100;

    document.getElementById('studyProgressFill').style.width = `${progressPercent}%`;
    document.getElementById('studyCounterText').textContent = `Card ${current} of ${total}`;

    // Enable/Disable buttons
    document.getElementById('btnStudyPrev').disabled = (this.studyIndex === 0);
    document.getElementById('btnStudyNext').disabled = (this.studyIndex === total - 1);
    
    document.getElementById('btnStudyPrev').style.opacity = (this.studyIndex === 0) ? '0.4' : '1';
    document.getElementById('btnStudyNext').style.opacity = (this.studyIndex === total - 1) ? '0.4' : '1';
  }

  // --- Pomodoro Timer Module ---
  initPomodoro() {
    this.updatePomoDisplay();
  }

  setPomoMode(mode) {
    if (this.isPomoRunning) {
      this.pausePomodoro();
    }
    this.pomoMode = mode;
    this.pomoTimeLeft = this.pomoDurations[mode];
    this.updatePomoDisplay();
  }

  togglePomodoro() {
    if (this.isPomoRunning) {
      this.pausePomodoro();
    } else {
      this.startPomodoro();
    }
  }

  startPomodoro() {
    this.isPomoRunning = true;
    document.getElementById('textTimerState').textContent = 'Pause';
    document.getElementById('iconTimerState').className = 'fa-solid fa-pause';

    this.pomoTimerId = setInterval(() => {
      this.pomoTimeLeft--;
      if (this.pomoTimeLeft <= 0) {
        this.pomoTimeLeft = 0;
        this.updatePomoDisplay();
        this.pausePomodoro();
        this.playTimerChime();
      } else {
        this.updatePomoDisplay();
      }
    }, 1000);
  }

  pausePomodoro() {
    this.isPomoRunning = false;
    if (this.pomoTimerId) clearInterval(this.pomoTimerId);
    document.getElementById('textTimerState').textContent = 'Start';
    document.getElementById('iconTimerState').className = 'fa-solid fa-play';
  }

  resetPomodoro() {
    this.pausePomodoro();
    this.pomoTimeLeft = this.pomoDurations[this.pomoMode];
    this.updatePomoDisplay();
  }

  updatePomoDisplay() {
    const minutes = Math.floor(this.pomoTimeLeft / 60);
    const seconds = this.pomoTimeLeft % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    document.getElementById('timerDisplay').textContent = timeStr;

    // SVG Progress Offset calculation (Max dasharray = 565)
    const total = this.pomoDurations[this.pomoMode];
    const offset = 565 - (this.pomoTimeLeft / total) * 565;
    document.getElementById('timerProgress').style.strokeDashoffset = offset;
  }

  playTimerChime() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.5);
    } catch (e) {
      console.log('Audio chime unavailable:', e);
    }
  }

  // --- Utility ---
  escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Initialize Application on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new StudyApp();
});
