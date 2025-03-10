from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
from database.db import init_db
from api.routes import api_bp

# Load environment variables
load_dotenv()

def create_app():
    # Initialize Flask app
    app = Flask(__name__)
    
    # Enable CORS
    CORS(app)
    
    # Configure app
    app.config['MONGO_URI'] = os.getenv('MONGO_URI', 'mongodb://localhost:27017/music_explorer')
    app.config['SPOTIFY_CLIENT_ID'] = os.getenv('SPOTIFY_CLIENT_ID')
    app.config['SPOTIFY_CLIENT_SECRET'] = os.getenv('SPOTIFY_CLIENT_SECRET')
    
    # Initialize database
    init_db(app)
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Root route
    @app.route('/')
    def index():
        return jsonify({
            'status': 'online',
            'app': 'Multilingual Music Pattern Explorer',
            'version': '0.1.0'
        })
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)