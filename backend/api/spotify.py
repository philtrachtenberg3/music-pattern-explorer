import requests
import base64
import json
import time
from flask import current_app

class SpotifyAPI:
    """Spotify API wrapper for fetching music data"""
    
    def __init__(self, client_id=None, client_secret=None):
        self.client_id = client_id or current_app.config['SPOTIFY_CLIENT_ID']
        self.client_secret = client_secret or current_app.config['SPOTIFY_CLIENT_SECRET']
        self.token = None
        self.token_expiry = 0
        self.base_url = "https://api.spotify.com/v1"
    
    def _get_auth_header(self):
        """Get authorization header for Spotify API requests"""
        if time.time() > self.token_expiry:
            self._get_token()
        
        return {"Authorization": f"Bearer {self.token}"}
    
    def _get_token(self):
        """Get access token from Spotify API"""
        auth_string = f"{self.client_id}:{self.client_secret}"
        auth_bytes = auth_string.encode("utf-8")
        auth_base64 = base64.b64encode(auth_bytes).decode("utf-8")
        
        url = "https://accounts.spotify.com/api/token"
        headers = {
            "Authorization": f"Basic {auth_base64}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {"grant_type": "client_credentials"}
        
        response = requests.post(url, headers=headers, data=data)
        json_result = response.json()
        
        self.token = json_result["access_token"]
        self.token_expiry = time.time() + json_result["expires_in"] - 60  # Buffer of 60 seconds
        
        return True
    
    def search_track(self, query, limit=10):
        """Search for tracks on Spotify"""
        headers = self._get_auth_header()
        url = f"{self.base_url}/search"
        params = {
            "q": query,
            "type": "track",
            "limit": limit
        }
        
        response = requests.get(url, headers=headers, params=params)
        return response.json()
    
    def get_track(self, track_id):
        """Get detailed track information"""
        headers = self._get_auth_header()
        url = f"{self.base_url}/tracks/{track_id}"
        
        response = requests.get(url, headers=headers)
        return response.json()
    
    def get_audio_features(self, track_id):
        """Get audio features for a track (tempo, key, mode, etc.)"""
        headers = self._get_auth_header()
        url = f"{self.base_url}/audio-features/{track_id}"
        
        response = requests.get(url, headers=headers)
        return response.json()
    
    def get_audio_analysis(self, track_id):
        """Get detailed audio analysis for a track (sections, segments, etc.)"""
        headers = self._get_auth_header()
        url = f"{self.base_url}/audio-analysis/{track_id}"
        
        response = requests.get(url, headers=headers)
        return response.json()
    
    def detect_language(self, track_id):
        """Attempt to detect language of a track using available metadata"""
        # This is a simplified approach - in a real app you might use
        # the track's market, artist nationality, or integrate with a
        # language detection service after analyzing lyrics
        
        headers = self._get_auth_header()
        
        # Get track details
        track_url = f"{self.base_url}/tracks/{track_id}"
        track_response = requests.get(track_url, headers=headers)
        track_data = track_response.json()
        
        # Check available markets for language hints
        markets = track_data.get("available_markets", [])
        
        # Very simplified language detection based on markets
        # This would need to be much more sophisticated in a real application
        if "ES" in markets or "MX" in markets or "AR" in markets:
            return "Spanish"
        elif "BR" in markets or "PT" in markets:
            return "Portuguese"
        elif "US" in markets or "GB" in markets:
            return "English"
        
        # Default to unknown
        return "Unknown"