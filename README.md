# BlockPilot

BlockPilot is a high-performance cognitive puzzle suite built with React Native. It challenges players through two distinct mental disciplines: programmatic logic and spatial memory.

## Game Modes

1. **Loop Pilot (Logic & Sequencing)**
   A programmatic navigation challenge. You don't control the plane in real-time; instead, you build a deck of instructions to automate its flight.
   
   * Instruction Set: Forward, Turn Left, Turn Right, and Repeat (Loops).
   * Conditional Execution: Program the plane to only turn or paint when it lands on specific colored tiles (e.g., "Turn Left if tile is Amber").
   * The Objective: Collect all target stars (iE points) without straying from the flight path.
   * Smart Engine: Features normalized 360° rotation handling and idempotent state updates.

2. **Memory Tiles (Pattern Recognition)**
   A fast-paced board recall game.
   
   * Flash Phase: Study a randomized pattern of tiles.
   * Recall Phase: Reconstruct the pattern from memory.
   * Adaptive Difficulty: The grid complexity scales as your accuracy improves.

## Technical Architecture

* State Management: Zustand (https://github.com/pmndrs/zustand) drives the game loop and instruction engine with high-frequency updates (50ms intervals).

* Animations: React Native Reanimated (https://docs.swmansion.com/react-native-reanimated/) for fluid plane rotations and tile transitions.

* Persistence: Local progress is saved in SQLite. The app automatically tracks solved levels and finds your first unsolved challenge upon launch.

* Cloud Sync: Integrated with Firebase (Firestore).
  
  * Background Synchronization: On startup, the app checks for new puzzles.
  * Offline First: If offline, the app uses cached SQLite data.
  * Reactive UI: Real-time sync status indicators (Syncing/Success/Error) keep the user informed.

* Styling: NativeWind (https://www.nativewind.dev/) (Tailwind CSS for React Native) for a modern dark-mode aesthetic.
  
  ---
  
  🚀 Getting Started
  
  Prerequisites

* Bun (https://bun.sh/) (Recommended) or Node.js.

* Expo Go app on your mobile device or an Emulator.
  
  Installation
1. Clone the repo:
   1    git clone https://github.com/Aaron-Ochieng/BlockPilot.git
   2    cd BlockPilot

2. Install dependencies:
   1    bun install

3. Start the development server:
   1    npx expo start

### Contributing

   We love contributions! Whether you're fixing a bug, adding a new level, or optimizing the logic engine, here’s how you can help:

1. New Levels
   Levels are stored in Firestore and synced to SQLite. To propose a new level design, check src/loops/gameLoop.ts for the schema structure.

2. The Logic Engine
   If you're working on the movement or coloring logic:
   
   * Location: src/store/loop-game-instructions.tsx
* Standard: All movement must use normalized rotation (0°, 90°, 180°, 270°).

* Safety: Always include bounds checking when accessing the gameBoard array.
  
  3. Contribution Workflow
1. Fork the project.

2. Create a Feature Branch (git checkout -b feature/AmazingFeature).

3. Commit Your Changes (git commit -m 'Add some AmazingFeature').

4. Push to the Branch (git push origin feature/AmazingFeature).

5. Open a Pull Request.
   
   Code Style
* Use TypeScript for all logic.

* Maintain the dark-mode aesthetic using Tailwind classes.

* Ensure all state updates in the store are immutable and idempotent.

### License

Distributed under the MIT License. See LICENSE for more information.
