import numpy as np
from librosa.core import load, cqt
from librosa.feature import chroma_cqt
from librosa.chord import chord_detect
import joblib
import os
from ..database.db import mongo

# Map of note indices to chord names
NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

# Common chord types and their intervals
CHORD_TYPES = {
    'major': [0, 4, 7],      # Major triad (e.g., C)
    'minor': [0, 3, 7],      # Minor triad (e.g., Cm)
    'dim': [0, 3, 6],        # Diminished triad (e.g., Cdim)
    'aug': [0, 4, 8],        # Augmented triad (e.g., Caug)
    'sus4': [0, 5, 7],       # Suspended fourth (e.g., Csus4)
    'sus2': [0, 2, 7],       # Suspended second (e.g., Csus2)
    '7': [0, 4, 7, 10],      # Dominant seventh (e.g., C7)
    'maj7': [0, 4, 7, 11],   # Major seventh (e.g., Cmaj7)
    'min7': [0, 3, 7, 10],   # Minor seventh (e.g., Cm7)
}

# Map of numeric chord degrees to roman numerals
ROMAN_NUMERALS = {
    1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII'
}

class ChordAnalyzer:
    """Analyzes audio to detect chord progressions"""
    
    def __init__(self, model_path=None):
        """Initialize chord analyzer with optional pre-trained model"""
        self.model = None
        if model_path and os.path.exists(model_path):
            self.model = joblib.load(model_path)
    
    def analyze_audio(self, audio_file, sr=22050):
        """
        Analyze audio file to detect chords
        
        Parameters:
        -----------
        audio_file : str
            Path to audio file
        sr : int
            Sample rate
            
        Returns:
        --------
        list
            List of detected chords with their timing
        """
        # Load audio file
        y, sr = load(audio_file, sr=sr)
        
        # Extract chroma features
        chroma = chroma_cqt(y=y, sr=sr)
        
        # Detect chords (simplified approach)
        chords = self._detect_chords(chroma)
        
        return chords
    
    def _detect_chords(self, chroma):
        """
        Detect chords from chroma features
        
        Note: This is a simplified implementation. A real-world implementation
        would use more sophisticated chord detection algorithms.
        """
        # For demo purposes, just find the strongest notes
        # and map to major/minor chords
        num_frames = chroma.shape[1]
        detected = []
        
        for i in range(0, num_frames, 10):  # Analyze every 10 frames
            if i+10 > num_frames:
                break
                
            # Get average chroma over window
            window = np.mean(chroma[:, i:i+10], axis=1)
            
            # Find the strongest note
            root = np.argmax(window)
            root_name = NOTE_NAMES[root]
            
            # Check if it's likely a major or minor chord
            major_strength = window[root] + window[(root+4) % 12] + window[(root+7) % 12]
            minor_strength = window[root] + window[(root+3) % 12] + window[(root+7) % 12]
            
            if major_strength > minor_strength:
                chord = root_name
            else:
                chord = f"{root_name}m"
                
            detected.append({
                "time": i * 512 / 22050,  # Approximate time in seconds
                "chord": chord
            })
        
        return detected
    
    def identify_progressions(self, chords, key="C"):
        """
        Identify chord progressions and their patterns
        
        Parameters:
        -----------
        chords : list
            List of detected chords
        key : str
            Key of the song
            
        Returns:
        --------
        list
            List of chord progressions with roman numeral notation
        """
        # Convert key to index (0 = C, 1 = C#, etc.)
        key_idx = NOTE_NAMES.index(key.upper().replace('M', ''))
        
        # Group chords into potential progressions (simplified approach)
        progressions = []
        current_prog = []
        
        for i, chord_info in enumerate(chords):
            chord = chord_info["chord"]
            
            # Extract root note and chord type
            if 'm' in chord:
                root = chord.replace('m', '')
                chord_type = 'minor'
            else:
                root = chord
                chord_type = 'major'
                
            # Get chord degree relative to key
            root_idx = NOTE_NAMES.index(root)
            degree = (root_idx - key_idx) % 12
            
            # Convert to scale degree (1-7)
            # This is a simplification; real implementation would account for diatonic scale
            scale_degree = degree % 7 + 1
            
            # Get roman numeral
            roman = ROMAN_NUMERALS[scale_degree]
            
            # Adjust casing for minor chords
            if chord_type == 'minor':
                roman = roman.lower()
                
            current_prog.append(roman)
            
            # Check if we've found a complete progression (4 chords is common)
            if len(current_prog) == 4 or i == len(chords) - 1:
                if current_prog:
                    progression_str = "-".join(current_prog)
                    progressions.append({
                        "chords": current_prog.copy(),
                        "pattern": progression_str,
                        "start_time": chords[i-len(current_prog)+1]["time"] if i-len(current_prog)+1 >= 0 else 0
                    })
                current_prog = []
        
        return progressions
    
    def get_common_progressions(self):
        """Get list of common chord progressions"""
        return [
            {"pattern": "I-V-vi-IV", "name": "Pop Progression", "examples": ["Let It Be", "Don't Stop Believin'"]},
            {"pattern": "I-IV-V", "name": "Blues Progression", "examples": ["Sweet Home Alabama", "Twist and Shout"]},
            {"pattern": "ii-V-I", "name": "Jazz Progression", "examples": ["Autumn Leaves", "Fly Me to the Moon"]},
            {"pattern": "vi-IV-I-V", "name": "Axis of Awesome", "examples": ["Let It Be", "No Woman No Cry"]},
            {"pattern": "I-vi-IV-V", "name": "50s Progression", "examples": ["Stand By Me", "Earth Angel"]},
            {"pattern": "i-bVI-bIII-bVII", "name": "Andalusian Cadence", "examples": ["Hit the Road Jack", "Sultans of Swing"]}
        ]
    
    def analyze_track_from_spotify(self, spotify_api, track_id):
        """
        Analyze a track from Spotify API
        
        This is a simplified implementation since we can't directly access audio.
        It uses the Spotify audio features and sections analysis.
        """
        # Get audio features
        features = spotify_api.get_audio_features(track_id)
        
        # Get audio analysis for sections
        analysis = spotify_api.get_audio_analysis(track_id)
        
        # Extract key and mode
        key_idx = features.get('key', 0)  # 0 = C, 1 = C#, etc.
        mode = features.get('mode', 1)    # 0 = minor, 1 = major
        
        # Convert to key name
        key = NOTE_NAMES[key_idx]
        if mode == 0:
            key += 'm'  # Add 'm' for minor
            
        # For demo purposes, generate some fake chord progressions
        # In a real app, you'd need audio analysis or manual input
        sections = analysis.get('sections', [])
        
        common_progressions = self.get_common_progressions()
        
        # Create "detected" progressions based on audio sections and key
        progressions = []
        for i, section in enumerate(sections[:4]):  # Limit to 4 sections for demo
            # Randomly select a progression that fits the key and energy
            progression = common_progressions[i % len(common_progressions)]
            
            progressions.append({
                "section_start": section.get('start'),
                "section_duration": section.get('duration'),
                "confidence": 0.8,  # Placeholder confidence value
                "pattern": progression["pattern"],
                "chords": progression["pattern"].split("-")
            })
            
        return {
            "key": key,
            "tempo": features.get('tempo'),
            "time_signature": features.get('time_signature'),
            "progressions": progressions
        }
    
    def save_analysis_to_db(self, song_id, analysis_results):
        """Save chord analysis results to the database"""
        # Extract progressions
        progressions = analysis_results.get("progressions", [])
        
        # Save each progression
        for prog in progressions:
            chord_prog = {
                "song_id": song_id,
                "progression": prog["chords"],
                "progression_pattern": prog["pattern"],
                "section_type": "section",  # Could be more specific in a real app
                "frequency": 1,
                "confidence": prog.get("confidence", 0.8)
            }
            
            # Insert into database
            mongo.db.chord_progressions.insert_one(chord_prog)
            
        return True