from flask import Blueprint, jsonify, request, current_app
from ..database.db import mongo
from ..models.chord_analyzer import ChordAnalyzer
from .spotify import SpotifyAPI
import json
from bson import json_util

# Create blueprint
api_bp = Blueprint('api', __name__)

# Initialize Spotify API
spotify_api = SpotifyAPI()

# Initialize chord analyzer
chord_analyzer = ChordAnalyzer()

@api_bp.route('/search', methods=['GET'])
def search_songs():
    """Search for songs via Spotify API"""
    query = request.args.get('q', '')
    limit = int(request.args.get('limit', 10))
    
    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400
    
    # Search via Spotify API
    results = spotify_api.search_track(query, limit=limit)
    
    # Transform results to our format
    songs = []
    for item in results.get('tracks', {}).get('items', []):
        songs.append({
            "title": item.get('name'),
            "artist": item.get('artists', [{}])[0].get('name'),
            "spotify_id": item.get('id'),
            "album": item.get('album', {}).get('name'),
            "release_date": item.get('album', {}).get('release_date'),
            "preview_url": item.get('preview_url')
        })
    
    return jsonify({"songs": songs})

@api_bp.route('/songs/<spotify_id>', methods=['GET'])
def get_song(spotify_id):
    """Get song details including chord progressions"""
    # Check if song exists in database
    song = mongo.db.songs.find_one({"spotify_id": spotify_id})
    
    if not song:
        # Get from Spotify API
        track = spotify_api.get_track(spotify_id)
        features = spotify_api.get_audio_features(spotify_id)
        
        # Create new song document
        song = {
            "title": track.get('name'),
            "artist": track.get('artists', [{}])[0].get('name'),
            "spotify_id": spotify_id,
            "album": track.get('album', {}).get('name'),
            "release_date": track.get('album', {}).get('release_date'),
            "tempo": features.get('tempo'),
            "key": features.get('key'),
            "audio_features": features,
            "language": spotify_api.detect_language(spotify_id)
        }
        
        # Insert into database
        result = mongo.db.songs.insert_one(song)
        song['_id'] = result.inserted_id
    
    # Get chord progressions
    progressions = list(mongo.db.chord_progressions.find({"song_id": str(song['_id'])}))
    
    # If no progressions yet, analyze and save
    if not progressions:
        analysis = chord_analyzer.analyze_track_from_spotify(spotify_api, spotify_id)
        chord_analyzer.save_analysis_to_db(str(song['_id']), analysis)
        progressions = list(mongo.db.chord_progressions.find({"song_id": str(song['_id'])}))
    
    # Prepare response
    song_data = json.loads(json_util.dumps(song))
    progression_data = json.loads(json_util.dumps(progressions))
    
    return jsonify({
        "song": song_data,
        "chord_progressions": progression_data
    })

@api_bp.route('/patterns', methods=['GET'])
def get_chord_patterns():
    """Get common chord patterns and examples"""
    common_patterns = chord_analyzer.get_common_progressions()
    
    # Add songs from our database that match these patterns
    for pattern in common_patterns:
        pattern_str = pattern["pattern"]
        # Find songs in our database with this pattern
        matching_progressions = list(mongo.db.chord_progressions.find(
            {"progression_pattern": pattern_str}
        ).limit(5))
        
        # Get song details for these progressions
        db_examples = []
        for prog in matching_progressions:
            song = mongo.db.songs.find_one({"_id": json_util.ObjectId(prog["song_id"])})
            if song:
                db_examples.append({
                    "title": song.get("title"),
                    "artist": song.get("artist")
                })
        
        # Add to pattern
        pattern["db_examples"] = db_examples
    
    return jsonify({"patterns": common_patterns})

@api_bp.route('/preferences', methods=['POST'])
def save_preference():
    """Save user preferences for songs or chord progressions"""
    data = request.json
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Validate required fields
    if not data.get('user_id'):
        return jsonify({"error": "user_id is required"}), 400
    
    # Create preference document
    preference = {
        "user_id": data.get('user_id'),
        "song_id": data.get('song_id'),
        "chord_progression_id": data.get('chord_progression_id'),
        "rating": data.get('rating'),
        "tags": data.get('tags', []),
        "notes": data.get('notes')
    }
    
    # Check if preference already exists
    existing = None
    if preference.get('song_id'):
        existing = mongo.db.user_preferences.find_one({
            "user_id": preference["user_id"],
            "song_id": preference["song_id"]
        })
    elif preference.get('chord_progression_id'):
        existing = mongo.db.user_preferences.find_one({
            "user_id": preference["user_id"],
            "chord_progression_id": preference["chord_progression_id"]
        })
    
    # Update or insert
    if existing:
        mongo.db.user_preferences.update_one(
            {"_id": existing["_id"]},
            {"$set": preference}
        )
        message = "Preference updated"
    else:
        result = mongo.db.user_preferences.insert_one(preference)
        message = "Preference saved"
    
    return jsonify({"message": message, "success": True})

@api_bp.route('/preferences/<user_id>', methods=['GET'])
def get_preferences(user_id):
    """Get user preferences"""
    preferences = list(mongo.db.user_preferences.find({"user_id": user_id}))
    
    # Get song details for each preference
    full_preferences = []
    for pref in preferences:
        if pref.get('song_id'):
            song = mongo.db.songs.find_one({"_id": json_util.ObjectId(pref["song_id"])})
            if song:
                pref["song"] = {
                    "title": song.get("title"),
                    "artist": song.get("artist"),
                    "spotify_id": song.get("spotify_id")
                }
        
        if pref.get('chord_progression_id'):
            progression = mongo.db.chord_progressions.find_one({"_id": json_util.ObjectId(pref["chord_progression_id"])})
            if progression:
                pref["progression"] = {
                    "pattern": progression.get("progression_pattern"),
                    "chords": progression.get("progression")
                }
                
        full_preferences.append(pref)
    
    return jsonify({
        "preferences": json.loads(json_util.dumps(full_preferences))
    })

@api_bp.route('/lyrics/<spotify_id>', methods=['GET'])
def get_lyrics(spotify_id):
    """Get lyrics for a song (placeholder - would integrate with lyrics API)"""
    # In a real application, this would connect to a lyrics API
    # For now, return a placeholder
    return jsonify({
        "status": "success",
        "message": "This endpoint would integrate with a lyrics API in production",
        "lyrics": "Placeholder lyrics for demonstration purposes"
    })

@api_bp.route('/translate', methods=['POST'])
def translate_text():
    """Translate text between languages (placeholder)"""
    data = request.json
    
    if not data or not data.get('text'):
        return jsonify({"error": "No text provided"}), 400
    
    source_lang = data.get('source_lang', 'auto')
    target_lang = data.get('target_lang', 'en')
    
    # In a real app, call translation API
    # For demo purposes, return the original text
    return jsonify({
        "translated_text": f"[Translation of '{data['text']}' from {source_lang} to {target_lang}]",
        "status": "success",
        "message": "This endpoint would integrate with a translation API in production"
    })