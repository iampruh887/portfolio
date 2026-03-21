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
          </defs>
          
          {/* Slice 1: Top (0° to 120°) */}
          <path
            className={`slice slice1 ${hoveredSlice === 1 ? 'hovered' : ''}`}
            d="M 50,50 L 50,0 A 50,50 0 0,1 93.3,75 Z"
            mask="url(#ring-mask)"
            onMouseEnter={() => setHoveredSlice(1)}
            onMouseLeave={() => setHoveredSlice(null)}
          />
          
          {/* Slice 2: Bottom Right (120° to 240°) */}
          <path
            className={`slice slice2 ${hoveredSlice === 2 ? 'hovered' : ''}`}
            d="M 50,50 L 93.3,75 A 50,50 0 0,1 6.7,75 Z"
            mask="url(#ring-mask)"
            onMouseEnter={() => setHoveredSlice(2)}
            onMouseLeave={() => setHoveredSlice(null)}
          />
          
          {/* Slice 3: Bottom Left (240° to 360°) */}
          <path
            className={`slice slice3 ${hoveredSlice === 3 ? 'hovered' : ''}`}
            d="M 50,50 L 6.7,75 A 50,50 0 0,1 50,0 Z"
            mask="url(#ring-mask)"
            onMouseEnter={() => setHoveredSlice(3)}
            onMouseLeave={() => setHoveredSlice(null)}
          />
        </svg>

        <div className="walkthrough">
          click me!
        </div>
      </div>
    </div>
  );
}

export default App;