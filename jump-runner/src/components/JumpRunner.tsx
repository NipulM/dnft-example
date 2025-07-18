import { useEffect, useRef, useState } from 'react';
import douxImage from '../assets/doux.png';
import { mint, switchToBaseSepolia } from '../utils/contract';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function JumpRunner() {
  // --- Game State ---
  const [gameStarted, setGameStarted] = useState(false); // New state for game start
  const [isJumping, setIsJumping] = useState(false);
  const [position, setPosition] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [animationFrame, setAnimationFrame] = useState(0);

  // --- Web3 & Minting State ---
  const [account, setAccount] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintMessage, setMintMessage] = useState('');

  const obstacleRef = useRef<HTMLDivElement>(null);
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dinoRef = useRef<HTMLDivElement>(null);

  // ✅ Handle Minting Logic
  const handleMint = async () => {
    if (!account) {
      setMintMessage("Please connect your wallet first.");
      return;
    }
    
    setIsMinting(true);
    setMintMessage("Confirm transaction in your wallet...");
    try {
      await switchToBaseSepolia();
      await mint(account, score);
      setMintMessage(`Success! Your score of ${score} has been minted as an NFT.`);
    } catch (error) {
      console.error("Minting failed:", error);
      setMintMessage("Minting failed. Please try again.");
    } finally {
      setIsMinting(false);
    }
  };

  // 🔗 Connect Wallet Logic
  const handleConnectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask or another wallet extension!");
        return;
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      alert("Failed to connect wallet. Please try again.");
    }
  };

  // 🎮 Start Game Logic
  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setGameOver(false);
    setPosition(0);
    setIsJumping(false);
    setAnimationFrame(0);
    setMintMessage('');
    if (obstacleRef.current) {
      obstacleRef.current.style.animation = 'none';
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      obstacleRef.current.offsetHeight; // Trigger reflow to restart animation
      obstacleRef.current.style.animation = '';
    }
  };

  // 🔄 Restart logic
  const restart = () => {
    setScore(0);
    setGameOver(false);
    setPosition(0);
    setIsJumping(false);
    setAnimationFrame(0);
    setMintMessage(''); // Clear minting message on restart
    if (obstacleRef.current) {
      obstacleRef.current.style.animation = 'none';
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      obstacleRef.current.offsetHeight; // Trigger reflow to restart animation
      obstacleRef.current.style.animation = '';
    }
  };

  // 🦖 Animation loop - only run when game is started and not game over
  useEffect(() => {
    if (!gameStarted || gameOver || isJumping) return;
    const animInterval = setInterval(() => {
      setAnimationFrame((prev) => (prev === 2 ? 3 : 2));
    }, 150);
    return () => clearInterval(animInterval);
  }, [gameStarted, isJumping, gameOver]);

  // 🕹 Jump logic
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

  // 🎮 Game loop - only run when game is started
  useEffect(() => {
    if (!gameStarted || gameOver) {
      if (gameOver) {
        setAnimationFrame(4);
      }
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
  }, [gameStarted, gameOver]);

  // ⌨ Key press listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!gameStarted) {
          startGame();
        } else if (gameOver) {
          restart();
        } else {
          handleJump();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, isJumping, gameOver]);

  const obstacleAnimationClass = gameStarted && !gameOver ? 'animate-obstacle-slide' : '';
  const groundAnimationClass = gameStarted && !gameOver ? 'animate-ground-slide' : '';

  return (
    <div className="relative h-screen bg-gray-100 font-press-start">
      {account && (
        <div className="absolute top-4 right-4 z-10">
          <p className="text-sm text-gray-500 bg-white bg-opacity-80 px-3 py-1 rounded-lg shadow-md">
            Wallet: {account.slice(0, 6)}...{account.slice(-4)}
          </p>
        </div>
      )}
      
      {!account && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={handleConnectWallet}
            className="text-sm text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-lg shadow-md transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      )}
      
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-4xl text-gray-700 mb-5">Dino Runner</h1>
        <div className="relative w-[600px] h-[200px] border-b-2 border-gray-700 overflow-hidden bg-gray-100">
            {/* Dino */}
            <div
                ref={dinoRef}
                className="absolute bottom-0 left-5 w-6 h-6 bg-no-repeat scale-[2.5] origin-bottom-left mb-[-9px]"
                style={{
                bottom: `${position}px`,
                backgroundImage: `url(${douxImage})`,
                backgroundPosition: `-${animationFrame * 24}px 0`,
                }}
            ></div>
            {/* Obstacle */}
            <div
                ref={obstacleRef}
                className={`absolute bottom-0 flex items-end ${obstacleAnimationClass}`}
            >
              <div className="relative w-4 h-6 bg-green-700 rounded-lg mb-5 -mr-1"><div className="absolute top-1 left-1 w-px h-px bg-green-400 shadow-[2px_3px_0_theme(colors.green.400),8px_5px_0_theme(colors.green.400)]"></div></div>
              <div className="relative w-6 h-12 bg-green-600 rounded-t-lg"><div className="absolute top-2 left-2 w-px h-px bg-green-400 shadow-[3px_8px_0_theme(colors.green.400),10px_18px_0_theme(colors.green.400)]"></div></div>
              <div className="relative w-4 h-8 bg-green-700 rounded-lg mb-2 -ml-2"><div className="absolute top-1 right-1 w-px h-px bg-green-400 shadow-[-2px_5px_0_theme(colors.green.400),-6px_12px_0_theme(colors.green.400)]"></div></div>
            </div>
            {/* Ground */}
            <div className={`absolute bottom-0 left-0 w-full h-0.5 bg-repeat-x ${groundAnimationClass}`}></div>
        </div>
        <p className="text-2xl text-gray-700 mt-5">Score: {score}</p>
        
        {/* Start Screen */}
        {!gameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-white bg-opacity-75">
            <div className="text-gray-700 p-8 bg-gray-100 rounded-lg shadow-xl">
              <p className="text-lg mb-6">Jump over obstacles and collect points</p>
              <button
                onClick={startGame}
                className="py-3 px-6 text-lg text-white bg-green-500 rounded cursor-pointer hover:bg-green-600 transition-colors"
              >
                Start Game
              </button>
              <p className="mt-4 text-sm text-gray-500">Or press SPACE to start</p>
            </div>
          </div>
        )}
        
        {/* Game Over Screen */}
        {gameOver && gameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-white bg-opacity-75">
            <div className="text-gray-700 p-8 bg-gray-100 rounded-lg shadow-xl">
              <h2 className="text-3xl">Game Over!</h2>
              <p className="text-xl my-3">Final Score: {score}</p>

              {/* ✅ Minting Section */}
              {account && (
                <>
                  <button
                    onClick={handleMint}
                    disabled={isMinting}
                    className="mt-2 py-2 px-4 text-base text-white bg-blue-500 rounded cursor-pointer hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                  >
                    {isMinting ? "Minting..." : "Mint Score as NFT"}
                  </button>
                  {mintMessage && <p className="mt-3 text-sm text-gray-600">{mintMessage}</p>}
                </>
              )}
              
              <button
                onClick={restart}
                className={`py-2 px-4 text-base text-white bg-green-500 rounded cursor-pointer hover:bg-green-600 transition-colors ${account ? 'mt-4' : 'mt-2'}`}
              >
                Restart Game
              </button>

            </div>
          </div>
        )}
        
        {/* Instructions when game is running */}
        {gameStarted && !gameOver && <p className="mt-3 text-gray-500 text-sm">Press SPACE to jump!</p>}
      </div>
    </div>
  );
}