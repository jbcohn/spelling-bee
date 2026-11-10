import { DEFAULT_WORD_LIST } from './words-data.js';

// --- Procedural Sound Effects via Web Audio API ---
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCorrect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Pleasant 2-note ascending major chord (E5 -> G#5)
    [659.25, 830.61].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  }

  playMastered() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Triumphant 3-note chime (C5 -> E5 -> G5 -> C6)
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0, now + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.45);
    });
  }

  playIncorrect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Gentle downward low tone boop (260Hz -> 180Hz)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.28);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }
}

// --- Speech Synthesis Manager ---
class SpeechManager {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.selectedVoice = null;
    this.rate = 0.9;
    this.pitch = 1.0;
    this.isSpeaking = false;
    this.onSpeakingStateChange = null;

    if (this.synth) {
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (!this.synth) return;
    const all = this.synth.getVoices().filter(v => v.lang.startsWith('en'));
    // Filter out robotic novelty/joke voices that sound terrible
    const jokeNames = ['Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos', 'Fred', 'Good News', 'Jester', 'Junior', 'Organ', 'Superstar', 'Ralph', 'Trinoids', 'Whisper', 'Zarvox', 'Wobble'];
    this.voices = all.filter(v => !jokeNames.some(joke => v.name.includes(joke)));

    if (this.voices.length === 0) this.voices = all;

    // Prioritize natural/enhanced human voices
    if (!this.selectedVoice && this.voices.length > 0) {
      const preferred = this.voices.find(v => 
        v.name.includes('Ava') ||
        v.name.includes('Natural') ||
        v.name.includes('Google US English') ||
        v.name.includes('Samantha') ||
        v.name.includes('Daniel') ||
        v.name.includes('Karen') ||
        v.name.includes('Moira')
      );
      this.selectedVoice = preferred || this.voices.find(v => v.lang === 'en-US') || this.voices[0];
    }
  }

  speak(text, options = {}) {
    if (!this.synth) {
      alert("Speech synthesis is not supported on this browser.");
      return;
    }

    this.synth.cancel(); // Stop prior speech

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = options.rate !== undefined ? options.rate : this.rate;
    utterance.pitch = options.pitch !== undefined ? options.pitch : this.pitch;

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (this.onSpeakingStateChange) this.onSpeakingStateChange(true);
    };

    utterance.onend = utterance.onerror = () => {
      this.isSpeaking = false;
      if (this.onSpeakingStateChange) this.onSpeakingStateChange(false);
    };

    this.synth.speak(utterance);
  }

  speakWord(word, slow = false) {
    const rate = slow ? Math.max(0.6, this.rate * 0.72) : this.rate;
    this.speak(word, { rate });
  }

  speakSpelled(word) {
    // Speaks letter by letter: "W - H - I - S - T - L - E ... whistle"
    const spelled = word.split('').join(' . ');
    const text = `${spelled}. ${word}.`;
    this.speak(text, { rate: Math.max(0.65, this.rate * 0.8) });
  }
}

// --- Main Spelling Bee Application ---
class SpellingBeeApp {
  constructor() {
    this.sfx = new SoundEffects();
    this.speech = new SpeechManager();

    // App state
    this.lists = [];
    this.currentListId = 'default-list';
    this.currentWord = null;
    this.previousWord = null;
    this.priorityQueue = []; // Queue of words missed in current session for rapid adaptive repetition
    this.sessionStreak = 0;
    this.isAnswering = true; // true when typing answer, false when reviewing feedback

    // User settings
    this.settings = {
      voiceURI: null,
      rate: 0.9,
      pitch: 1.0,
      sfx: true,
      autoSpeak: true,
      masteryThreshold: 3
    };

    this.cacheDom();
    this.loadState();
    this.initSpeechUI();
    this.bindEvents();
    this.registerPWA();

    // Start with a word
    this.selectList(this.currentListId, false);
    this.nextWord();
  }

  cacheDom() {
    // Header & Stats
    this.listSelect = document.getElementById('list-select');
    this.progressBarFill = document.getElementById('progress-bar-fill');
    this.statMastered = document.getElementById('stat-mastered');
    this.statLearning = document.getElementById('stat-learning');
    this.statReview = document.getElementById('stat-review');
    this.statStreak = document.getElementById('stat-streak');

    // Main Card
    this.questionCard = document.getElementById('question-card');
    this.completionCard = document.getElementById('completion-card');
    this.btnSpeakMain = document.getElementById('btn-speak-main');
    this.speakerStatusText = document.getElementById('speaker-status-text');

    // Assist Toolbar
    this.btnSpeakAgain = document.getElementById('btn-speak-again');
    this.btnSpeakSlow = document.getElementById('btn-speak-slow');
    this.btnShowSentence = document.getElementById('btn-show-sentence');
    this.btnShowDefinition = document.getElementById('btn-show-definition');
    this.btnHint = document.getElementById('btn-hint');

    // Clue Box
    this.clueBox = document.getElementById('clue-box');
    this.clueTypeTitle = document.getElementById('clue-type-title');
    this.clueContent = document.getElementById('clue-content');
    this.btnCloseClue = document.getElementById('btn-close-clue');

    // Input Form
    this.spellingForm = document.getElementById('spelling-form');
    this.wordInput = document.getElementById('word-input');
    this.btnSubmit = document.getElementById('btn-submit');
    this.btnGiveUp = document.getElementById('btn-give-up');
    this.currentWordLevel = document.getElementById('current-word-level');

    // Feedback Panel
    this.feedbackPanel = document.getElementById('feedback-panel');

    // Modals
    this.modalWords = document.getElementById('modal-words');
    this.modalManage = document.getElementById('modal-manage');
    this.modalSettings = document.getElementById('modal-settings');
    this.btnOpenWords = document.getElementById('btn-open-words');
    this.btnOpenManage = document.getElementById('btn-open-manage');
    this.btnOpenSettings = document.getElementById('btn-open-settings');

    // Words Modal elements
    this.modalListSubtitle = document.getElementById('modal-list-subtitle');
    this.wordsFilterSearch = document.getElementById('words-filter-search');
    this.wordsTableBody = document.getElementById('words-table-body');
    this.filterTabs = document.querySelectorAll('.filter-tab');
    this.btnResetAllStats = document.getElementById('btn-reset-all-stats');

    // Manage Lists Modal elements
    this.existingListsContainer = document.getElementById('existing-lists-container');
    this.formNewList = document.getElementById('form-new-list');
    this.newListName = document.getElementById('new-list-name');
    this.newListWords = document.getElementById('new-list-words');
    this.btnExportJson = document.getElementById('btn-export-json');
    this.inputImportJson = document.getElementById('input-import-json');

    // Settings Modal elements
    this.settingVoice = document.getElementById('setting-voice');
    this.btnTestVoice = document.getElementById('btn-test-voice');
    this.settingRate = document.getElementById('setting-rate');
    this.settingRateVal = document.getElementById('setting-rate-val');
    this.settingPitch = document.getElementById('setting-pitch');
    this.settingPitchVal = document.getElementById('setting-pitch-val');
    this.settingMasteryThreshold = document.getElementById('setting-mastery-threshold');
    this.settingSfx = document.getElementById('setting-sfx');
    this.settingAutospeak = document.getElementById('setting-autospeak');

    // Completion Card
    this.btnResetListProgress = document.getElementById('btn-reset-list-progress');
    this.btnSwitchListCompletion = document.getElementById('btn-switch-list-completion');
  }

  // --- LocalStorage & State Management ---
  loadState() {
    try {
      const savedLists = localStorage.getItem('spellbee_lists');
      if (savedLists) {
        this.lists = JSON.parse(savedLists);
      }
    } catch (e) {
      console.error('Failed to load lists from localStorage', e);
    }

    // Initialize default list if none exists
    if (!this.lists || this.lists.length === 0) {
      this.lists = [
        {
          id: 'default-list',
          name: 'Handwritten List (50 Words)',
          isDefault: true,
          words: DEFAULT_WORD_LIST.map(item => ({
            word: item.word.toLowerCase().trim(),
            sentence: item.sentence || '',
            definition: item.definition || '',
            timesSeen: 0,
            consecutiveCorrect: 0,
            mistakes: 0,
            lastSeen: 0,
            status: 'new' // 'new' | 'learning' | 'review' | 'mastered'
          }))
        }
      ];
      this.saveState();
    }

    // Sync default-list sentences/definitions while preserving progress stats
    const defaultList = this.lists.find(l => l.id === 'default-list');
    if (defaultList) {
      defaultList.words.forEach(w => {
        const ref = DEFAULT_WORD_LIST.find(d => d.word.toLowerCase() === w.word);
        if (ref) {
          w.sentence = ref.sentence || w.sentence;
          w.definition = ref.definition || w.definition;
        }
      });
    }

    try {
      const savedListId = localStorage.getItem('spellbee_current_list_id');
      if (savedListId && this.lists.some(l => l.id === savedListId)) {
        this.currentListId = savedListId;
      } else {
        this.currentListId = this.lists[0].id;
      }

      const savedSettings = localStorage.getItem('spellbee_settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }

    // Apply settings
    this.speech.rate = this.settings.rate;
    this.speech.pitch = this.settings.pitch;
    this.sfx.enabled = this.settings.sfx;

    this.renderListDropdown();
  }

  saveState() {
    try {
      localStorage.setItem('spellbee_lists', JSON.stringify(this.lists));
      localStorage.setItem('spellbee_current_list_id', this.currentListId);
      localStorage.setItem('spellbee_settings', JSON.stringify(this.settings));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }

  getCurrentList() {
    return this.lists.find(l => l.id === this.currentListId) || this.lists[0];
  }

  // --- Speech and Audio UI Setup ---
  initSpeechUI() {
    this.speech.onSpeakingStateChange = (speaking) => {
      if (speaking) {
        this.btnSpeakMain.classList.add('speaking');
        this.speakerStatusText.textContent = 'Speaking...';
      } else {
        this.btnSpeakMain.classList.remove('speaking');
        this.speakerStatusText.textContent = 'Click or tap to hear word';
      }
    };

    const populateVoiceSelect = () => {
      const voices = this.speech.voices;
      this.settingVoice.innerHTML = '';
      voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.voiceURI;
        option.textContent = `${voice.name} (${voice.lang})`;
        if (this.settings.voiceURI && voice.voiceURI === this.settings.voiceURI) {
          option.selected = true;
          this.speech.selectedVoice = voice;
        } else if (!this.settings.voiceURI && voice === this.speech.selectedVoice) {
          option.selected = true;
        }
        this.settingVoice.appendChild(option);
      });
    };

    populateVoiceSelect();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.addEventListener('voiceschanged', populateVoiceSelect);
    }

    // Settings UI values
    this.settingRate.value = this.settings.rate;
    this.settingRateVal.textContent = `${this.settings.rate}x`;
    this.settingPitch.value = this.settings.pitch;
    this.settingPitchVal.textContent = `${this.settings.pitch}`;
    this.settingMasteryThreshold.value = this.settings.masteryThreshold;
    this.settingSfx.checked = this.settings.sfx;
    this.settingAutospeak.checked = this.settings.autoSpeak;
  }

  // --- Spaced Repetition & Adaptive Scheduling Engine ---
  /**
   * Selects the next word to test based on adaptive spaced repetition:
   * 1. Priority Queue (words recently missed in this session) are presented after 1-2 words.
   * 2. Review words (historical mistakes or unmastered) get high weight.
   * 3. Learning words get moderate weight.
   * 4. New words get introduced gradually.
   * 5. Mastered words get occasional maintenance review.
   */
  pickNextWord() {
    const list = this.getCurrentList();
    if (!list || !list.words || list.words.length === 0) return null;

    const unmastered = list.words.filter(w => w.status !== 'mastered');

    // If everything is mastered!
    if (unmastered.length === 0) {
      return null;
    }

    // 1. Check priority queue for words needing immediate reinforcement
    if (this.priorityQueue.length > 0) {
      // Don't repeat the exact same word back-to-back if there are other choices
      if (this.priorityQueue[0] !== this.previousWord || unmastered.length === 1) {
        const word = this.priorityQueue.shift();
        return word;
      }
    }

    // 2. Weighted probabilistic selection
    const candidatePool = [];

    list.words.forEach(w => {
      // Avoid immediate repeat
      if (w === this.previousWord && list.words.length > 1) return;

      let weight = 0;
      switch (w.status) {
        case 'review':
          // Needs practice! Priority boost based on mistakes
          weight = 60 + (w.mistakes * 15);
          break;
        case 'learning':
          weight = 35 + (w.mistakes * 5) - (w.consecutiveCorrect * 8);
          break;
        case 'new':
          weight = 25;
          break;
        case 'mastered':
          // Low maintenance review weight
          weight = 2;
          break;
      }

      weight = Math.max(1, Math.round(weight));
      for (let i = 0; i < weight; i++) {
        candidatePool.push(w);
      }
    });

    if (candidatePool.length === 0) {
      return unmastered[0];
    }

    const randomIndex = Math.floor(Math.random() * candidatePool.length);
    return candidatePool[randomIndex];
  }

  nextWord() {
    this.isAnswering = true;
    this.feedbackPanel.classList.add('hidden');
    this.clueBox.classList.add('hidden');
    this.wordInput.value = '';
    this.wordInput.disabled = false;
    this.btnSubmit.disabled = false;

    const next = this.pickNextWord();

    if (!next) {
      // All mastered!
      this.questionCard.classList.add('hidden');
      this.completionCard.classList.remove('hidden');
      this.sfx.playMastered();
      this.spawnConfetti();
      this.updateStatsRibbon();
      return;
    }

    this.completionCard.classList.add('hidden');
    this.questionCard.classList.remove('hidden');

    this.previousWord = this.currentWord;
    this.currentWord = next;

    // Prefetch dictionary sentence/definition in background if missing (e.g., custom lists)
    this.enrichWordMetadata(this.currentWord);

    this.renderWordMasteryDots(this.currentWord);
    this.updateStatsRibbon();

    // Auto-focus input
    setTimeout(() => {
      this.wordInput.focus();
    }, 50);

    // Auto-speak word if enabled
    if (this.settings.autoSpeak) {
      setTimeout(() => {
        this.speech.speakWord(this.currentWord.word);
      }, 250);
    }
  }

  renderWordMasteryDots(word) {
    this.currentWordLevel.innerHTML = '';
    const max = this.settings.masteryThreshold;
    for (let i = 0; i < max; i++) {
      const dot = document.createElement('span');
      dot.className = `mastery-dot ${i < word.consecutiveCorrect ? 'active' : ''}`;
      dot.title = `Mastery ${word.consecutiveCorrect}/${max}`;
      this.currentWordLevel.appendChild(dot);
    }
  }

  updateStatsRibbon() {
    const list = this.getCurrentList();
    if (!list) return;

    const masteredCount = list.words.filter(w => w.status === 'mastered').length;
    const learningCount = list.words.filter(w => w.status === 'learning').length;
    const reviewCount = list.words.filter(w => w.status === 'review').length;
    const total = list.words.length;

    this.statMastered.textContent = masteredCount;
    this.statLearning.textContent = learningCount;
    this.statReview.textContent = reviewCount;
    this.statStreak.textContent = this.sessionStreak;

    const pct = total > 0 ? Math.round((masteredCount / total) * 100) : 0;
    this.progressBarFill.style.width = `${pct}%`;
  }

  // --- Answer Submission & Correction ---
  checkAnswer() {
    if (!this.isAnswering || !this.currentWord) return;

    const inputVal = this.wordInput.value.trim().toLowerCase();
    if (!inputVal) {
      this.wordInput.classList.add('shake');
      setTimeout(() => this.wordInput.classList.remove('shake'), 450);
      return;
    }

    const target = this.currentWord.word.toLowerCase().trim();
    this.isAnswering = false;
    this.wordInput.disabled = true;
    this.btnSubmit.disabled = true;

    this.currentWord.timesSeen++;
    this.currentWord.lastSeen = Date.now();

    if (inputVal === target) {
      // CORRECT!
      this.handleCorrect();
    } else {
      // INCORRECT!
      this.handleIncorrect(inputVal, target);
    }

    this.saveState();
    this.updateStatsRibbon();
    this.renderWordMasteryDots(this.currentWord);
  }

  handleCorrect() {
    this.sessionStreak++;
    this.currentWord.consecutiveCorrect++;

    const isMastered = this.currentWord.consecutiveCorrect >= this.settings.masteryThreshold;
    if (isMastered) {
      this.currentWord.status = 'mastered';
      this.sfx.playMastered();
      this.spawnConfetti();
    } else {
      this.currentWord.status = 'learning';
      this.sfx.playCorrect();
    }

    // Render feedback panel
    const dotsRemaining = Math.max(0, this.settings.masteryThreshold - this.currentWord.consecutiveCorrect);
    const subMessage = isMastered 
      ? '🌟 Word fully mastered! Fantastic job!' 
      : `Get it right ${dotsRemaining} more time${dotsRemaining > 1 ? 's' : ''} to master!`;

    this.feedbackPanel.className = 'feedback-panel feedback-correct';
    this.feedbackPanel.innerHTML = `
      <div class="feedback-banner">
        <span class="feedback-badge">🎉</span>
        <div>
          <div class="feedback-title">${isMastered ? 'Mastered!' : 'Correct!'}</div>
          <div class="feedback-sub">${subMessage}</div>
        </div>
      </div>
      <button id="btn-next-immediate" class="btn-next-word">
        Next Word ➔ (Press Enter)
      </button>
    `;
    this.feedbackPanel.classList.remove('hidden');

    const nextBtn = document.getElementById('btn-next-immediate');
    if (nextBtn) {
      nextBtn.focus();
      nextBtn.addEventListener('click', () => this.nextWord());
    }

    // Auto-advance smoothly after 1.4s
    this.autoAdvanceTimer = setTimeout(() => {
      if (!this.isAnswering) {
        this.nextWord();
      }
    }, 1400);
  }

  handleIncorrect(userAttempt, target) {
    this.sessionStreak = 0;
    this.currentWord.consecutiveCorrect = 0;
    this.currentWord.mistakes++;
    this.currentWord.status = 'review'; // Marked for prioritized adaptive review

    // Push into priority queue so student is quizzed again after 1-2 words
    this.priorityQueue.push(this.currentWord);

    this.sfx.playIncorrect();

    // Generate character-by-character visual diff
    const diffHtml = this.generateDiffHtml(userAttempt, target);

    // Speak spelling correction letter-by-letter
    setTimeout(() => {
      this.speech.speakSpelled(target);
    }, 350);

    this.feedbackPanel.className = 'feedback-panel feedback-incorrect';
    this.feedbackPanel.innerHTML = `
      <div class="feedback-banner">
        <span class="feedback-badge">💡</span>
        <div>
          <div class="feedback-title">Keep Going!</div>
          <div class="feedback-sub">We'll practice this word until it sticks.</div>
        </div>
      </div>

      <div class="comparison-container">
        <div class="comp-row">
          <span class="comp-label">Correct Spelling:</span>
          <span class="comp-spelling comp-correct-text">${target.toUpperCase()}</span>
        </div>
        <div class="comp-row">
          <span class="comp-label">Your Spelling:</span>
          <div class="comp-spelling">${diffHtml}</div>
        </div>
      </div>

      <!-- Retype Practice Requirement -->
      <div class="retype-box">
        <div class="retype-prompt">✍️ Practice it now: Type <strong>${target}</strong> below to lock it in memory:</div>
        <div class="retype-input-wrapper">
          <input 
            type="text" 
            id="retype-input" 
            class="retype-input" 
            placeholder="Type ${target} here..." 
            autocomplete="off" 
            autocorrect="off" 
            spellcheck="false" 
          />
          <button id="btn-retype-check" class="retype-btn">Next ➔</button>
        </div>
      </div>
    `;
    this.feedbackPanel.classList.remove('hidden');

    const retypeInput = document.getElementById('retype-input');
    const retypeBtn = document.getElementById('btn-retype-check');

    if (retypeInput) {
      setTimeout(() => retypeInput.focus(), 150);

      const verifyRetype = () => {
        if (retypeInput.value.trim().toLowerCase() === target) {
          this.sfx.playCorrect();
          this.nextWord();
        } else {
          retypeInput.classList.add('shake');
          setTimeout(() => retypeInput.classList.remove('shake'), 450);
          retypeInput.value = '';
          retypeInput.placeholder = `Type exact word: ${target}`;
        }
      };

      retypeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          verifyRetype();
        }
      });
      retypeBtn.addEventListener('click', verifyRetype);
    }
  }

  giveUp() {
    if (!this.isAnswering || !this.currentWord) return;
    this.handleIncorrect('[skipped]', this.currentWord.word);
    this.saveState();
    this.updateStatsRibbon();
    this.renderWordMasteryDots(this.currentWord);
  }

  // Visual diff algorithm highlighting character errors
  generateDiffHtml(userAttempt, target) {
    let result = '';
    const userChars = userAttempt.split('');
    const targetChars = target.split('');
    const maxLen = Math.max(userChars.length, targetChars.length);

    for (let i = 0; i < maxLen; i++) {
      const u = userChars[i];
      const t = targetChars[i];

      if (u === undefined) {
        // Missing letter from target
        result += `<span class="char-missing">_</span>`;
      } else if (t === undefined) {
        // Extra letter typed by user
        result += `<span class="char-wrong">${u.toUpperCase()}</span>`;
      } else if (u.toLowerCase() === t.toLowerCase()) {
        // Matching character
        result += `<span class="char-match">${u.toUpperCase()}</span>`;
      } else {
        // Mismatched letter
        result += `<span class="char-wrong">${u.toUpperCase()}</span>`;
      }
    }
    return result;
  }

  // --- Clues & Assistance Toolbar ---
  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  maskWordInText(text, word) {
    const safeText = this.escapeHtml(text);
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}(?:s|es|ed|ing)?\\b`, 'gi');
    const blanks = '_'.repeat(word.length);
    return safeText.replace(regex, `<span class="sentence-blank">${blanks}</span>`);
  }

  async enrichWordMetadata(wordObj) {
    if (!wordObj || (wordObj.sentence && wordObj.definition)) return;
    if (wordObj._dictChecked) return;
    wordObj._dictChecked = true;

    try {
      const resp = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(wordObj.word)}`);
      if (!resp.ok) return;
      const data = await resp.json();
      if (!Array.isArray(data) || data.length === 0) return;

      let foundDef = '';
      let foundExample = '';

      for (const entry of data) {
        if (!entry.meanings) continue;
        for (const meaning of entry.meanings) {
          if (!meaning.definitions) continue;
          for (const d of meaning.definitions) {
            if (!foundDef && d.definition) {
              foundDef = meaning.partOfSpeech
                ? `(${meaning.partOfSpeech}) ${d.definition}`
                : d.definition;
            }
            if (!foundExample && d.example) {
              foundExample = d.example;
            }
            if (foundDef && foundExample) break;
          }
          if (foundDef && foundExample) break;
        }
        if (foundDef && foundExample) break;
      }

      let updated = false;
      if (!wordObj.definition && foundDef) {
        wordObj.definition = foundDef;
        updated = true;
      }
      if (!wordObj.sentence && foundExample) {
        wordObj.sentence = foundExample;
        updated = true;
      }
      if (updated) {
        this.saveState();
      }
    } catch (e) {
      // Offline or lookup failed; fallbacks handle it
    }
  }

  async showSentence() {
    if (!this.currentWord) return;
    const wordObj = this.currentWord;

    if (!wordObj.sentence && !wordObj._dictChecked) {
      this.clueTypeTitle.textContent = 'Sentence Context';
      this.clueContent.textContent = 'Looking up an example sentence...';
      this.clueBox.classList.remove('hidden');
      await this.enrichWordMetadata(wordObj);
      if (this.currentWord !== wordObj) return;
    }

    if (wordObj.sentence) {
      this.clueTypeTitle.textContent = 'Sentence Context';
      this.clueContent.innerHTML = this.maskWordInText(wordObj.sentence, wordObj.word);
      this.clueBox.classList.remove('hidden');
      this.speech.speak(wordObj.sentence);
    } else if (wordObj.definition) {
      this.clueTypeTitle.textContent = 'Meaning Clue (No example sentence found)';
      this.clueContent.innerHTML = this.maskWordInText(wordObj.definition, wordObj.word);
      this.clueBox.classList.remove('hidden');
      this.speech.speak(`${wordObj.word}. Meaning: ${wordObj.definition}`);
    } else {
      this.clueTypeTitle.textContent = 'Clue';
      this.clueContent.textContent = `No sentence available for this ${wordObj.word.length}-letter word. Try Hint or Definition!`;
      this.clueBox.classList.remove('hidden');
      this.speech.speakWord(wordObj.word, true);
    }

    this.wordInput.focus();
  }

  async showDefinition() {
    if (!this.currentWord) return;
    const wordObj = this.currentWord;

    if (!wordObj.definition && !wordObj._dictChecked) {
      this.clueTypeTitle.textContent = 'Definition';
      this.clueContent.textContent = 'Looking up definition...';
      this.clueBox.classList.remove('hidden');
      await this.enrichWordMetadata(wordObj);
      if (this.currentWord !== wordObj) return;
    }

    const def = wordObj.definition || 'No definition available for this word.';
    this.clueTypeTitle.textContent = 'Definition';
    this.clueContent.innerHTML = this.maskWordInText(def, wordObj.word);
    this.clueBox.classList.remove('hidden');

    if (wordObj.definition) {
      this.speech.speak(`Definition: ${def}`);
    }
    this.wordInput.focus();
  }

  showHint() {
    if (!this.currentWord) return;
    const word = this.currentWord.word;
    const firstLetter = word[0].toUpperCase();
    const blanks = '_ '.repeat(word.length - 1).trim();
    this.clueTypeTitle.textContent = 'Spelling Hint';
    this.clueContent.innerHTML = `Starts with <strong>${firstLetter}</strong>: <code>${firstLetter} ${blanks}</code> (${word.length} letters)`;
    this.clueBox.classList.remove('hidden');

    this.speech.speak(`The word has ${word.length} letters, and begins with ${firstLetter}`);
    this.wordInput.focus();
  }

  // --- List Management ---
  renderListDropdown() {
    this.listSelect.innerHTML = '';
    this.lists.forEach(list => {
      const opt = document.createElement('option');
      opt.value = list.id;
      opt.textContent = `${list.name} (${list.words.length})`;
      if (list.id === this.currentListId) opt.selected = true;
      this.listSelect.appendChild(opt);
    });
  }

  selectList(listId, triggerNext = true) {
    this.currentListId = listId;
    this.priorityQueue = [];
    this.sessionStreak = 0;
    this.saveState();
    this.renderListDropdown();
    this.updateStatsRibbon();
    if (triggerNext) {
      this.nextWord();
    }
  }

  parseWordsInput(rawText) {
    // Supports:
    // 1. One word per line
    // 2. Comma separated
    // 3. word | sentence | definition
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsed = [];

    lines.forEach(line => {
      if (line.includes('|')) {
        const parts = line.split('|').map(p => p.trim());
        const word = parts[0].replace(/[^a-zA-Z'-]/g, '').toLowerCase();
        if (word) {
          parsed.push({
            word,
            sentence: parts[1] || '',
            definition: parts[2] || ''
          });
        }
      } else {
        // May contain comma separated words on one line
        const words = line.split(/[,;]+/).map(w => w.trim()).filter(Boolean);
        words.forEach(w => {
          const clean = w.replace(/[^a-zA-Z'-]/g, '').toLowerCase();
          if (clean) {
            parsed.push({
              word: clean,
              sentence: '',
              definition: ''
            });
          }
        });
      }
    });

    return parsed;
  }

  createNewList(name, rawWords) {
    const parsed = this.parseWordsInput(rawWords);
    if (parsed.length === 0) {
      alert('Please enter at least one valid word.');
      return;
    }

    const newList = {
      id: 'list-' + Date.now(),
      name: name.trim(),
      isDefault: false,
      words: parsed.map(p => ({
        word: p.word,
        sentence: p.sentence,
        definition: p.definition,
        timesSeen: 0,
        consecutiveCorrect: 0,
        mistakes: 0,
        lastSeen: 0,
        status: 'new'
      }))
    };

    this.lists.push(newList);
    this.saveState();
    this.renderListDropdown();
    this.selectList(newList.id);
  }

  deleteList(listId) {
    if (this.lists.length <= 1) {
      alert("You cannot delete the only remaining word list.");
      return;
    }
    if (!confirm("Are you sure you want to delete this list?")) return;

    this.lists = this.lists.filter(l => l.id !== listId);
    if (this.currentListId === listId) {
      this.currentListId = this.lists[0].id;
    }
    this.saveState();
    this.renderListDropdown();
    this.renderManageListsModal();
    this.selectList(this.currentListId);
  }

  resetCurrentListProgress() {
    if (!confirm("Reset all learning progress and mastery stats for this list?")) return;
    const list = this.getCurrentList();
    if (!list) return;

    list.words.forEach(w => {
      w.timesSeen = 0;
      w.consecutiveCorrect = 0;
      w.mistakes = 0;
      w.lastSeen = 0;
      w.status = 'new';
    });
    this.priorityQueue = [];
    this.sessionStreak = 0;
    this.saveState();
    this.updateStatsRibbon();
    this.nextWord();
  }

  // --- Modal Rendering ---
  renderWordsModal(filter = 'all', searchQuery = '') {
    const list = this.getCurrentList();
    if (!list) return;

    this.modalListSubtitle.textContent = `${list.name} (${list.words.length} words)`;
    this.wordsTableBody.innerHTML = '';

    const query = searchQuery.toLowerCase().trim();

    const filtered = list.words.filter(w => {
      if (filter !== 'all' && w.status !== filter) return false;
      if (query && !w.word.includes(query)) return false;
      return true;
    });

    if (filtered.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No words match your filter.</td>`;
      this.wordsTableBody.appendChild(tr);
      return;
    }

    filtered.forEach(w => {
      const tr = document.createElement('tr');
      const acc = w.timesSeen > 0 ? Math.round(((w.timesSeen - w.mistakes) / w.timesSeen) * 100) : '-';
      const badgeClass = `status-${w.status}`;

      tr.innerHTML = `
        <td style="font-weight: 700; color: #fff;">${w.word}</td>
        <td><span class="status-badge ${badgeClass}">${w.status}</span></td>
        <td>${w.consecutiveCorrect} / ${this.settings.masteryThreshold}</td>
        <td>${acc}${acc !== '-' ? '%' : ''}</td>
        <td>
          <button class="action-btn-mini btn-speak-word-row" title="Hear pronunciation">🔊</button>
          <button class="action-btn-mini btn-prioritize-row" title="Force into priority review">🎯</button>
        </td>
      `;

      tr.querySelector('.btn-speak-word-row').addEventListener('click', () => {
        this.speech.speakWord(w.word);
      });

      tr.querySelector('.btn-prioritize-row').addEventListener('click', () => {
        w.status = 'review';
        this.priorityQueue.unshift(w);
        this.saveState();
        this.renderWordsModal(filter, searchQuery);
        this.updateStatsRibbon();
        alert(`"${w.word}" has been prioritized in your review queue!`);
      });

      this.wordsTableBody.appendChild(tr);
    });
  }

  renderManageListsModal() {
    this.existingListsContainer.innerHTML = '';
    this.lists.forEach(list => {
      const item = document.createElement('div');
      item.className = `list-item-card ${list.id === this.currentListId ? 'active' : ''}`;
      const mastered = list.words.filter(w => w.status === 'mastered').length;

      item.innerHTML = `
        <div class="list-item-info">
          <h4>${list.name} ${list.id === this.currentListId ? '<span style="color:#818cf8; font-size:0.8rem;">(Active)</span>' : ''}</h4>
          <p>${list.words.length} words &bull; ${mastered} mastered</p>
        </div>
        <div class="list-item-actions">
          ${list.id !== this.currentListId ? `<button class="btn-secondary btn-switch-to-list" style="padding: 0.35rem 0.75rem; font-size: 0.85rem;">Select</button>` : ''}
          ${!list.isDefault ? `<button class="btn-danger-outline btn-delete-list" style="padding: 0.35rem 0.65rem; font-size: 0.85rem;">Delete</button>` : ''}
        </div>
      `;

      const switchBtn = item.querySelector('.btn-switch-to-list');
      if (switchBtn) {
        switchBtn.addEventListener('click', () => {
          this.selectList(list.id);
          this.renderManageListsModal();
        });
      }

      const delBtn = item.querySelector('.btn-delete-list');
      if (delBtn) {
        delBtn.addEventListener('click', () => this.deleteList(list.id));
      }

      this.existingListsContainer.appendChild(item);
    });
  }

  // --- Confetti particle animation ---
  spawnConfetti() {
    const colors = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#3b82f6'];
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = `${Math.random() * 0.4}s`;
      piece.style.animationDuration = `${1.8 + Math.random() * 1.5}s`;
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 3500);
    }
  }

  // --- Export and Import Lists ---
  exportListsJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.lists, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `spellbee_lists_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  }

  importListsJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported) && imported.length > 0 && imported[0].words) {
          this.lists = imported;
          this.currentListId = this.lists[0].id;
          this.saveState();
          this.renderListDropdown();
          this.renderManageListsModal();
          this.selectList(this.currentListId);
          alert('Lists successfully imported!');
        } else {
          alert('Invalid format. File must contain valid SpellBee list JSON.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  }

  // --- Event Bindings ---
  bindEvents() {
    // Top dropdown change
    this.listSelect.addEventListener('change', (e) => {
      this.selectList(e.target.value);
    });

    // Speaker buttons
    this.btnSpeakMain.addEventListener('click', () => {
      if (this.currentWord) this.speech.speakWord(this.currentWord.word);
      this.wordInput.focus();
    });

    this.btnSpeakAgain.addEventListener('click', () => {
      if (this.currentWord) this.speech.speakWord(this.currentWord.word);
      this.wordInput.focus();
    });

    this.btnSpeakSlow.addEventListener('click', () => {
      if (this.currentWord) this.speech.speakWord(this.currentWord.word, true);
      this.wordInput.focus();
    });

    // Assist buttons
    this.btnShowSentence.addEventListener('click', () => this.showSentence());
    this.btnShowDefinition.addEventListener('click', () => this.showDefinition());
    this.btnHint.addEventListener('click', () => this.showHint());
    this.btnCloseClue.addEventListener('click', () => this.clueBox.classList.add('hidden'));

    // Input submission
    this.spellingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.checkAnswer();
    });
    this.btnSubmit.addEventListener('click', () => this.checkAnswer());
    this.btnGiveUp.addEventListener('click', () => this.giveUp());

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      // If modal is open, let modal handle it
      if (document.querySelector('.modal-overlay:not(.hidden)')) return;

      if (e.code === 'Space' && document.activeElement !== this.wordInput && !document.activeElement.matches('input, textarea')) {
        e.preventDefault();
        if (this.currentWord) this.speech.speakWord(this.currentWord.word);
      } else if (e.key === 'Enter' && !this.isAnswering) {
        // Pressing Enter when feedback card is showing moves to next word immediately
        clearTimeout(this.autoAdvanceTimer);
        const nextImmediateBtn = document.getElementById('btn-next-immediate');
        if (nextImmediateBtn) {
          nextImmediateBtn.click();
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        this.showSentence();
      }
    });

    // Completion card buttons
    this.btnResetListProgress.addEventListener('click', () => this.resetCurrentListProgress());
    this.btnSwitchListCompletion.addEventListener('click', () => this.openModal(this.modalManage));

    // Modal Triggers
    this.btnOpenWords.addEventListener('click', () => {
      this.renderWordsModal('all', '');
      this.openModal(this.modalWords);
    });

    this.btnOpenManage.addEventListener('click', () => {
      this.renderManageListsModal();
      this.openModal(this.modalManage);
    });

    this.btnOpenSettings.addEventListener('click', () => {
      this.openModal(this.modalSettings);
    });

    // Close Modals
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        const modal = document.getElementById(modalId);
        if (modal) this.closeModal(modal);
      });
    });

    // Close modal on click outside
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal);
      });
    });

    // Filter tabs in Words modal
    this.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderWordsModal(tab.dataset.filter, this.wordsFilterSearch.value);
      });
    });

    this.wordsFilterSearch.addEventListener('input', (e) => {
      const activeFilter = document.querySelector('.filter-tab.active').dataset.filter;
      this.renderWordsModal(activeFilter, e.target.value);
    });

    this.btnResetAllStats.addEventListener('click', () => {
      this.resetCurrentListProgress();
      this.renderWordsModal();
    });

    // Form new list
    this.formNewList.addEventListener('submit', (e) => {
      e.preventDefault();
      this.createNewList(this.newListName.value, this.newListWords.value);
      this.newListName.value = '';
      this.newListWords.value = '';
      this.closeModal(this.modalManage);
    });

    // Export & Import
    this.btnExportJson.addEventListener('click', () => this.exportListsJSON());
    this.inputImportJson.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.importListsJSON(e.target.files[0]);
      }
    });

    // Settings inputs
    this.settingVoice.addEventListener('change', (e) => {
      this.settings.voiceURI = e.target.value;
      const voice = this.speech.voices.find(v => v.voiceURI === e.target.value);
      if (voice) this.speech.selectedVoice = voice;
      this.saveState();
    });

    this.btnTestVoice.addEventListener('click', () => {
      this.speech.speak("Welcome to the spelling bee! Spell accurately and have fun.");
    });

    this.settingRate.addEventListener('input', (e) => {
      this.settings.rate = parseFloat(e.target.value);
      this.speech.rate = this.settings.rate;
      this.settingRateVal.textContent = `${this.settings.rate}x`;
      this.saveState();
    });

    this.settingPitch.addEventListener('input', (e) => {
      this.settings.pitch = parseFloat(e.target.value);
      this.speech.pitch = this.settings.pitch;
      this.settingPitchVal.textContent = `${this.settings.pitch}`;
      this.saveState();
    });

    this.settingMasteryThreshold.addEventListener('change', (e) => {
      this.settings.masteryThreshold = parseInt(e.target.value, 10);
      this.saveState();
      this.updateStatsRibbon();
      if (this.currentWord) this.renderWordMasteryDots(this.currentWord);
    });

    this.settingSfx.addEventListener('change', (e) => {
      this.settings.sfx = e.target.checked;
      this.sfx.enabled = this.settings.sfx;
      this.saveState();
    });

    this.settingAutospeak.addEventListener('change', (e) => {
      this.settings.autoSpeak = e.target.checked;
      this.saveState();
    });
  }

  openModal(modal) {
    modal.classList.remove('hidden');
  }

  closeModal(modal) {
    modal.classList.add('hidden');
    if (this.isAnswering) {
      this.wordInput.focus();
    }
  }

  registerPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('PWA ServiceWorker registered', reg.scope))
          .catch(err => console.log('ServiceWorker registration error', err));
      });
    }
  }
}

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
  window.app = new SpellingBeeApp();
});
