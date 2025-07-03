import React, { useEffect, useRef, useState } from 'react';
import douxImage from '../assets/doux.png'; // Using your import path

export default function JumpRunner() {
  const [isJumping, setIsJumping] = useState(false);
  const [position, setPosition] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [animationFrame, setAnimationFrame] = useState(0);

  const obstacleRef = useRef<HTMLDivElement>(null);
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dinoRef = useRef<HTMLDivElement>(null);

  // Animation loop for the dino
  useEffect(() => {
    if (gameOver || isJumping) return;

    const animInterval = setInterval(() => {
      setAnimationFrame((prev) => (prev === 2 ? 3 : 2));
    }, 150);

    return () => clearInterval(animInterval);
  }, [isJumping, gameOver]);

  // Handle jump logic
  const handleJump = () => {
    if (isJumping || gameOver) return;
    setIsJumping(true);
    setAnimationFrame(0);

    let height = 0;
    const upInterval = setInterval(() => {
      if (height >= 150) {
        clearInterval(upInterval);
        const downInterval = setInterval(() => {
          if (height <= 0) {
            clearInterval(downInterval);
            setIsJumping(false);
          } else {
            height -= 10;
            setPosition(height);
          }
        }, 20);
      } else {
        height += 10;
        setPosition(height);
      }
    }, 20);
  };

  // Game loop for score and collision
  useEffect(() => {
    if (gameOver) {
      setAnimationFrame(4);
      return;
    }

    gameIntervalRef.current = setInterval(() => {
      setScore((prev) => prev + 1);

      const obstacle = obstacleRef.current;
      const dino = dinoRef.current;
      if (!obstacle || !dino) return;

      const dinoRect = dino.getBoundingClientRect();
      const obstacleRect = obstacle.getBoundingClientRect();

      if (
        dinoRect.right > obstacleRect.left &&
        dinoRect.left < obstacleRect.right &&
        dinoRect.bottom > obstacleRect.top
      ) {
        setGameOver(true);
        if (gameIntervalRef.current) {
          clearInterval(gameIntervalRef.current);
        }
      }
    }, 100);

    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
      }
    };
  }, [gameOver]);

  // Restart game
  const restart = () => {
    setScore(0);
    setGameOver(false);
    setPosition(0);
    setIsJumping(false);
    setAnimationFrame(0);
    if (obstacleRef.current) {
      obstacleRef.current.style.animation = 'none';
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      obstacleRef.current.offsetHeight;
      obstacleRef.current.style.animation = '';
    }
  };

  // Key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameOver) {
          restart();
        } else {
          handleJump();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isJumping, gameOver]);

  // Dynamic classes for animation pausing
  const obstacleAnimationClass = !gameOver ? 'animate-obstacle-slide' : '';
  const groundAnimationClass = !gameOver ? 'animate-ground-slide' : '';

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 font-press-start">
      <h1 className="text-4xl text-gray-700 mb-5">Dino Runner</h1>
      <div className="relative w-[600px] h-[200px] border-b-2 border-gray-700 overflow-hidden bg-gray-100">
        <div
          ref={dinoRef}
          className="absolute bottom-0 left-5 w-6 h-6 bg-no-repeat scale-[2.5] origin-bottom-left mb-[-9px]"
          style={{
            bottom: `${position}px`,
            backgroundImage: `url(${douxImage})`,
            backgroundPosition: `-${animationFrame * 24}px 0`,
          }}
        ></div>
        <div
          ref={obstacleRef}
          // Main container for positioning and animation
          className={`absolute bottom-0 flex items-end ${obstacleAnimationClass}`}
        >
          {/* Left Arm */}
          <div className="relative w-4 h-6 bg-green-700 rounded-lg mb-5 -mr-1">
            {/* Spines/Texture on the arm */}
            <div className="absolute top-1 left-1 w-px h-px bg-green-400 shadow-[2px_3px_0_theme(colors.green.400),8px_5px_0_theme(colors.green.400)]"></div>
          </div>

          {/* Main Trunk */}
          <div className="relative w-6 h-12 bg-green-600 rounded-t-lg">
            {/* Spines/Texture on the trunk */}
            <div className="absolute top-2 left-2 w-px h-px bg-green-400 shadow-[3px_8px_0_theme(colors.green.400),10px_18px_0_theme(colors.green.400)]"></div>
          </div>

          {/* Right Arm */}
          <div className="relative w-4 h-8 bg-green-700 rounded-lg mb-2 -ml-2">
            {/* Spines/Texture on the arm */}
            <div className="absolute top-1 right-1 w-px h-px bg-green-400 shadow-[-2px_5px_0_theme(colors.green.400),-6px_12px_0_theme(colors.green.400)]"></div>
          </div>
        </div>
        <div
          className={`absolute bottom-0 left-0 w-full h-0.5 bg-repeat-x ${groundAnimationClass}`}
          // style={{ backgroundImage: `url(${groundImage})` }}
        ></div>
      </div>
      <p className="text-2xl text-gray-700 mt-5">Score: {score}</p>
      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-gray-700">
            <h2 className="text-3xl">Game Over!</h2>
            <button
              onClick={restart}
              className="mt-4 py-2 px-4 text-base text-white bg-green-500 rounded cursor-pointer hover:bg-green-600 transition-colors"
            >
              Restart
            </button>
          </div>
        </div>
      )}
      <p className="mt-3 text-gray-500 text-sm">Press SPACE to jump!</p>
    </div>
  );
}