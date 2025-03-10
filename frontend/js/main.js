// Global Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const CURRENT_USER_ID = 'user123';  // In a real app, this would come from authentication

// DOM elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const searchResults = document.getElementById('search-results');

// Navigation elements
const navSearch = document.getElementById('nav-search');
const navPatterns = document.getElementById('nav-patterns');
const navFavorites = document.getElementById('nav-favorites');
const navLanguage = document.getElementById('nav-language');

// Sections
const searchSection = document.getElementById('search-section');
const songDetailSection = document.getElementById('song-detail-section');
const patternsSection = document.getElementById('patterns-section');
const favoritesSection = document.getElementById('favorites-section');
const languageSection = document.getElementById('language-section');

// Current state
let currentSong = null;
let currentPlayingPreview = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    navSearch.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(searchSection);
        setActiveNavItem(navSearch);
    });
    
    navPatterns.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(patternsSection);
        setActiveNavItem(navPatterns);
        loadPatterns();
    });
    
    navFavorites.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(favoritesSection);
        setActiveNavItem(navFavorites);
        loadFavorites();
    });
    
    navLanguage.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(languageSection);
        setActiveNavItem(navLanguage);
    });
    
    // Search functionality
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Other button listeners
    document.getElementById('play-preview').addEventListener('click', togglePlayPreview);
    document.getElementById('show-lyrics').addEventListener('click', showLyrics);
    document.getElementById('add-favorite').addEventListener('click', addToFavorites);
    document.getElementById('translate-button').addEventListener('click', translateLyrics);
    document.getElementById('translate-lyrics-button').addEventListener('click', translateModalLyrics);
});

// Functions
function showSection(section) {
    // Hide all sections
    const sections = document.querySelectorAll('.section-container');
    sections.forEach(s => s.classList.add('d-none'));
    
    // Show the requested section
    section.classList.remove('d-none');
}

function setActiveNavItem(navItem) {
    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.nav-item .nav-link');
    navItems.forEach(item => item.classList.remove('active'));
    
    // Add active class to selected nav item
    navItem.classList.add('active');
}

async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    
    try {
        searchResults.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
        
        const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        displaySearchResults(data.songs);
    } catch (error) {
        console.error('Error searching songs:', error);
        searchResults.innerHTML = '<div class="alert alert-danger">Error searching for songs. Please try again.</div>';
    }
}

function displaySearchResults(songs) {
    if (!songs || songs.length === 0) {
        searchResults.innerHTML = '<div class="alert alert-info">No songs found. Try a different search term.</div>';
        return;
    }
    
    searchResults.innerHTML = '';
    
    songs.forEach(song => {
        const item = document.createElement('div');
        item.className = 'list-group-item list-group-item-action';
        item.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${song.title}</h5>
                <small>${song.release_date ? new Date(song.release_date).getFullYear() : ''}</small>
            </div>
            <p class="mb-1">${song.artist}</p>
            <small>${song.album || ''}</small>
        `;
        
        item.addEventListener('click', () => loadSongDetails(song.spotify_id));
        searchResults.appendChild(item);
    });
}

async function loadSongDetails(spotifyId) {
    try {
        // Show loading state
        songDetailSection.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
        showSection(songDetailSection);
        
        const response = await fetch(`${API_BASE_URL}/songs/${spotifyId}`);
        const data = await response.json();
        
        // Store current song
        currentSong = data.song;
        
        // Reset the song detail section
        songDetailSection.innerHTML = '';
        songDetailSection.appendChild(document.querySelector('#song-detail-section').content.cloneNode(true));
        
        // Update song details
        document.getElementById('song-title').textContent = currentSong.title;
        document.getElementById('song-artist').textContent = currentSong.artist;
        document.getElementById('song-album').textContent = currentSong.album || 'Unknown';
        
        // Convert numeric key to note name
        const keyNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const mode = currentSong.audio_features?.mode === 0 ? 'Minor' : 'Major';
        document.getElementById('song-key').textContent = `${keyNames[currentSong.key || 0]} ${mode}`;
        
        document.getElementById('song-tempo').textContent = `${Math.round(currentSong.audio_features?.tempo || 0)} BPM`;
        document.getElementById('song-language').textContent = currentSong.language || 'Unknown';
        
        // Display chord progressions
        displayChordProgressions(data.chord_progressions);
        
        // Show chord visualization
        if (data.chord_progressions && data.chord_progressions.length > 0) {
            const firstProgression = data.chord_progressions[0];
            visualizeChordProgression(firstProgression.progression, firstProgression.progression_pattern);
        }
        
    } catch (error) {
        console.error('Error loading song details:', error);
        songDetailSection.innerHTML = '<div class="alert alert-danger">Error loading song details. Please try again.</div>';
    }
}

function displayChordProgressions(progressions) {
    const progressionsList = document.getElementById('chord-progressions-list');
    progressionsList.innerHTML = '';
    
    if (!progressions || progressions.length === 0) {
        progressionsList.innerHTML = '<div class="alert alert-info">No chord progressions available for this song.</div>';
        return;
    }
    
    progressions.forEach(progression => {
        const item = document.createElement('div');
        item.className = 'list-group-item';
        
        const pattern = progression.progression_pattern || 'Unknown Pattern';
        const chords = progression.progression?.join(' - ') || 'Unknown Chords';
        
        item.innerHTML = `
            <div>
                <strong>${pattern}</strong>
                <div class="small text-muted">${chords}</div>
            </div>
            <button class="btn btn-sm btn-outline-primary visualize-btn">Visualize</button>
        `;
        
        const visualizeBtn = item.querySelector('.visualize-btn');
        visualizeBtn.addEventListener('click', () => {
            visualizeChordProgression(progression.progression, progression.progression_pattern);
        });
        
        progressionsList.appendChild(item);
    });
}

async function loadPatterns() {
    const patternsContainer = document.getElementById('patterns-container');
    
    try {
        patternsContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
        
        const response = await fetch(`${API_BASE_URL}/patterns`);
        const data = await response.json();
        
        displayPatterns(data.patterns);
    } catch (error) {
        console.error('Error loading patterns:', error);
        patternsContainer.innerHTML = '<div class="alert alert-danger">Error loading chord patterns. Please try again.</div>';
    }
}

function displayPatterns(patterns) {
    const patternsContainer = document.getElementById('patterns-container');
    patternsContainer.innerHTML = '';
    
    if (!patterns || patterns.length === 0) {
        patternsContainer.innerHTML = '<div class="alert alert-info">No chord patterns available.</div>';
        return;
    }
    
    patterns.forEach(pattern => {
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4 mb-4';
        
        // Combine example songs
        const examples = [
            ...(pattern.examples || []), 
            ...(pattern.db_examples || []).map(ex => `${ex.title} by ${ex.artist}`)
        ].join(', ');
        
        card.innerHTML = `
            <div class="pattern-card">
                <h5 class="pattern-title">${pattern.name}</h5>
                <div class="pattern-notation mb-2">${pattern.pattern}</div>
                <div class="pattern-examples">
                    <small>Examples: ${examples || 'No examples available'}</small>
                </div>
                <div class="mt-3">
                    <button class="btn btn-sm btn-outline-primary visualize-pattern-btn">Visualize</button>
                    <button class="btn btn-sm btn-outline-success add-pattern-favorite-btn">Add to Favorites</button>
                </div>
            </div>
        `;
        
        const visualizeBtn = card.querySelector('.visualize-pattern-btn');
        visualizeBtn.addEventListener('click', () => {
            // Convert pattern to chord progression for visualization
            // This is a simple placeholder conversion
            const chords = pattern.pattern.split('-');
            visualizeChordProgression(chords, pattern.pattern);
        });
        
        const favoriteBtn = card.querySelector('.add-pattern-favorite-btn');
        favoriteBtn.addEventListener('click', () => addPatternToFavorites(pattern));
        
        patternsContainer.appendChild(card);
    });
}

async function loadFavorites() {
    const songsList = document.getElementById('favorite-songs-list');
    const patternsList = document.getElementById('favorite-patterns-list');
    
    try {
        // Show loading indicators
        songsList.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
        patternsList.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
        
        // Get user preferences from API
        const response = await fetch(`${API_BASE_URL}/preferences/${CURRENT_USER_ID}`);
        const data = await response.json();
        
        // Display favorite songs
        displayFavoriteSongs(data.preferences.filter(pref => pref.song));
        
        // Display favorite patterns
        displayFavoritePatterns(data.preferences.filter(pref => pref.progression));
        
    } catch (error) {
        console.error('Error loading favorites:', error);
        songsList.innerHTML = '<div class="alert alert-danger">Error loading favorite songs.</div>';
        patternsList.innerHTML = '<div class="alert alert-danger">Error loading favorite patterns.</div>';
    }
}

function displayFavoriteSongs(songPreferences) {
    const songsList = document.getElementById('favorite-songs-list');
    songsList.innerHTML = '';
    
    if (!songPreferences || songPreferences.length === 0) {
        songsList.innerHTML = '<div class="alert alert-info">No favorite songs yet. Add songs to your favorites!</div>';
        return;
    }
    
    songPreferences.forEach(pref => {
        const song = pref.song;
        const item = document.createElement('div');
        item.className = 'list-group-item list-group-item-action';
        
        item.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${song.title}</h5>
                <span class="badge bg-primary rounded-pill">${pref.rating || ''} ★</span>
            </div>
            <p class="mb-1">${song.artist}</p>
            <div class="mt-2">
                <button class="btn btn-sm btn-outline-primary view-song-btn">View Details</button>
                <button class="btn btn-sm btn-outline-danger remove-favorite-btn">Remove</button>
            </div>
        `;
        
        const viewBtn = item.querySelector('.view-song-btn');
        viewBtn.addEventListener('click', () => loadSongDetails(song.spotify_id));
        
        const removeBtn = item.querySelector('.remove-favorite-btn');
        removeBtn.addEventListener('click', () => removeFavorite(pref._id));
        
        songsList.appendChild(item);
    });
}

function displayFavoritePatterns(patternPreferences) {
    const patternsList = document.getElementById('favorite-patterns-list');
    patternsList.innerHTML = '';
    
    if (!patternPreferences || patternPreferences.length === 0) {
        patternsList.innerHTML = '<div class="alert alert-info">No favorite chord patterns yet. Add patterns to your favorites!</div>';
        return;
    }
    
    const row = document.createElement('div');
    row.className = 'row';
    patternsList.appendChild(row);
    
    patternPreferences.forEach(pref => {
        const progression = pref.progression;
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4 mb-4';
        
        card.innerHTML = `
            <div class="pattern-card">
                <h5 class="pattern-title">${progression.pattern}</h5>
                <div class="pattern-notation mb-2">${progression.chords.join(' - ')}</div>
                <div class="mt-3">
                    <button class="btn btn-sm btn-outline-primary visualize-pattern-btn">Visualize</button>
                    <button class="btn btn-sm btn-outline-danger remove-pattern-btn">Remove</button>
                </div>
            </div>
        `;
        
        const visualizeBtn = card.querySelector('.visualize-pattern-btn');
        visualizeBtn.addEventListener('click', () => {
            visualizeChordProgression(progression.chords, progression.pattern);
        });
        
        const removeBtn = card.querySelector('.remove-pattern-btn');
        removeBtn.addEventListener('click', () => removeFavorite(pref._id));
        
        row.appendChild(card);
    });
}

async function addToFavorites() {
    if (!currentSong) return;
    
    try {
        const preference = {
            user_id: CURRENT_USER_ID,
            song_id: currentSong._id,
            rating: 5,  // Default rating
            tags: []
        };
        
        const response = await fetch(`${API_BASE_URL}/preferences`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preference)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Song added to favorites!');
        } else {
            throw new Error(result.message || 'Failed to add to favorites');
        }
        
    } catch (error) {
        console.error('Error adding to favorites:', error);
        alert('Error adding song to favorites. Please try again.');
    }
}

async function addPatternToFavorites(pattern) {
    try {
        // In a real app, we would first save the pattern to the database
        // For this demo, we'll just mock it
        const mockProgressionId = 'prog_' + Math.random().toString(36).substr(2, 9);
        
        const preference = {
            user_id: CURRENT_USER_ID,
            chord_progression_id: mockProgressionId,
            rating: 5,  // Default rating
            tags: []
        };
        
        const response = await fetch(`${API_BASE_URL}/preferences`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preference)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Pattern added to favorites!');
        } else {
            throw new Error(result.message || 'Failed to add to favorites');
        }
        
    } catch (error) {
        console.error('Error adding pattern to favorites:', error);
        alert('Error adding pattern to favorites. Please try again.');
    }
}

async function removeFavorite(preferenceId) {
    // In a real app, this would send a DELETE request to the API
    // For this demo, we'll just reload the favorites
    alert('Favorite removed!');
    await loadFavorites();
}

function togglePlayPreview() {
    const previewBtn = document.getElementById('play-preview');
    
    if (currentPlayingPreview) {
        currentPlayingPreview.pause();
        currentPlayingPreview = null;
        previewBtn.textContent = 'Play Preview';
        return;
    }
    
    if (!currentSong || !currentSong.preview_url) {
        alert('No preview available for this song.');
        return;
    }
    
    currentPlayingPreview = new Audio(currentSong.preview_url);
    currentPlayingPreview.play();
    previewBtn.textContent = 'Pause Preview';
    
    currentPlayingPreview.addEventListener('ended', () => {
        previewBtn.textContent = 'Play Preview';
        currentPlayingPreview = null;
    });
}

async function showLyrics() {
    if (!currentSong) return;
    
    const lyricsModal = new bootstrap.Modal(document.getElementById('lyrics-modal'));
    const lyricsContent = document.getElementById('lyrics-content');
    
    lyricsContent.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
    lyricsModal.show();
    
    try {
        const response = await fetch(`${API_BASE_URL}/lyrics/${currentSong.spotify_id}`);
        const data = await response.json();
        
        // Display lyrics
        lyricsContent.innerHTML = `
            <h4>${currentSong.title} - ${currentSong.artist}</h4>
            <pre>${data.lyrics || 'Lyrics not available'}</pre>
        `;
        
    } catch (error) {
        console.error('Error fetching lyrics:', error);
        lyricsContent.innerHTML = '<div class="alert alert-danger">Error loading lyrics. Please try again.</div>';
    }
}

async function translateLyrics() {
    const originalLyrics = document.getElementById('original-lyrics');
    const translatedLyrics = document.getElementById('translated-lyrics');
    const targetLanguage = document.getElementById('translate-language').value;
    
    if (!originalLyrics.textContent.trim()) {
        alert('Please load lyrics first');
        return;
    }
    
    translatedLyrics.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: originalLyrics.textContent,
                target_lang: targetLanguage
            })
        });
        
        const data = await response.json();
        translatedLyrics.textContent = data.translated_text;
        
    } catch (error) {
        console.error('Error translating lyrics:', error);
        translatedLyrics.innerHTML = '<div class="alert alert-danger">Error translating lyrics. Please try again.</div>';
    }
}

async function translateModalLyrics() {
    const lyricsContent = document.getElementById('lyrics-content');
    const lyricsText = lyricsContent.querySelector('pre').textContent;
    const targetLanguage = document.getElementById('translate-language').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: lyricsText,
                target_lang: targetLanguage
            })
        });
        
        const data = await response.json();
        
        // Update lyrics modal with translated text
        lyricsContent.querySelector('pre').textContent = data.translated_text;
        
    } catch (error) {
        console.error('Error translating lyrics:', error);
        alert('Error translating lyrics. Please try again.');
    }
}