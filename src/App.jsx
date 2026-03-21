import { useState } from 'react';
import './App.css';

function App() {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  return (
    <div className="wrapper">
      <div className="circle">
        <svg className="pie-menu" viewBox="0 0 100 100">
          <defs>
            <mask id="ring-mask">
              <circle cx="50" cy="50" r="50" fill="white" />
              <circle cx="50" cy="50" r="30" fill="black" />
            </mask>
            
            {/* Define curved paths for text - positioned at radius 40 (middle of ring) */}
            {/* Slice 1: Top arc from 0° to 120° */}
            <path id="curve1" d="M 50,10 A 40,40 0 0,1 84.64,70" fill="none" />
            {/* Slice 2: Bottom-right arc from 240° to 120° (reversed) */}
            <path id="curve2" d="M 15.36,70 A 40,40 0 0,0 84.64,70" fill="none" />
            {/* Slice 3: Bottom-left arc from 240° to 360° */}
            <path id="curve3" d="M 15.36,70 A 40,40 0 0,1 50,10" fill="none" />
          </defs>
          
          {/* Slice 1: Top (0° to 120°) */}
          <g className={`slice-group ${hoveredSlice === 1 ? 'hovered' : ''}`}>
            <path
              className="slice slice1"
              d="M 50,50 L 50,0 A 50,50 0 0,1 93.3,75 Z"
              mask="url(#ring-mask)"
              onMouseEnter={() => setHoveredSlice(1)}
              onMouseLeave={() => setHoveredSlice(null)}
            />
            <text className="slice-text">
              <textPath href="#curve1" startOffset="50%" textAnchor="middle">
                PROJECTS
              </textPath>
            </text>
          </g>
          
          {/* Slice 2: Bottom Right (120° to 240°) */}
          <g className={`slice-group ${hoveredSlice === 2 ? 'hovered' : ''}`}>
            <path
              className="slice slice2"
              d="M 50,50 L 93.3,75 A 50,50 0 0,1 6.7,75 Z"
              mask="url(#ring-mask)"
              onMouseEnter={() => setHoveredSlice(2)}
              onMouseLeave={() => setHoveredSlice(null)}
            />
            <text className="slice-text">
              <textPath href="#curve2" startOffset="50%" textAnchor="middle">
                BLOGS
              </textPath>
            </text>
          </g>
          
          {/* Slice 3: Bottom Left (240° to 360°) */}
          <g className={`slice-group ${hoveredSlice === 3 ? 'hovered' : ''}`}>
            <path
              className="slice slice3"
              d="M 50,50 L 6.7,75 A 50,50 0 0,1 50,0 Z"
              mask="url(#ring-mask)"
              onMouseEnter={() => setHoveredSlice(3)}
              onMouseLeave={() => setHoveredSlice(null)}
            />
            <text className="slice-text">
              <textPath href="#curve3" startOffset="50%" textAnchor="middle">
                ABOUT ME
              </textPath>
            </text>
          </g>
        </svg>

        <div className="walkthrough">
          click me!
        </div>
      </div>
    </div>
  );
}

export default App;