from flask_pymongo import PyMongo
from pymongo import IndexModel, ASCENDING

# MongoDB connection instance
mongo = PyMongo()

def init_db(app):
    """Initialize database connection and set up indexes"""
    mongo.init_app(app)
    
    # Create indexes for efficient queries
    songs_collection = mongo.db.songs
    songs_collection.create_indexes([
        IndexModel([("spotify_id", ASCENDING)], unique=True),
        IndexModel([("title", ASCENDING)]),
        IndexModel([("artist", ASCENDING)]),
        IndexModel([("language", ASCENDING)])
    ])
    
    chord_progressions = mongo.db.chord_progressions
    chord_progressions.create_indexes([
        IndexModel([("song_id", ASCENDING)]),
        IndexModel([("progression_pattern", ASCENDING)])
    ])
    
    user_preferences = mongo.db.user_preferences
    user_preferences.create_indexes([
        IndexModel([("user_id", ASCENDING)]),
        IndexModel([("song_id", ASCENDING)])
    ])
    
    return mongo