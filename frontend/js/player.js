// Audio Player Module

/**
 * Class for managing audio playback
 */
class AudioPlayer {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.currentTrackId = null;
    }
    
    /**
     * Play a preview of a track
     * @param {String} url - URL of the audio file
     * @param {String} trackId - ID of the track
     * @returns {Promise} - Resolves when audio starts playing
     */
    playPreview(url, trackId) {
        return new Promise((resolve, reject) => {
            // Stop current audio if playing
            if (this.audio) {
                this.stop();
            }
            
            // Create new audio element
            this.audio = new Audio(url);
            this.currentTrackId = trackId;
            
            // Set up event listeners
            this.audio.addEventListener('playing', () => {
                this.isPlaying = true;
                resolve();
            });
            
            this.audio.addEventListener('ended', () => {
                this.isPlaying = false;
                this.currentTrackId = null;
            });
            
            this.audio.addEventListener('error', (error) => {
                console.error('Error playing audio:', error);
                this.isPlaying = false;
                reject(error);
            });
            
            // Start playing
            this.audio.play().catch(error => {
                console.error('Error starting audio playback:', error);
                this.isPlaying = false;
                reject(error);
            });
        });
    }
    
    /**
     * Stop currently playing audio
     */
    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.isPlaying = false;
            this.currentTrackId = null;
        }
    }
    
    /**
     * Pause currently playing audio
     */
    pause() {
        if (this.audio && this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        }
    }
    
    /**
     * Resume paused audio
     */
    resume() {
        if (this.audio && !this.isPlaying) {
            this.audio.play();
            this.isPlaying = true;
        }
    }
    
    /**
     * Toggle play/pause state
     */
    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.resume();
        }
    }
    
    /**
     * Check if a specific track is currently playing
     * @param {String} trackId - ID of the track to check
     * @returns {Boolean} - True if the track is playing
     */
    isTrackPlaying(trackId) {
        return this.isPlaying && this.currentTrackId === trackId;
    }
}

// Create a global instance of the audio player
const audioPlayer = new AudioPlayer();