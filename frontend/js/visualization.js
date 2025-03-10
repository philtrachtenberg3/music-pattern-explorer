// Chord Visualization Module

/**
 * Visualize a chord progression using D3.js
 * @param {Array} chords - Array of chord names
 * @param {String} pattern - The chord progression pattern (e.g., "I-IV-V")
 */
function visualizeChordProgression(chords, pattern) {
    const container = document.getElementById('chord-visualization');
    container.innerHTML = '';
    
    if (!chords || chords.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No chord data available to visualize.</div>';
        return;
    }
    
    // Create title
    const title = document.createElement('h4');
    title.textContent = `Progression: ${pattern}`;
    title.className = 'mb-4 text-center';
    container.appendChild(title);
    
    // Create chord diagram using D3
    const width = container.clientWidth;
    const height = 300;
    
    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'chord-diagram');
    
    // Create a group for the visualization
    const g = svg.append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    // Draw circle of fifths as background (if suitable for this visualization)
    drawCircleOfFifths(g, Math.min(width, height) / 2.5);
    
    // Draw chord progression
    drawChordProgression(g, chords, Math.min(width, height) / 3);
    
    // Add legend/explanation
    addChordLegend(container, chords);
    
    // Add theory explanation based on the progression
    addTheoryExplanation(container, pattern);
}

/**
 * Draw the circle of fifths
 * @param {Selection} g - D3 selection for the group
 * @param {Number} radius - Radius of the circle
 */
function drawCircleOfFifths(g, radius) {
    // Define the keys in the circle of fifths
    const keys = [
        { name: 'C', angle: 0 },
        { name: 'G', angle: 30 },
        { name: 'D', angle: 60 },
        { name: 'A', angle: 90 },
        { name: 'E', angle: 120 },
        { name: 'B', angle: 150 },
        { name: 'F♯', angle: 180 },
        { name: 'D♭', angle: 210 },
        { name: 'A♭', angle: 240 },
        { name: 'E♭', angle: 270 },
        { name: 'B♭', angle: 300 },
        { name: 'F', angle: 330 }
    ];
    
    // Draw the main circle
    g.append('circle')
        .attr('r', radius)
        .attr('class', 'key-circle')
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
        .attr('stroke-width', 1);
    
    // Draw each key on the circle
    keys.forEach(key => {
        const angle = key.angle * (Math.PI / 180);
        const x = Math.sin(angle) * radius;
        const y = -Math.cos(angle) * radius;
        
        // Draw key label
        g.append('text')
            .attr('x', x)
            .attr('y', y)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('class', 'key-text major')
            .text(key.name);
        
        // Draw relative minor
        const minorAngle = (key.angle + 15) * (Math.PI / 180);
        const minorX = Math.sin(minorAngle) * (radius * 0.85);
        const minorY = -Math.cos(minorAngle) * (radius * 0.85);
        
        // Calculate relative minor name (simplified)
        let minorName = '';
        switch(key.name) {
            case 'C': minorName = 'Am'; break;
            case 'G': minorName = 'Em'; break;
            case 'D': minorName = 'Bm'; break;
            case 'A': minorName = 'F♯m'; break;
            case 'E': minorName = 'C♯m'; break;
            case 'B': minorName = 'G♯m'; break;
            case 'F♯': minorName = 'D♯m'; break;
            case 'D♭': minorName = 'B♭m'; break;
            case 'A♭': minorName = 'Fm'; break;
            case 'E♭': minorName = 'Cm'; break;
            case 'B♭': minorName = 'Gm'; break;
            case 'F': minorName = 'Dm'; break;
            default: minorName = ''; break;
        }
        
        g.append('text')
            .attr('x', minorX)
            .attr('y', minorY)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('class', 'key-text minor')
            .text(minorName);
    });
}

/**
 * Draw a chord progression
 * @param {Selection} g - D3 selection for the group
 * @param {Array} chords - Array of chord names
 * @param {Number} radius - Radius for the visualization
 */
function drawChordProgression(g, chords, radius) {
    // Calculate positions for chords in a circle
    const chordPositions = [];
    const angleStep = (2 * Math.PI) / chords.length;
    
    chords.forEach((chord, i) => {
        const angle = i * angleStep;
        chordPositions.push({
            x: Math.sin(angle) * radius,
            y: -Math.cos(angle) * radius,
            chord: chord
        });
    });
    
    // Draw connections between chords
    for (let i = 0; i < chordPositions.length; i++) {
        const current = chordPositions[i];
        const next = chordPositions[(i + 1) % chordPositions.length];
        
        g.append('line')
            .attr('x1', current.x)
            .attr('y1', current.y)
            .attr('x2', next.x)
            .attr('y2', next.y)
            .attr('class', 'chord-connection')
            .attr('stroke', '#aaa')
            .attr('stroke-width', 2);
    }
    
    // Draw chord circles
    chordPositions.forEach((pos, i) => {
        // Determine if chord is major or minor
        const isMinor = pos.chord.includes('m') && !pos.chord.includes('maj');
        
        g.append('circle')
            .attr('cx', pos.x)
            .attr('cy', pos.y)
            .attr('r', 25)
            .attr('fill', isMinor ? '#6c757d' : '#007bff')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
        
        // Add chord text
        g.append('text')
            .attr('x', pos.x)
            .attr('y', pos.y)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .attr('font-weight', 'bold')
            .text(pos.chord);
        
        // Add numerical label
        g.append('text')
            .attr('x', pos.x)
            .attr('y', pos.y + 40)
            .attr('text-anchor', 'middle')
            .attr('fill', '#333')
            .text(i + 1);
    });
}

/**
 * Add a legend explaining the chord types
 * @param {Element} container - Container element
 * @param {Array} chords - Array of chord names
 */
function addChordLegend(container, chords) {
    const legendDiv = document.createElement('div');
    legendDiv.className = 'chord-legend mt-4';
    
    // Create a row for the legend
    const row = document.createElement('div');
    row.className = 'row justify-content-center';
    
    // Add legend items for each chord
    chords.forEach((chord, i) => {
        const col = document.createElement('div');
        col.className = 'col-auto';
        
        const isMinor = chord.includes('m') && !chord.includes('maj');
        
        col.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="chord ${isMinor ? 'minor' : 'major'} me-2">${chord}</div>
                <div>
                    <div><strong>Position ${i+1}</strong></div>
                    <div class="small text-muted">${isMinor ? 'Minor Chord' : 'Major Chord'}</div>
                </div>
            </div>
        `;
        
        row.appendChild(col);
    });
    
    legendDiv.appendChild(row);
    container.appendChild(legendDiv);
}

/**
 * Add theory explanation based on chord progression pattern
 * @param {Element} container - Container element
 * @param {String} pattern - Chord progression pattern
 */
function addTheoryExplanation(container, pattern) {
    const explanationDiv = document.createElement('div');
    explanationDiv.className = 'theory-explanation mt-4';
    
    let explanation = '';
    
    // Add explanation based on common patterns
    switch(pattern) {
        case 'I-IV-V':
            explanation = `
                <p>The I-IV-V progression is one of the most common in popular music, especially in blues and rock. 
                These are the three major chords in a major scale.</p>
                <p>It creates a strong sense of resolution when returning to the I chord.</p>
            `;
            break;
        case 'I-V-vi-IV':
            explanation = `
                <p>The I-V-vi-IV progression is extremely popular in contemporary pop music.
                It's sometimes called the "pop-punk progression" or "sensitive female chord progression".</p>
                <p>The vi chord adds an emotional quality by introducing a minor chord.</p>
            `;
            break;
        case 'ii-V-I':
            explanation = `
                <p>The ii-V-I progression is the backbone of jazz harmony.
                It creates a strong pull toward the tonic (I) chord.</p>
                <p>In jazz, these chords are often played as 7th chords: ii7-V7-Imaj7.</p>
            `;
            break;
        case 'vi-IV-I-V':
            explanation = `
                <p>This is a variation of the I-V-vi-IV progression, starting on the relative minor chord.
                It's used in many pop and rock songs and creates a more melancholic feeling.</p>
            `;
            break;
        case 'I-vi-IV-V':
            explanation = `
                <p>The I-vi-IV-V progression, also known as the '50s progression', was common in doo-wop and early rock and roll.</p>
                <p>It has a nostalgic quality and creates a strong sense of resolution.</p>
            `;
            break;
        default:
            // For other patterns, provide a generic explanation
            explanation = `
                <p>This chord progression creates a unique harmonic journey. The relationships between
                these chords create tension and resolution that gives the music its emotional quality.</p>
                <p>When analyzing chord progressions, consider how each chord relates to the key of the song
                and how they create movement toward or away from the tonic (I) chord.</p>
            `;
    }
    
    explanationDiv.innerHTML = `
        <h5>Music Theory Explanation</h5>
        ${explanation}
    `;
    
    container.appendChild(explanationDiv);
}