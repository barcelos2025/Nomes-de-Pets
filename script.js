// =================================================================================
// ❗️ CONFIGURAÇÃO DO FIREBASE ATUALIZADA PARA "NOMES-DE-PETS" ❗️
// =================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDAbhQEiOSnDXp5J43Mp9wbs_6EckQ7UPQ",
  authDomain: "nomes-de-pets.firebaseapp.com",
  databaseURL: "https://nomes-de-pets-default-rtdb.firebaseio.com",
  projectId: "nomes-de-pets",
  storageBucket: "nomes-de-pets.firebasestorage.app",
  messagingSenderId: "239419487419",
  appId: "1:239419487419:web:cb206b0826b33add5aa59e",
  measurementId: "G-KVBKX0DK4N"
};

// Variáveis globais
let translations = {};
let names = [];
let favorites = [];
let shownNamesHistory = [];
let currentGenderFilter = 'todos';
let currentStyleFilter = 'All Styles';
let brazilianOnlyFilter = false;

// Estado do Modo Dupla
let isInCoupleMode = false;
let coupleSessionId = null;
let userId = null;
let database;
let coupleListeners = { names: null, generated: null, participants: null };
let partnerGeneratedNameSet = new Set();
let couplePartnerIds = [];
let coupleModeStats = { totalGenerated: 0, partnerMatches: 0 };

// Seletores do DOM
const resultContainer = document.getElementById('result-display');
const generateButton = document.getElementById('generate-btn');
const genderButtonsContainer = document.querySelector('.gender-options');
const styleFilterSelect = document.getElementById('culture-filter');
const brazilianOnlyCheckbox = document.getElementById('brazilian-only-checkbox');
const trendingContainer = document.getElementById('trending-names-container');
const favoritesSection = document.getElementById('favorites-section');
const favoritesList = document.getElementById('favorites-list');
const matchesSection = document.getElementById('matches-section');
const matchesList = document.getElementById('matches-list');
const shareFavoritesBtn = document.getElementById('share-favorites-btn');
const clearFavoritesBtn = document.getElementById('clear-favorites-btn');
const startQuizCard = document.getElementById('start-quiz-card');
const quizSection = document.getElementById('quiz-section');
const quizContainer = document.getElementById('quiz-container');
const quizCloseBtn = document.getElementById('quiz-close-btn');
const coupleModeCard = document.getElementById('couple-mode-card');
const shareListsCard = document.getElementById('share-lists-card');
const mainModal = document.getElementById('main-modal');
const modalOverlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');
const modalCloseBtn = document.getElementById('modal-close-btn');
const toastContainer = document.getElementById('toast-container');
const activeCoupleModeBanner = document.getElementById('active-couple-mode-banner');

// LÓGICA DO QUIZ
const quizData = {
    questions: [
        { questionKey: "q1_question", options: [{ key: "q1_opt1", scores: { classic: 1, funny: 0, geek: 2, human: 1 } }, { key: "q1_opt2", scores: { classic: 0, funny: 2, geek: 1, human: 0 } }] },
        { questionKey: "q2_question", options: [{ key: "q2_opt1", scores: { classic: 0, funny: 2, geek: 0, human: 1 } }, { key: "q2_opt2", scores: { classic: 1, funny: 0, geek: 2, human: 0 } }] },
        { questionKey: "q3_question", options: [{ key: "q3_opt1", scores: { classic: 0, funny: 0, geek: 2, human: 1 } }, { key: "q3_opt2", scores: { classic: 2, funny: 1, geek: 0, human: 0 } }] },
        { questionKey: "q4_question", options: [{ key: "q4_opt1", scores: { classic: 0, funny: 1, geek: 0, human: 2 } }, { key: "q4_opt2", scores: { classic: 2, funny: 1, geek: 1, human: 0 } }] },
        { questionKey: "q5_question", options: [{ key: "q5_opt1", scores: { classic: 0, funny: 2, geek: 0, human: 0 } }, { key: "q5_opt2", scores: { classic: 0, funny: 0, geek: 2, human: 1 } }, { key: "q5_opt3", scores: { classic: 2, funny: 0, geek: 0, human: 1 } }] }
    ],
    results: {
        classic: { titleKey: "style_classic_title", descKey: "style_classic_desc" },
        funny: { titleKey: "style_modern_title", descKey: "style_modern_desc" },
        geek: { titleKey: "style_nature_title", descKey: "style_nature_desc" },
        human: { titleKey: "style_romantic_title", descKey: "style_romantic_desc" }
    },
    userScores: { classic: 0, funny: 0, geek: 0, human: 0 },
    currentQuestionIndex: 0,
    selectedGender: null
};

function startQuiz() { document.body.classList.add('quiz-active'); quizData.userScores = { classic: 0, funny: 0, geek: 0, human: 0 }; quizData.currentQuestionIndex = 0; quizData.selectedGender = null; quizSection.style.display = 'flex'; displayGenderSelection(); }
function exitQuiz() { document.body.classList.remove('quiz-active'); quizSection.style.display = 'none'; }
function displayGenderSelection() { const currentLang = localStorage.getItem('language') || 'en'; quizContainer.innerHTML = `<h3>${translations[currentLang].quizGenderTitle}</h3><div class="quiz-gender-options"><button class="quiz-gender-btn" data-gender="macho">${translations[currentLang].quizGenderBoy}</button><button class="quiz-gender-btn" data-gender="femea">${translations[currentLang].quizGenderGirl}</button><button class="quiz-gender-btn" data-gender="unissex">${translations[currentLang].quizGenderUnisex}</button></div>`; document.querySelectorAll('.quiz-gender-btn').forEach(btn => { btn.addEventListener('click', (e) => { quizData.selectedGender = e.target.dataset.gender; displayQuizQuestion(); }); }); }
function displayQuizQuestion() { const currentLang = localStorage.getItem('language') || 'en'; if (quizData.currentQuestionIndex >= quizData.questions.length) { displayQuizResult(); return; } const questionData = quizData.questions[quizData.currentQuestionIndex]; const progress = (quizData.currentQuestionIndex / quizData.questions.length) * 100; const questionText = translations[currentLang][questionData.questionKey]; let optionsHTML = ''; questionData.options.forEach(option => { const optionText = translations[currentLang][option.key]; optionsHTML += `<button class="quiz-option-btn">${optionText}</button>`; }); quizContainer.innerHTML = `<div class="quiz-progress-bar-container"><div class="quiz-progress-bar" style="width: ${progress}%;"></div></div><h3 class="quiz-question">${questionText || ''}</h3><div class="quiz-options">${optionsHTML}</div>`; document.querySelectorAll('.quiz-option-btn').forEach((btn, index) => { btn.addEventListener('click', () => { handleAnswer(index); }); }); }
function handleAnswer(optionIndex) { const question = quizData.questions[quizData.currentQuestionIndex]; const selectedOption = question.options[optionIndex]; for (const style in selectedOption.scores) { quizData.userScores[style] += selectedOption.scores[style]; } quizData.currentQuestionIndex++; displayQuizQuestion(); }
function getStyleSuggestions(style, gender) { const styleToTagsMap = { classic: ['Clássico', 'Humano'], funny: ['Engraçado', 'Comida'], geek: ['Geek', 'Místico'], human: ['Humano', 'Clássico'] }; let filteredNames = names.filter(name => { return name.gender === gender || name.gender === 'unissex'; }); let styleFiltered = filteredNames.filter(name => name.tags && name.tags.some(tag => styleToTagsMap[style].includes(tag))); if (styleFiltered.length < 5) { styleFiltered = [...styleFiltered, ...filteredNames.filter(n => !styleFiltered.includes(n))]; } return styleFiltered.sort(() => 0.5 - Math.random()).slice(0, 5); }
function displayQuizResult() { let finalStyle = 'funny'; let maxScore = -1; for (const style in quizData.userScores) { if (quizData.userScores[style] > maxScore) { maxScore = quizData.userScores[style]; finalStyle = style; } } const result = quizData.results[finalStyle]; if (!result) { console.error("Estilo de resultado do quiz não encontrado:", finalStyle); return; } const currentLang = localStorage.getItem('language') || 'en'; const suggestions = getStyleSuggestions(finalStyle, quizData.selectedGender); let suggestionsHTML = ''; if (suggestions.length > 0) { suggestions.forEach(name => { let nameClass = ''; if (name.gender === 'femea') nameClass = 'name-girl'; else if (name.gender === 'macho') nameClass = 'name-boy'; else nameClass = 'name-unissex'; suggestionsHTML += `<div class="suggestion-card"><div class="name ${nameClass}">${name.name}</div><div class="meaning">"${name.meaning}"</div></div>`; }); } quizContainer.innerHTML = `<div class="quiz-result"><h4>${translations[currentLang].quizResultTitle}</h4><p class="result-style">${translations[currentLang][result.titleKey]}</p><p>${translations[currentLang][result.descKey]}</p><div class="quiz-suggestions-container"><h4>${translations[currentLang].quizSuggestionsTitle}</h4>${suggestionsHTML}</div><button id="restart-quiz-btn" class="btn btn-primary" style="margin-top: 30px;"><i class="fa-solid fa-arrows-rotate"></i> <span>${translations[currentLang].quizRestartButton}</span></button></div>`; document.getElementById('restart-quiz-btn').addEventListener('click', startQuiz); }

// LÓGICA DO MODAL E MODO DUPLA... (sem alterações)
function openModal() { mainModal.style.display = 'block'; modalOverlay.style.display = 'block'; }
function closeModal() { mainModal.style.display = 'none'; modalOverlay.style.display = 'none'; }
async function cleanupOldFirebaseSessions() { try { const MAX_AGE_DAYS = 30; const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000; const sessionsRef = database.ref('sessions'); const snapshot = await sessionsRef.orderByChild('lastActivity').endAt(cutoff).once('value'); if (snapshot.exists()) { const updates = {}; snapshot.forEach(childSnapshot => { updates[childSnapshot.key] = null; }); await sessionsRef.update(updates); } } catch (error) { console.error("Erro ao limpar sessões antigas:", error); } }
function initCoupleMode() { cleanupOldFirebaseSessions(); const currentLang = localStorage.getItem('language') || 'en'; modalContent.innerHTML = `<h3>${translations[currentLang].coupleModeIntroTitle}</h3><p>${translations[currentLang].coupleModeIntroDesc}</p><p class="disclaimer-text">${translations[currentLang].coupleModeDisclaimer}</p><div class="choice-buttons"><button id="create-session-btn" class="btn btn-primary">${translations[currentLang].createSessionButton}</button><button id="join-session-btn" class="btn btn-small">${translations[currentLang].joinSessionButton}</button></div>`; openModal(); document.getElementById('create-session-btn').addEventListener('click', displayCreateSession); document.getElementById('join-session-btn').addEventListener('click', displayJoinSession); }
function displayCreateSession() { const currentLang = localStorage.getItem('language') || 'en'; const newSessionId = Math.random().toString(36).substring(2, 8).toUpperCase(); modalContent.innerHTML = `<h3>${translations[currentLang].createSessionTitle}</h3><p>${translations[currentLang].createSessionDesc}</p><div class="session-code">${newSessionId}</div><button id="copy-code-btn" class="btn btn-primary"><i class="fa-solid fa-copy"></i> <span>${translations[currentLang].copyCodeButton}</span></button>`; document.getElementById('copy-code-btn').addEventListener('click', () => { navigator.clipboard.writeText(newSessionId).then(() => { showToast('listCopiedToast'); startCoupleSession(newSessionId); setTimeout(closeModal, 500); }); }); }
function displayJoinSession() { const currentLang = localStorage.getItem('language') || 'en'; modalContent.innerHTML = `<h3>${translations[currentLang].joinSessionTitle}</h3><input type="text" id="session-input" class="session-input" maxlength="6" placeholder="${translations[currentLang].joinSessionInputPlaceholder}"><button id="connect-btn" class="btn btn-primary">${translations[currentLang].connectButton}</button>`; document.getElementById('connect-btn').addEventListener('click', async () => { const inputId = document.getElementById('session-input').value.toUpperCase(); if (inputId.length === 6) { const sessionRef = database.ref('sessions/' + inputId); const snapshot = await sessionRef.once('value'); if (snapshot.exists()) { clearLocalFavorites(); startCoupleSession(inputId); closeModal(); } else { showToast('invalidCodeError'); } } else { showToast('invalidCodeError'); } }); }
function startCoupleSession(sessionId) {
    const previousSessionId = coupleSessionId;
    if (previousSessionId) {
        detachCoupleListeners(previousSessionId);
    }
    coupleSessionId = sessionId;
    isInCoupleMode = true;
    resetCoupleModeContext();
    localStorage.setItem('coupleSessionId', coupleSessionId);
    const currentLang = localStorage.getItem('language') || 'en';
    activeCoupleModeBanner.innerHTML = `<div class="banner-main-line"><span>${translations[currentLang].coupleModeActive}${coupleSessionId}</span><button id="end-session-btn">${translations[currentLang].endSession}</button></div><div class="banner-tip-line"><i class="fa-solid fa-circle-info"></i> ${translations[currentLang].coupleModeTip}</div>`;
    activeCoupleModeBanner.style.display = 'flex';
    document.getElementById('end-session-btn').addEventListener('click', endCoupleSession);
    matchesSection.style.display = 'block';
    const sessionRef = database.ref('sessions/' + coupleSessionId);
    sessionRef.child('lastActivity').set(firebase.database.ServerValue.TIMESTAMP);
    registerCoupleParticipant(sessionRef);
    const namesRef = sessionRef.child('names');
    coupleListeners.names = namesRef.on('value', (snapshot) => {
        const data = snapshot.val();
        renderMatches(data);
    });
    const generatedRef = sessionRef.child('generated');
    coupleListeners.generated = generatedRef.on('value', (snapshot) => {
        const generatedData = snapshot.val() || {};
        updatePartnerGeneratedPool(generatedData);
    });
    const participantsRef = sessionRef.child('participants');
    coupleListeners.participants = participantsRef.on('value', (snapshot) => {
        const participants = snapshot.val() || {};
        couplePartnerIds = Object.keys(participants).filter(id => id !== userId);
    });
}
function endCoupleSession() {
    const sessionId = coupleSessionId;
    if (database && sessionId) {
        detachCoupleListeners(sessionId);
        database.ref('sessions/' + sessionId + '/participants/' + userId).remove();
    }
    isInCoupleMode = false;
    coupleSessionId = null;
    localStorage.removeItem('coupleSessionId');
    activeCoupleModeBanner.style.display = 'none';
    matchesSection.style.display = 'none';
    matchesList.innerHTML = '';
    resetCoupleModeContext();
}
function renderMatches(data) { if (!data) { matchesList.innerHTML = ''; return; } let matchesHTML = ''; Object.keys(data).forEach(nameStr => { const likers = Object.keys(data[nameStr]); if (likers.length > 1) { const nameObject = names.find(n => n.name === nameStr); if(nameObject) { let nameClass = ''; if (nameObject.gender === 'femea') nameClass = 'name-girl'; else if (nameObject.gender === 'macho') nameClass = 'name-boy'; else if (nameObject.gender === 'unissex') nameClass = 'name-unisex'; matchesHTML += `<div class="favorite-card"><div class="favorite-card-name ${nameClass}">${nameObject.name}</div></div>`; } } }); matchesList.innerHTML = matchesHTML; }
function resetCoupleModeContext() {
    partnerGeneratedNameSet = new Set();
    couplePartnerIds = [];
    coupleModeStats = { totalGenerated: 0, partnerMatches: 0 };
}
function detachCoupleListeners(sessionId) {
    if (!database || !sessionId) {
        return;
    }
    const sessionRef = database.ref('sessions/' + sessionId);
    if (coupleListeners.names) {
        sessionRef.child('names').off('value', coupleListeners.names);
    }
    if (coupleListeners.generated) {
        sessionRef.child('generated').off('value', coupleListeners.generated);
    }
    if (coupleListeners.participants) {
        sessionRef.child('participants').off('value', coupleListeners.participants);
    }
    coupleListeners = { names: null, generated: null, participants: null };
}
function registerCoupleParticipant(sessionRef) {
    if (!sessionRef || !userId) {
        return;
    }
    const participantRef = sessionRef.child('participants/' + userId);
    participantRef.update({
        joinedAt: firebase.database.ServerValue.TIMESTAMP,
        lastActive: firebase.database.ServerValue.TIMESTAMP
    });
    participantRef.onDisconnect().remove();
}
function updatePartnerGeneratedPool(generatedData) {
    const updatedSet = new Set();
    Object.keys(generatedData || {}).forEach(uid => {
        if (uid === userId) {
            return;
        }
        const userGenerated = generatedData[uid];
        if (userGenerated && typeof userGenerated === 'object') {
            Object.keys(userGenerated).forEach(nameKey => {
                updatedSet.add(nameKey);
            });
        }
    });
    partnerGeneratedNameSet = updatedSet;
}
function recordCoupleGeneratedName(nameObject) {
    if (!isInCoupleMode || !database || !coupleSessionId || !nameObject || !nameObject.name) {
        return;
    }
    const sessionRef = database.ref('sessions/' + coupleSessionId);
    const updates = {};
    updates['generated/' + userId + '/' + nameObject.name] = firebase.database.ServerValue.TIMESTAMP;
    updates['lastActivity'] = firebase.database.ServerValue.TIMESTAMP;
    updates['participants/' + userId + '/lastActive'] = firebase.database.ServerValue.TIMESTAMP;
    sessionRef.update(updates);
}
function shouldUsePartnerGeneratedName(partnerCandidateCount) {
    if (!isInCoupleMode || partnerCandidateCount === 0 || couplePartnerIds.length === 0) {
        return false;
    }
    const nextTotal = coupleModeStats.totalGenerated + 1;
    const requiredMatches = Math.ceil(nextTotal * 0.4);
    return coupleModeStats.partnerMatches < requiredMatches;
}


// FUNÇÕES GERAIS
const setLanguage = (lang) => { document.documentElement.lang = lang; localStorage.setItem('language', lang); document.querySelectorAll('[data-i18n-key]').forEach(element => { const key = element.getAttribute('data-i18n-key'); if (!translations[lang] || !translations[lang][key]) return; const translation = translations[lang][key]; const icon = element.querySelector('i'); const span = element.querySelector('span'); if (icon && span) { span.textContent = translation; } else if (element.tagName.toLowerCase() !== 'label') { element.textContent = translation; } else if(element.tagName.toLowerCase() === 'option') { element.textContent = translation; } }); document.title = translations[lang]?.pageTitle || translations['en'].pageTitle; };
const getWeekNumber = (d) => { d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7)); var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1)); var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7); return weekNo; }
const stringToSeed = (str) => { let hash = 0; for (let i = 0; i < str.length; i++) { const char = str.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash = hash & hash; } return hash; }
const mulberry32 = (a) => { return function() { var t = a += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; } }
const updateTrendingNames = () => { const now = new Date(); const weekSeedStr = `${now.getFullYear()}-${getWeekNumber(now)}`; const seed = stringToSeed(weekSeedStr); const random = mulberry32(seed); const shuffled = [...names].sort(() => random() - 0.5); const trendingNames = shuffled.slice(0, 3); const statuses = [ { class: 'rising', icon: 'fa-arrow-trend-up', popKey: "popularityRising" }, { class: 'top-pick', icon: 'fa-star', popKey: "popularityTopPick" }, { class: 'popular', icon: 'fa-fire', popKey: "popularityPopular" } ]; trendingContainer.innerHTML = ''; const currentLang = localStorage.getItem('language') || 'en'; trendingNames.forEach((name, index) => { const status = statuses[index]; const tagKey = `tag${status.class.charAt(0).toUpperCase() + status.class.slice(1).replace('-p', 'P')}`; const popularityText = translations[currentLang][status.popKey] || ''; const cardHTML = `<div class="trending-card ${status.class}"><div class="icon-status"><i class="fa-solid ${status.icon}"></i></div><h4 class="name">${name.name}</h4><span class="tag tag-${status.class}" data-i18n-key="${tagKey}">${translations[currentLang][tagKey]}</span><p class="popularity">${popularityText}</p></div>`; trendingContainer.innerHTML += cardHTML; }); };
const renderFavorites = () => { if (favorites.length === 0) { favoritesSection.style.display = 'none'; return; } favoritesSection.style.display = 'block'; favoritesList.innerHTML = ''; favorites.forEach(favName => { const card = document.createElement('div'); card.className = 'favorite-card'; let nameClass = ''; if (favName.gender === 'femea') { nameClass = 'name-girl'; } else if (favName.gender === 'macho') { nameClass = 'name-boy'; } else if (favName.gender === 'unissex') { nameClass = 'name-unisex'; } card.innerHTML = `<div class="favorite-card-name ${nameClass}">${favName.name}</div><button class="remove-fav-btn" data-name="${favName.name}" title="Remove favorite">&times;</button>`; favoritesList.appendChild(card); }); };
function clearLocalFavorites() { favorites = []; localStorage.removeItem('favoriteNames'); renderFavorites(); }
const saveFavorite = (nameObject) => { const isAlreadyFavorite = favorites.some(fav => fav.name === nameObject.name); if (!isAlreadyFavorite) { favorites.push(nameObject); localStorage.setItem('favoriteNames', JSON.stringify(favorites)); renderFavorites(); } if (isInCoupleMode) { const sessionRef = database.ref('sessions/' + coupleSessionId); const updates = {}; updates[`names/${nameObject.name}/${userId}`] = true; updates['lastActivity'] = firebase.database.ServerValue.TIMESTAMP; sessionRef.update(updates); } };
function showToast(messageKey) { const currentLang = localStorage.getItem('language') || 'en'; const message = translations[currentLang][messageKey]; const toast = document.createElement('div'); toast.className = 'toast-notification'; toast.textContent = message; toastContainer.appendChild(toast); setTimeout(() => { toast.remove(); }, 3000); }
const shareSingleName = (nameObject) => { const currentLang = localStorage.getItem('language') || 'en'; let textTemplate = translations[currentLang].shareNameText; const textToCopy = textTemplate.replace('%name%', nameObject.name).replace('%meaning%', nameObject.meaning); navigator.clipboard.writeText(textToCopy).then(() => { showToast('listCopiedToast'); }).catch(err => console.error('Failed to copy name: ', err)); };
function displaySelectedName(selectedName) { const currentLang = localStorage.getItem('language') || 'en'; let tagsHTML = ''; if (selectedName.tags) { selectedName.tags.forEach(tag => { tagsHTML += `<span class="tag">${tag}</span>`; }); } let nameClass = ''; if (currentGenderFilter === 'femea') { nameClass = 'name-girl'; } else if (currentGenderFilter === 'macho') { nameClass = 'name-boy'; } else { if (selectedName.gender === 'femea') nameClass = 'name-girl'; else if (selectedName.gender === 'macho') nameClass = 'name-boy'; else nameClass = 'name-unisex'; } resultContainer.innerHTML = `<div><h3 class="result-name ${nameClass}">${selectedName.name}</h3><div class="result-tags">${tagsHTML}</div><p class="result-meaning">"${selectedName.meaning}"</p><div class="name-actions"><button class="action-btn save-favorite"><i class="fa-regular fa-heart"></i><span data-i18n-key="saveFavorite">${translations[currentLang].saveFavorite}</span></button><button class="action-btn share-name-btn"><i class="fa-solid fa-share-alt"></i><span data-i18n-key="shareNameButton">${translations[currentLang].shareNameButton}</span></button></div></div>`; resultContainer.querySelector('.save-favorite').addEventListener('click', () => saveFavorite(selectedName)); resultContainer.querySelector('.share-name-btn').addEventListener('click', () => shareSingleName(selectedName)); }
async function generateNewName() {
    if (names.length === 0) return;
    const filteredNames = names.filter(name => {
        const genderMatch = currentGenderFilter === 'todos' || name.gender === currentGenderFilter || (currentGenderFilter === 'macho' && name.gender === 'unissex') || (currentGenderFilter === 'femea' && name.gender === 'unissex');
        const styleMatch = (currentStyleFilter === 'All Styles') || (name.tags && name.tags.includes(currentStyleFilter));
        const brazilianMatch = (!brazilianOnlyFilter) || (brazilianOnlyFilter && name.tags && name.tags.includes('Brasileiro'));
        return genderMatch && styleMatch && brazilianMatch;
    });
    const currentLang = localStorage.getItem('language') || 'en';
    if (filteredNames.length === 0) {
        resultContainer.innerHTML = `<div><p>${translations[currentLang].noNamesFound}</p><p style="font-size:0.9rem; color:#888;">${translations[currentLang].tryDifferent}</p></div>`;
        return;
    }
    let availableNames = filteredNames.filter(name => !shownNamesHistory.includes(name.name));
    if (availableNames.length === 0 && filteredNames.length > 0) {
        showToast('allNamesSeen');
        const filteredNameStrings = filteredNames.map(n => n.name);
        shownNamesHistory = shownNamesHistory.filter(name => !filteredNameStrings.includes(name));
        availableNames = filteredNames;
    }
    if (availableNames.length === 0) {
        resultContainer.innerHTML = `<div><p>${translations[currentLang].noNamesFound}</p><p style="font-size:0.9rem; color:#888;">${translations[currentLang].tryDifferent}</p></div>`;
        return;
    }
    let selectedName = null;
    if (isInCoupleMode && partnerGeneratedNameSet.size > 0) {
        const partnerCandidates = availableNames.filter(name => partnerGeneratedNameSet.has(name.name));
        if (shouldUsePartnerGeneratedName(partnerCandidates.length)) {
            const partnerIndex = Math.floor(Math.random() * partnerCandidates.length);
            selectedName = partnerCandidates[partnerIndex];
        }
    }
    if (!selectedName) {
        const randomIndex = Math.floor(Math.random() * availableNames.length);
        selectedName = availableNames[randomIndex];
    }
    if (selectedName) {
        shownNamesHistory.push(selectedName.name);
        if (isInCoupleMode) {
            coupleModeStats.totalGenerated++;
            if (partnerGeneratedNameSet.has(selectedName.name)) {
                coupleModeStats.partnerMatches++;
            }
            recordCoupleGeneratedName(selectedName);
        }
        displaySelectedName(selectedName);
    }
}
const themedLists = [ { titleKey: 'theme_mythological', filter: (n) => n.tags.includes('Místico')}, { titleKey: 'theme_nature', filter: (n) => n.tags.includes('Natureza') }, { titleKey: 'theme_strong', filter: (n) => n.tags.includes('Comida') }, { titleKey: 'theme_celestial', filter: (n) => n.tags.includes('Geek') } ];
function openThemedListsModal() { openModal(); displayThemeSelection(); }
function displayThemeSelection() { const currentLang = localStorage.getItem('language') || 'en'; let themesHTML = `<h3>${translations[currentLang].themedListsTitle}</h3>`; themedLists.forEach(theme => { themesHTML += `<button class="theme-list-item" data-titlekey="${theme.titleKey}">${translations[currentLang][theme.titleKey]}</button>`; }); modalContent.innerHTML = themesHTML; document.querySelectorAll('.theme-list-item').forEach(btn => { btn.addEventListener('click', (e) => { const titleKey = e.target.dataset.titlekey; const theme = themedLists.find(t => t.titleKey === titleKey); displayNamesForTheme(theme); }); }); }
function displayNamesForTheme(theme) { const currentLang = localStorage.getItem('language') || 'en'; const listNames = names.filter(theme.filter).sort(() => 0.5 - Math.random()); const themeTitle = translations[currentLang][theme.titleKey]; let namesHTML = '<ul class="themed-name-list">'; listNames.slice(0, 20).forEach(name => { let nameClass = ''; if (name.gender === 'femea') nameClass = 'name-girl'; else if (name.gender === 'macho') nameClass = 'name-boy'; else if (name.gender === 'unissex') nameClass = 'name-unisex'; namesHTML += `<li class="${nameClass}">${name.name}</li>`; }); namesHTML += '</ul>'; modalContent.innerHTML = `<h3>${themeTitle}</h3>${namesHTML}<div class="modal-footer"><button id="back-to-themes" class="btn btn-small"><i class="fa-solid fa-arrow-left"></i> <span>${translations[currentLang].backToThemes}</span></button><button id="share-theme-list" class="btn btn-primary"><i class="fa-solid fa-share-alt"></i> <span>${translations[currentLang].shareThisList}</span></button></div>`; document.getElementById('back-to-themes').addEventListener('click', displayThemeSelection); document.getElementById('share-theme-list').addEventListener('click', () => { let textToCopy = `${themeTitle}:\n\n`; listNames.slice(0, 20).forEach(name => { textToCopy += `- ${name.name}\n`; }); navigator.clipboard.writeText(textToCopy).then(() => { showToast('listCopiedToast'); }); }); }

// =================================================================================
// ❗️ FUNÇÃO setupEventListeners ATUALIZADA ❗️
// =================================================================================
function setupEventListeners() {
    favoritesList.addEventListener('click', (event) => { if (event.target.classList.contains('remove-fav-btn')) { const nameToRemove = event.target.getAttribute('data-name'); favorites = favorites.filter(fav => fav.name !== nameToRemove); localStorage.setItem('favoriteNames', JSON.stringify(favorites)); renderFavorites(); } });
    clearFavoritesBtn.addEventListener('click', () => { const currentLang = localStorage.getItem('language') || 'en'; const confirmationText = translations[currentLang].clearConfirm; if (confirm(confirmationText)) { clearLocalFavorites() } });
    shareFavoritesBtn.addEventListener('click', () => { const currentLang = localStorage.getItem('language') || 'en'; if (favorites.length === 0) return; let textToCopy = translations[currentLang].favoritesListTitle + '\n\n'; favorites.forEach(fav => { textToCopy += `${fav.name} - "${fav.meaning}"\n`; }); navigator.clipboard.writeText(textToCopy).then(() => { showToast('listCopiedToast'); }).catch(err => console.error('Failed to copy text: ', err)); });
    genderButtonsContainer.addEventListener('click', (event) => { if (event.target.tagName === 'BUTTON') { genderButtonsContainer.querySelector('.active').classList.remove('active'); event.target.classList.add('active'); const filterKey = event.target.getAttribute('data-i18n-key'); if (filterKey === 'genderBoy') { currentGenderFilter = 'macho'; } else if (filterKey === 'genderGirl') { currentGenderFilter = 'femea'; } else if (filterKey === 'genderUnisex') { currentGenderFilter = 'unissex'; } else { currentGenderFilter = 'todos'; } generateNewName(); } });
    
    // Lógica de sincronização dos filtros
    styleFilterSelect.addEventListener('change', (event) => {
        currentStyleFilter = event.target.value;
        if (currentStyleFilter === 'Brasileiro') {
            brazilianOnlyFilter = true;
            brazilianOnlyCheckbox.checked = true;
        } else {
            brazilianOnlyFilter = false;
            brazilianOnlyCheckbox.checked = false;
        }
        generateNewName();
    });

    brazilianOnlyCheckbox.addEventListener('change', (event) => {
        brazilianOnlyFilter = event.target.checked;
        if (brazilianOnlyFilter) {
            styleFilterSelect.value = 'Brasileiro';
        } else {
            styleFilterSelect.value = 'All Styles';
        }
        // Dispara o evento de 'change' no select para atualizar a variável currentStyleFilter
        styleFilterSelect.dispatchEvent(new Event('change'));
    });

    generateButton.addEventListener('click', generateNewName);
    startQuizCard.addEventListener('click', startQuiz);
    quizCloseBtn.addEventListener('click', exitQuiz);
    coupleModeCard.addEventListener('click', initCoupleMode);
    shareListsCard.addEventListener('click', openThemedListsModal);
    modalCloseBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
}

async function initializeApp() {
    try {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        if(firebaseConfig.measurementId){
            firebase.analytics();
        }
        userId = localStorage.getItem('userId');
        if (!userId) {
            userId = Math.random().toString(36).substring(2, 12);
            localStorage.setItem('userId', userId);
        }
        const [namesResponse, translationsResponse] = await Promise.all([fetch('names.json'), fetch('translations.json')]);
        if (!namesResponse.ok) throw new Error('Failed to load names.json');
        if (!translationsResponse.ok) throw new Error('Failed to load translations.json');
        names = await namesResponse.json();
        translations = await translationsResponse.json();
        const langToSet = localStorage.getItem('language') || 'pt';
        setLanguage(langToSet);
        const savedFavorites = JSON.parse(localStorage.getItem('favoriteNames'));
        if (savedFavorites) {
            favorites = savedFavorites;
            renderFavorites();
        }
        const savedSessionId = localStorage.getItem('coupleSessionId');
        if (savedSessionId) {
            startCoupleSession(savedSessionId);
        }
        updateTrendingNames();
        setupEventListeners();
        generateNewName();
        generateButton.disabled = false;
    } catch (error) {
        console.error("Could not initialize the application:", error);
        resultContainer.innerHTML = `<p style="color: red;">Error: Could not load essential data for the application.</p>`;
        if (error.message.includes("apiKey")) {
            resultContainer.innerHTML += `<p style="color: orange; font-weight: bold; margin-top: 10px;">Please configure your Firebase keys in script.js to enable Couple Mode.</p>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);