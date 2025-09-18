**Sequence Alignment Visualizer**
An interactive web app for visualizing DNA sequence alignments using Needleman–Wunsch (global) and Smith–Waterman (local) algorithms. Built with React, TypeScript, Vite, TailwindCSS, and Canvas rendering, it’s designed for performance, education, and usability.

**Live Demo** → https://sequence-alignment-visualizer-two.vercel.app/

**1. Features**
Alignment Algorithms

Needleman–Wunsch (global alignment)

Smith–Waterman (local alignment)

Detailed JSDoc comments explaining algorithm steps

**2. Results Display**
Aligned sequences shown in Seq1 | Match String | Seq2 format

Color-coded: green = match, red = mismatch, blue = gap

Alignment score, % identity, and alignment length summary

**3. Matrix Visualization (Optimized)**
Fully rewritten with HTML5 Canvas for smooth rendering

Handles large matrices (200×200+) without lag

Export alignment matrix as PNG

**4. Controls Panel**
Adjustable scoring scheme (match, mismatch, gap penalty)

Random DNA generator for quick testing

Sequence upload (TXT / FASTA)

Download results as TXT or CSV

**5. UI & UX**
Responsive, clean layout with grouped controls

Future-proofing: placeholder for multiple sequence alignment



**Tech Stack**
Frontend: React + TypeScript + Vite

Styling: TailwindCSS + ShadCN

Visualization: HTML5 Canvas

Build & Deploy: Node.js, Vercel/Netlify

**Project Structure**

sequence-alignment-visualizer/
├── index.html                # Main HTML entry point, loads scripts and styles via CDN.
├── metadata.json             # Application metadata.
├── README.md                 # Project documentation (you are here!).
└── src/                      # Contains all the application source code.
    ├── App.tsx                 # Main application component, manages state and layout.
    ├── index.tsx               # React entry point, renders the App component.
    ├── types.ts                # Shared TypeScript types and enums (Algorithm, Scoring, etc.).
    ├── constants.ts            # Shared constants (e.g., default scoring values).
    │
    ├── components/             # Directory for all React components.
    │   ├── ControlsPanel.tsx     # The main control panel with all user inputs.
    │   ├── MatrixVisualization.tsx # Canvas-based visualization for the DP matrix.
    │   ├── ResultsDisplay.tsx    # Component to display alignment results and stats.
    │   │
    │   └── ui/                   # Generic, reusable UI building blocks.
    │       ├── Button.tsx
    │       ├── Card.tsx
    │       ├── Input.tsx
    │       └── Select.tsx
    │
    └── services/               # Core application logic and algorithms.
        └── alignmentService.ts   # Needleman-Wunsch & Smith-Waterman implementations.
How It Works
 1. **Algorithms**

Needleman–Wunsch: Global alignment using dynamic programming.

Smith–Waterman: Local alignment, optimal subsequence matching.

Both are implemented step-by-step with comments for learning.

 2. **Visualization**

The DP scoring matrix is rendered on Canvas for speed.

Traceback path is drawn with color-coded borders (green = match, red = mismatch, blue = gap).

