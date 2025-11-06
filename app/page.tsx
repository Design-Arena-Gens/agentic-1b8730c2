'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 600;

    // Game variables
    let bird = {
      x: 50,
      y: 300,
      velocity: 0,
      gravity: 0.5,
      jump: -8,
      width: 34,
      height: 24,
    };

    let pipes: Array<{ x: number; topHeight: number; gap: number; width: number; passed: boolean }> = [];
    const pipeWidth = 60;
    const pipeGap = 150;
    let frameCount = 0;
    let currentScore = 0;
    let animationId: number;

    // Load high score from localStorage
    const savedHighScore = localStorage.getItem('flappyHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }

    // Draw bird
    const drawBird = () => {
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(bird.x, bird.y, bird.width, bird.height);

      // Eye
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(bird.x + 25, bird.y + 8, 3, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#ff8c00';
      ctx.beginPath();
      ctx.moveTo(bird.x + 34, bird.y + 12);
      ctx.lineTo(bird.x + 42, bird.y + 12);
      ctx.lineTo(bird.x + 34, bird.y + 16);
      ctx.fill();
    };

    // Draw pipes
    const drawPipes = () => {
      ctx.fillStyle = '#228b22';
      pipes.forEach(pipe => {
        // Top pipe
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);

        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.topHeight + pipe.gap, pipe.width, canvas.height);

        // Pipe caps
        ctx.fillStyle = '#1a6b1a';
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, pipe.width + 10, 20);
        ctx.fillRect(pipe.x - 5, pipe.topHeight + pipe.gap, pipe.width + 10, 20);
        ctx.fillStyle = '#228b22';
      });
    };

    // Draw background
    const drawBackground = () => {
      // Sky
      ctx.fillStyle = '#4ec0ca';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ground
      ctx.fillStyle = '#ded895';
      ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

      // Ground details
      ctx.fillStyle = '#c4b87d';
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.fillRect(i, canvas.height - 100, 10, 5);
      }
    };

    // Draw score
    const drawScore = () => {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(currentScore.toString(), canvas.width / 2, 60);
      ctx.fillText(currentScore.toString(), canvas.width / 2, 60);
    };

    // Update game
    const update = () => {
      if (!gameStarted || gameOver) return;

      // Update bird
      bird.velocity += bird.gravity;
      bird.y += bird.velocity;

      // Check ground collision
      if (bird.y + bird.height > canvas.height - 100) {
        endGame();
        return;
      }

      // Check ceiling collision
      if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
      }

      // Add pipes
      if (frameCount % 90 === 0) {
        const topHeight = Math.random() * (canvas.height - pipeGap - 200) + 100;
        pipes.push({
          x: canvas.width,
          topHeight,
          gap: pipeGap,
          width: pipeWidth,
          passed: false,
        });
      }

      // Update pipes
      pipes.forEach(pipe => {
        pipe.x -= 3;

        // Check if pipe passed
        if (!pipe.passed && pipe.x + pipe.width < bird.x) {
          pipe.passed = true;
          currentScore++;
          setScore(currentScore);
        }

        // Check collision
        if (
          bird.x + bird.width > pipe.x &&
          bird.x < pipe.x + pipe.width &&
          (bird.y < pipe.topHeight || bird.y + bird.height > pipe.topHeight + pipe.gap)
        ) {
          endGame();
        }
      });

      // Remove off-screen pipes
      pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);

      frameCount++;
    };

    // End game
    const endGame = () => {
      setGameOver(true);
      if (currentScore > highScore) {
        setHighScore(currentScore);
        localStorage.setItem('flappyHighScore', currentScore.toString());
      }
    };

    // Draw everything
    const draw = () => {
      drawBackground();
      drawPipes();
      drawBird();
      drawScore();
    };

    // Game loop
    const gameLoop = () => {
      update();
      draw();
      animationId = requestAnimationFrame(gameLoop);
    };

    // Handle input
    const handleJump = () => {
      if (!gameStarted) {
        setGameStarted(true);
        gameLoop();
      } else if (gameOver) {
        // Reset game
        bird.y = 300;
        bird.velocity = 0;
        pipes = [];
        frameCount = 0;
        currentScore = 0;
        setScore(0);
        setGameOver(false);
        setGameStarted(false);
      } else {
        bird.velocity = bird.jump;
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };

    const handleClick = () => {
      handleJump();
    };

    canvas.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyPress);

    // Initial draw
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameStarted, gameOver, highScore]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#4ec0ca',
    }}>
      <h1 style={{
        color: '#fff',
        fontSize: '48px',
        marginBottom: '20px',
        textShadow: '3px 3px 0 #000',
      }}>
        Flappy Bird
      </h1>

      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{
            border: '4px solid #000',
            borderRadius: '8px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
          }}
        />

        {!gameStarted && !gameOver && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#fff',
            fontSize: '24px',
            fontWeight: 'bold',
            textShadow: '2px 2px 0 #000',
          }}>
            Click or Press Space to Start
          </div>
        )}

        {gameOver && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: '30px',
            borderRadius: '10px',
            color: '#fff',
          }}>
            <h2 style={{ fontSize: '36px', marginBottom: '10px' }}>Game Over!</h2>
            <p style={{ fontSize: '24px', marginBottom: '10px' }}>Score: {score}</p>
            <p style={{ fontSize: '20px', marginBottom: '20px' }}>High Score: {highScore}</p>
            <p style={{ fontSize: '18px' }}>Click or Press Space to Restart</p>
          </div>
        )}
      </div>

      <div style={{
        marginTop: '20px',
        color: '#fff',
        fontSize: '18px',
        textShadow: '2px 2px 0 #000',
      }}>
        High Score: {highScore}
      </div>
    </div>
  );
}
