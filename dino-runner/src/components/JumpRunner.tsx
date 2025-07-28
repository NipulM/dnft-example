import { useEffect, useRef, useState } from 'react';
import douxImage from '../assets/doux.png';
import { mint, switchToBaseSepolia, updateVisualState, getStats } from '../utils/contract';
import { getAccountNFTs, getOwnedTokenIds } from '../utils/alchemy';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function JumpRunner() {
  // --- Game State ---
  const [gameStarted, setGameStarted] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [position, setPosition] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [animationFrame, setAnimationFrame] = useState(0);

  // --- Web3 & Minting State ---
  const [account, setAccount] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintMessage, setMintMessage] = useState('');
  const [ownedTokenIds, setOwnedTokenIds] = useState<number[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);

  // --- NFT Upgrade State ---
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [userNFTs, setUserNFTs] = useState<any[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);

  const obstacleRef = useRef<HTMLDivElement>(null);
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dinoRef = useRef<HTMLDivElement>(null);

  // Determine upgrade eligibility and new state
  const getUpgradeInfo = (score: number) => {
    if (score >= 499) return { eligible: true, newStateId: 3, tier: "Cretaceous King" };
    if (score >= 99) return { eligible: true, newStateId: 2, tier: "Mesozoic Marathoner" };
    return { eligible: false, newStateId: 0, tier: "Hatchling" };
  };

  // Load user NFTs
  const loadUserNFTs = async (address: string) => {
    setIsLoadingNFTs(true);
    try {
      const nfts = await getAccountNFTs(address);
      setUserNFTs(nfts.ownedNfts);
    } catch (error) {
      console.error("Failed to load user NFTs:", error);
    } finally {
      setIsLoadingNFTs(false);
    }
  };

  // ✅ Handle NFT Upgrade
  const handleUpgrade = async () => {
    if (!selectedTokenId || !account) return;

    const upgradeInfo = getUpgradeInfo(score);
    setIsUpgrading(true);
    setUpgradeMessage("Confirm upgrade transaction in your wallet...");

    try {
      await switchToBaseSepolia();
      await updateVisualState(parseInt(selectedTokenId), upgradeInfo.newStateId, () => {
        setShowUpgradeModal(false);
        setSelectedTokenId(null);
        loadUserNFTs(account);
      });
      
      setUpgradeMessage(`Success! Your NFT #${selectedTokenId} has been upgraded to ${upgradeInfo.tier}!`);
      setShowUpgradeModal(false);
      setSelectedTokenId(null);
      
      // Refresh NFT data after upgrade
      await loadUserNFTs(account);
    } catch (error) {
      console.error("Upgrade failed:", error);
      setUpgradeMessage("Upgrade failed. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

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
      
      // Refresh NFT data after minting
      await loadUserNFTs(account);
    } catch (error) {
      console.error("Minting failed:", error);
      setMintMessage("Minting failed. Please try again.");
    } finally {
      setIsMinting(false);
    }
  };

  // ✅ Handle Update Stats Logic
  // const handleUpdateStats = async () => {
  //   if (!account) {
  //     alert("Please connect your wallet first.");
  //     return;
  //   }
    
  //   try {
  //     // await switchToBaseSepolia();
  //     const stats = await getStats(2);
  //     console.log("Stats:", stats);
  //     // await updateStats(0, 10, 3, 100);
  //     // alert("Update stats transaction successful!");
  //   } catch (error) {
  //     console.error("Update stats failed:", error);
  //     alert("Update stats failed. Please try again.");
  //   }
  // };

  // 🔗 Connect Wallet Logic
  const handleConnectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask or another wallet extension!");
        return;
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        const connectedAccount = accounts[0];
        setAccount(connectedAccount);
        
        setIsLoadingTokens(true);
        try {
          await switchToBaseSepolia();
          const tokenIds = await getOwnedTokenIds(connectedAccount);
          setOwnedTokenIds(tokenIds);
          console.log('Owned token IDs:', tokenIds);
          
          // Load user NFTs
          await loadUserNFTs(connectedAccount);
        } catch (error) {
          console.error("Failed to get owned token IDs:", error);
        } finally {
          setIsLoadingTokens(false);
        }
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
    setUpgradeMessage('');
    if (obstacleRef.current) {
      obstacleRef.current.style.animation = 'none';
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      obstacleRef.current.offsetHeight;
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
    setMintMessage('');
    setUpgradeMessage('');
    setShowUpgradeModal(false);
    setSelectedTokenId(null);
    if (obstacleRef.current) {
      obstacleRef.current.style.animation = 'none';
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      obstacleRef.current.offsetHeight;
      obstacleRef.current.style.animation = '';
    }
  };

  // 🦖 Animation loop
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

  // 🎮 Game loop
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

  // 🔄 Handle wallet account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        setAccount(null);
        setOwnedTokenIds([]);
        setUserNFTs([]);
      } else if (accounts[0] !== account) {
        const newAccount = accounts[0];
        setAccount(newAccount);
        
        setIsLoadingTokens(true);
        try {
          await switchToBaseSepolia();
          const tokenIds = await getOwnedTokenIds(newAccount);
          setOwnedTokenIds(tokenIds);
          console.log('Owned token IDs for new account:', tokenIds);
          
          // Load NFTs for new account
          await loadUserNFTs(newAccount);
        } catch (error) {
          console.error("Failed to get owned token IDs:", error);
        } finally {
          setIsLoadingTokens(false);
        }
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [account]);

  const obstacleAnimationClass = gameStarted && !gameOver ? 'animate-obstacle-slide' : '';
  const groundAnimationClass = gameStarted && !gameOver ? 'animate-ground-slide' : '';
  const upgradeInfo = getUpgradeInfo(score);

  return (
    <div className="relative h-screen bg-gray-100 font-press-start">
      {account && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white bg-opacity-80 px-3 py-2 rounded-lg shadow-md">
            <p className="text-sm text-gray-500">
              Wallet: {account.slice(0, 6)}...{account.slice(-4)}
            </p>
            {isLoadingTokens ? (
              <p className="text-xs text-gray-400 mt-1">Loading tokens...</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                Total NFTs: {userNFTs.length > 0 ? userNFTs.length : 'None'}
              </p>
            )}
          </div>
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
            <div className="text-gray-700 p-8 bg-gray-100 rounded-lg shadow-xl max-w-md">
              <h2 className="text-3xl">Game Over!</h2>
              <p className="text-xl my-3">Final Score: {score}</p>

              {/* Show upgrade tier achieved */}
              {upgradeInfo.eligible && (
                <div className="mb-4 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border border-yellow-300">
                  <p className="text-sm text-orange-800">🎉 {upgradeInfo.tier} Tier Unlocked!</p>
                </div>
              )}

              {/* Minting Section */}
              {account && (
                <>
                  <button
                    onClick={handleMint}
                    disabled={isMinting}
                    className="mt-2 py-2 px-4 w-[85%] text-base text-white bg-blue-500 rounded cursor-pointer hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                  >
                    {isMinting ? "Minting..." : "Mint Score as NFT"}
                  </button>
                  {mintMessage && <p className="mt-2 text-sm text-gray-600">{mintMessage}</p>}
                </>
              )}

              {/* Glowy Upgrade Button */}
              {account && upgradeInfo.eligible && userNFTs.length > 0 && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="mt-3 py-2 px-4 w-[85%] text-base text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded cursor-pointer hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg animate-pulse"
                  style={{
                    boxShadow: '0 0 20px rgba(147, 51, 234, 0.5), 0 0 40px rgba(236, 72, 153, 0.3)',
                    animation: 'glow 2s ease-in-out infinite alternate'
                  }}
                >
                Upgrade Your NFT
                </button>
              )}

              {upgradeMessage && <p className="mt-2 text-sm text-gray-600">{upgradeMessage}</p>}
              
              {/* Update Stats Button
              {account && (
                <button
                  onClick={handleUpdateStats}
                  className="mt-2 py-2 px-4 text-base text-white bg-orange-500 rounded cursor-pointer hover:bg-orange-600 transition-colors"
                >
                  Update Stats (Test)
                </button>
              )} */}
              
              <button
                onClick={restart}
                className={`w-[85%] py-2 px-4 text-base text-white bg-green-500 rounded cursor-pointer hover:bg-green-600 transition-colors ${account ? 'mt-4' : 'mt-2'}`}
              >
                Restart Game
              </button>
            </div>
          </div>
        )}

        {/* NFT Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Select NFT to Upgrade</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upgrade to {upgradeInfo.tier} tier (Level {upgradeInfo.newStateId})
              </p>
              
              {isLoadingNFTs ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading your NFTs...</p>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  {userNFTs.map((nft) => (
                    <div
                      key={nft.tokenId}
                      onClick={() => setSelectedTokenId(nft.tokenId)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedTokenId === nft.tokenId
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {nft.image?.thumbnailUrl && (
                          <img 
                            src={nft.image.thumbnailUrl} 
                            alt={nft.name}
                            className="w-16 h-16 rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 truncate">{nft.name}</h4>
                          <p className="text-sm text-gray-500 truncate">Token #{nft.tokenId}</p>
                          <p className="text-xs text-gray-400 mt-1">Balance: {nft.balance}</p>
                        </div>
                      </div>
                      {nft.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{nft.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setSelectedTokenId(null);
                  }}
                  className="flex-1 py-2 px-4 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpgrade}
                  disabled={!selectedTokenId || isUpgrading}
                  className="flex-1 py-2 px-4 text-white bg-purple-500 rounded hover:bg-purple-600 disabled:bg-gray-400 transition-colors"
                >
                  {isUpgrading ? "Upgrading..." : "Upgrade"}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Instructions when game is running */}
        {gameStarted && !gameOver && <p className="mt-3 text-gray-500 text-sm">Press SPACE to jump!</p>}
      </div>

      {/* Add glowing animation styles */}
      <style>{`
        @keyframes glow {
          from {
            box-shadow: 0 0 20px rgba(147, 51, 234, 0.5), 0 0 40px rgba(236, 72, 153, 0.3);
          }
          to {
            box-shadow: 0 0 30px rgba(147, 51, 234, 0.8), 0 0 60px rgba(236, 72, 153, 0.6);
          }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}