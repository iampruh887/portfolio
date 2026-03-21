# Circular Pie Menu Implementation

## Overview
Built a 3-slice circular pie menu where each slice pops out individually when hovered, with text labels along the curved edges and an interactive center button.

## Key Challenges & Solutions

### Problem: Overlapping Slices
Initial CSS-based approach using `conic-gradient` with stacked divs caused z-index issues where only the top slice received hover events.

### Solution: SVG Path-Based Approach
Switched to SVG `<path>` elements with proper geometric definitions:
- Each slice is a true 120° wedge (no overlapping transparent areas)
- Ring mask cuts out the center circle
- Each slice independently detectable for hover events
- Grouped slices with text using `<g>` elements for synchronized transforms

## Technical Implementation

### Structure
- 3 SVG paths representing 120° slices each
- SVG `<textPath>` elements for curved text along each arc
- React state tracks which slice is hovered
- Center "walkthrough" button overlays the middle

### Dimensions
- Circle diameter: 500px
- Center button: 300px diameter
- Ring width: ~100px (outer radius 250px, inner radius 150px)
- Text size: 6px, positioned at radius 40 in SVG viewBox

### Text Labels
- Slice 1 (top): "PROJECTS"
- Slice 2 (bottom-right): "BLOGS"
- Slice 3 (bottom-left): "ABOUT ME"

Text follows curved paths at radius 40 (middle of the ring), uses "Bitcount Grid Double Ink" font, and scales with the slice on hover.

### Performance Optimizations
- `will-change: transform, filter` on slice groups for GPU acceleration
- `text-rendering: optimizeSpeed` on text for faster SVG rendering
- `transform-style: preserve-3d` for efficient 3D transforms

### Hover Effects

#### Slice Hover
Each slice group (slice + text) pops towards the user in 3D:
- `translateZ(50px)` - moves forward in 3D space
- `scale(1.1)` - slight size increase
- `brightness(1.3)` - visual highlight
- `drop-shadow` - depth perception
- `perspective: 800px` on parent for 3D context
- `overflow: visible` prevents clipping during animation

#### Center Button Hover
The walkthrough button displays an inset shadow effect:
- `inset box-shadow` with grey gradient
- Creates depth perception towards the inside
- Smooth transition for visual feedback

### Colors
- All slices: yellow
- Text: black
- Center button: black background with white text
- Hover shadow: greyish gradient (rgba(128, 128, 128, 0.5))

## Files Modified
- `src/App.jsx` - SVG structure with grouped slices, text paths, and hover handlers
- `src/App.css` - 3D transforms, group styling, text formatting, and center button effects
