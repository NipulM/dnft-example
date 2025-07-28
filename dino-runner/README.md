# JumpRunner - dNFT Game

A simple React-based jumping game built for dNFTs (Dynamic NFTs). Control a character that jumps over obstacles to earn points.

## Features

- Simple jumping mechanics with spacebar control
- Obstacle avoidance gameplay
- Score tracking
- Game over and restart functionality
- Responsive design with Tailwind CSS

## How to Play

1. Press **SPACE** to make your character jump
2. Avoid the red obstacles coming from the right
3. Try to survive as long as possible to get a high score
4. When you hit an obstacle, click "Restart" to play again

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:

   ```bash
   cd jump-runner
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Technologies Used

- React 18
- TypeScript
- Tailwind CSS
- CSS Animations

## Project Structure

```
src/
├── components/
│   └── JumpRunner.tsx    # Main game component
├── App.tsx               # App entry point
├── index.tsx             # React entry point
└── index.css             # Global styles and Tailwind
```

## Building for Production

To create a production build:

```bash
npm run build
```

This will create an optimized build in the `build` folder.

## License

This project is part of the dNFT ecosystem.
