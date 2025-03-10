# Multilingual Music Pattern Explorer

A web application for exploring music patterns across different languages, analyzing chord progressions, and learning language through music.

## Features

- **Music Pattern Analysis**: Detect and visualize chord progressions in songs
- **Cross-Language Exploration**: Analyze music patterns in English, Spanish, and Portuguese songs
- **Language Learning**: Use music as a tool for language learning with translations and vocabulary building
- **Personalized Experience**: Save favorite songs and patterns, get recommendations based on your preferences

## Project Structure

The project consists of a Flask backend API and a JavaScript/HTML/CSS frontend.

### Backend

- Built with Flask
- Uses MongoDB for data storage
- Integrates with Spotify API for music data
- Implements chord progression analysis algorithms
- Provides language translation features

### Frontend

- Pure JavaScript with Bootstrap for styling
- D3.js for chord progression visualizations
- Interactive UI for exploring music patterns
- Language learning tools integrated with music exploration

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- MongoDB installed and running
- Spotify Developer account (for API access)

### Backend Setup

1. Clone the repository
   ```
   git clone https://github.com/philtrachtenberg3/music-pattern-explorer.git
   cd music-pattern-explorer
   ```

2. Create a virtual environment
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```

3. Install dependencies
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the root directory with your API keys
   ```
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   MONGO_URI=mongodb://localhost:27017/music_explorer
   ```

5. Start the backend server
   ```
   cd backend
   python app.py
   ```

### Frontend Setup

The frontend is pure HTML/CSS/JavaScript and can be served with any web server. For development, you can use the simple Python HTTP server:

```
cd frontend
python -m http.server 8000
```

Then open your browser and navigate to `http://localhost:8000`

## API Endpoints

The backend provides the following API endpoints:

- `GET /api/search?q=<query>` - Search for songs
- `GET /api/songs/<spotify_id>` - Get song details and chord progressions
- `GET /api/patterns` - Get common chord patterns
- `POST /api/preferences` - Save user preferences
- `GET /api/preferences/<user_id>` - Get user preferences
- `GET /api/lyrics/<spotify_id>` - Get lyrics for a song
- `POST /api/translate` - Translate text between languages

## Development Roadmap

### Phase 1: Core Functionality
- ✅ Basic project structure
- ✅ Spotify API integration
- ✅ Chord progression detection
- ✅ Frontend visualization

### Phase 2: User Experience
- ⬜ Advanced chord progression analysis
- ⬜ User accounts and authentication
- ⬜ Improved visualizations
- ⬜ Recommendation system

### Phase 3: Language Learning Features
- ⬜ Advanced lyrics translation
- ⬜ Vocabulary building tools
- ⬜ Pronunciation guides
- ⬜ Language-specific music recommendations

## Technologies Used

- **Backend**: Flask, PyMongo, Librosa, NumPy
- **Frontend**: JavaScript, D3.js, Bootstrap
- **APIs**: Spotify Web API, Translation APIs
- **Database**: MongoDB

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.