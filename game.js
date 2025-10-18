class FlappySharkGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'START'; // START, PLAYING, GAME_OVER
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('dyingSharkHighScore')) || 0;
        this.animationId = null;

        // Game objects
        this.shark = null;
        this.obstacles = [];
        this.particles = [];
        this.sharkImage = null;

        // Game settings
        this.gravity = 0.35;
        this.jumpPower = -9;
        this.obstacleSpeed = 1.2;
        this.baseObstacleGap = 280; // Much larger gap to start
        this.obstacleGap = this.baseObstacleGap;
        this.obstacleWidth = 45;
        this.baseSpawnRate = 240; // Much more space between obstacles initially
        this.spawnRate = this.baseSpawnRate;
        this.frameCount = 0;

        // Responsive settings
        this.baseWidth = 800;
        this.baseHeight = 600;
        this.minWidth = 300;
        this.minHeight = 500;

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.loadSharkImage();
        this.createShark();
        this.updateUI();
        this.gameLoop();
    }

    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = document.querySelector('.game-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate responsive dimensions
        let width, height;

        if (containerWidth / containerHeight > this.baseWidth / this.baseHeight) {
            // Container is wider than game aspect ratio
            height = Math.min(containerHeight, this.baseHeight);
            width = height * (this.baseWidth / this.baseHeight);
        } else {
            // Container is taller than game aspect ratio
            width = Math.min(containerWidth, this.baseWidth);
            height = width * (this.baseHeight / this.baseWidth);
        }

        // Ensure minimum size
        width = Math.max(width, this.minWidth);
        height = Math.max(height, this.minHeight);

        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';

        // Update game scale
        this.scaleX = width / this.baseWidth;
        this.scaleY = height / this.baseHeight;
    }

    setupEventListeners() {
        // Start button
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });

        // Mute button
        document.getElementById('muteButton').addEventListener('click', () => {
            const isMuted = audioManager.toggleMute();
            document.getElementById('muteButton').textContent = isMuted ? '🔇' : '🔊';
        });

        // Game controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleInput();
            }
        });

        this.canvas.addEventListener('click', () => {
            this.handleInput();
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput();
        });

        // Prevent scrolling on touch
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    handleInput() {
        // Enable audio on first user interaction
        audioManager.enableAudio();

        if (this.gameState === 'START') {
            this.startGame();
        } else if (this.gameState === 'PLAYING') {
            this.shark.velocityY = this.jumpPower;
            audioManager.playSound('jump');
        } else if (this.gameState === 'GAME_OVER') {
            this.restartGame();
        }
    }

    startGame() {
        this.gameState = 'PLAYING';
        this.score = 0;
        this.obstacles = [];
        this.particles = [];
        this.frameCount = 0;
        this.obstacleSpeed = 1.2;
        this.obstacleGap = this.baseObstacleGap;
        this.spawnRate = this.baseSpawnRate;

        this.createShark();
        this.updateUI();
        audioManager.startMusic();
    }

    restartGame() {
        this.startGame();
    }

    loadSharkImage() {
        this.sharkImage = new Image();
        this.sharkImage.onload = () => {
            console.log('Shark image loaded successfully');
        };
        this.sharkImage.onerror = () => {
            console.warn('Shark image failed to load, using fallback rendering');
        };
        this.sharkImage.src = 'shark.png';
    }

    createShark() {
        this.shark = {
            x: 100 * this.scaleX,
            y: this.canvas.height / 2,
            width: 50 * this.scaleX,
            height: 35 * this.scaleY,
            velocityY: 0,
            rotation: 0
        };
    }

    update() {
        if (this.gameState !== 'PLAYING') return;

        this.frameCount++;

        // Update shark
        this.shark.velocityY += this.gravity;
        this.shark.y += this.shark.velocityY;
        this.shark.rotation = Math.min(Math.max(this.shark.velocityY * 0.1, -0.5), 0.5);

        // Update obstacles
        this.updateObstacles();

        // Update particles
        this.updateParticles();

        // Check collisions
        this.checkCollisions();

        // Update score
        this.updateScore();

        // Update difficulty
        this.updateDifficulty();
    }

    updateObstacles() {
        // Spawn new obstacles
        if (this.frameCount % this.spawnRate === 0) {
            this.spawnObstacle();
        }

        // Update existing obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.obstacleSpeed * this.scaleX;

            // Remove obstacles that are off screen
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
    }

    spawnObstacle() {
        const gapY = Math.random() * (this.canvas.height - this.obstacleGap * this.scaleY - 100) + 50;

        this.obstacles.push({
            x: this.canvas.width,
            y: 0,
            width: this.obstacleWidth * this.scaleX,
            height: gapY,
            passed: false
        });

        this.obstacles.push({
            x: this.canvas.width,
            y: gapY + this.obstacleGap * this.scaleY,
            width: this.obstacleWidth * this.scaleX,
            height: this.canvas.height - gapY - this.obstacleGap * this.scaleY,
            passed: false
        });
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.life--;

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        // Ground and ceiling collision
        if (this.shark.y + this.shark.height > this.canvas.height || this.shark.y < 0) {
            this.gameOver();
            return;
        }

        // Obstacle collision
        for (const obstacle of this.obstacles) {
            if (this.shark.x < obstacle.x + obstacle.width &&
                this.shark.x + this.shark.width > obstacle.x &&
                this.shark.y < obstacle.y + obstacle.height &&
                this.shark.y + this.shark.height > obstacle.y) {
                this.gameOver();
                return;
            }
        }
    }

    updateScore() {
        for (const obstacle of this.obstacles) {
            if (!obstacle.passed && obstacle.x + obstacle.width < this.shark.x) {
                obstacle.passed = true;
                this.score++;
                audioManager.playSound('score');
                this.createScoreParticles(obstacle.x + obstacle.width, obstacle.y + obstacle.height / 2);
            }
        }
    }

    updateDifficulty() {
        // Gradually increase speed (slower progression)
        const newSpeed = 1.2 + Math.floor(this.score / 8) * 0.25;
        this.obstacleSpeed = Math.min(newSpeed, 3.5);

        // Gradually decrease gap size (make holes smaller, but much slower)
        const newGap = this.baseObstacleGap - Math.floor(this.score / 5) * 8;
        this.obstacleGap = Math.max(newGap, 100); // Higher minimum gap size

        // Gradually decrease spawn rate (obstacles closer together, but much slower)
        const newSpawnRate = this.baseSpawnRate - Math.floor(this.score / 6) * 8;
        this.spawnRate = Math.max(newSpawnRate, 120); // Higher minimum spawn rate
    }

    createScoreParticles(x, y) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 4,
                velocityY: (Math.random() - 0.5) * 4,
                life: 30,
                color: '#ffff00'
            });
        }
    }

    gameOver() {
        this.gameState = 'GAME_OVER';
        audioManager.playSound('death');
        audioManager.stopMusic();

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('dyingSharkHighScore', this.highScore.toString());
        }

        this.updateUI();
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0d2b4d';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw ocean gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a5490');
        gradient.addColorStop(1, '#0d2b4d');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameState === 'PLAYING') {
            this.renderObstacles();
            this.renderParticles();
        }

        this.renderShark();
        this.renderUI();
    }

    renderShark() {
        if (!this.shark) return;

        this.ctx.save();
        this.ctx.translate(this.shark.x + this.shark.width / 2, this.shark.y + this.shark.height / 2);
        this.ctx.rotate(this.shark.rotation);

        // Try to use image first, fallback to programmatic rendering
        if (this.sharkImage && this.sharkImage.complete && this.sharkImage.naturalWidth > 0) {
            // Use the loaded image
            this.ctx.drawImage(
                this.sharkImage,
                -this.shark.width / 2,
                -this.shark.height / 2,
                this.shark.width,
                this.shark.height
            );
        } else {
            // Fallback to programmatic rendering
            this.renderSharkFallback();
        }

        this.ctx.restore();
    }

    renderSharkFallback() {
        const w = this.shark.width;
        const h = this.shark.height;
        const scale = Math.min(this.scaleX, this.scaleY);

        // Main shark body (streamlined torpedo shape)
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.fillRect(-w/2, -h/2 + 2*scale, w, h - 4*scale);

        // Shark head (pointed nose facing right - swimming direction)
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(w/2 - 4*scale, -h/2 + 3*scale, 12*scale, h - 6*scale);

        // Snout (very pointed nose)
        this.ctx.fillStyle = '#e8e8e8';
        this.ctx.fillRect(w/2 + 6*scale, -h/2 + 4*scale, 6*scale, h - 8*scale);

        // Main body (slightly wider in middle)
        this.ctx.fillStyle = '#f8f8f8';
        this.ctx.fillRect(-w/2 + 2*scale, -h/2 + 1*scale, w - 4*scale, h - 2*scale);

        // Dorsal fin (larger, more prominent, positioned correctly)
        this.ctx.fillStyle = '#d8d8d8';
        this.ctx.fillRect(-w/2 + 2*scale, -h/2 - 8*scale, 8*scale, 10*scale);
        // Dorsal fin tip
        this.ctx.fillStyle = '#c8c8c8';
        this.ctx.fillRect(-w/2 + 3*scale, -h/2 - 9*scale, 6*scale, 3*scale);

        // Pectoral fins (larger, more shark-like, positioned correctly)
        this.ctx.fillStyle = '#e0e0e0';
        this.ctx.fillRect(-w/2 + 1*scale, -h/2 + 1*scale, 10*scale, 6*scale);
        this.ctx.fillRect(-w/2 + 1*scale, h/2 - 7*scale, 10*scale, 6*scale);

        // Pelvic fins (smaller, near tail)
        this.ctx.fillStyle = '#e5e5e5';
        this.ctx.fillRect(-w/2 + 8*scale, -h/2 + 2*scale, 6*scale, 4*scale);
        this.ctx.fillRect(-w/2 + 8*scale, h/2 - 6*scale, 6*scale, 4*scale);

        // Belly (pure white underside - classic great white feature)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(-w/2 + 1*scale, -h/2 + 2*scale, w - 2*scale, h/2 - 1*scale);

        // Dark back (gray top - classic great white feature)
        this.ctx.fillStyle = '#c0c0c0';
        this.ctx.fillRect(-w/2 + 1*scale, -h/2 + h/2, w - 2*scale, h/2 - 1*scale);

        // Side transition (subtle gradient effect)
        this.ctx.fillStyle = '#d8d8d8';
        this.ctx.fillRect(-w/2 + 1*scale, -h/2 + h/2 - 2*scale, w - 2*scale, 2*scale);
        this.ctx.fillRect(-w/2 + 1*scale, h/2 - 1*scale, w - 2*scale, 2*scale);

        // Shark eye (black with white highlight, positioned on head)
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(w/2 - 2*scale, -h/2 + 5*scale, 4*scale, 4*scale);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(w/2 - 1*scale, -h/2 + 5*scale, 1*scale, 1*scale);

        // Gill slits (5 slits like real great white, positioned correctly)
        this.ctx.fillStyle = '#b0b0b0';
        for (let i = 0; i < 5; i++) {
            this.ctx.fillRect(w/2 - 8*scale, -h/2 + 6*scale + i*1.5*scale, 1*scale, 1*scale);
            this.ctx.fillRect(w/2 - 8*scale, h/2 - 7*scale - i*1.5*scale, 1*scale, 1*scale);
        }

        // Mouth (small but visible, positioned on snout)
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(w/2 + 4*scale, -h/2 + 7*scale, 3*scale, 1*scale);

        // Tail fin (caudal fin - large and powerful, positioned at back)
        this.ctx.fillStyle = '#d0d0d0';
        this.ctx.fillRect(-w/2 - 6*scale, -h/2 + 3*scale, 8*scale, h - 6*scale);
        // Tail fin upper lobe
        this.ctx.fillStyle = '#c8c8c8';
        this.ctx.fillRect(-w/2 - 8*scale, -h/2 + 1*scale, 6*scale, 4*scale);
        // Tail fin lower lobe
        this.ctx.fillStyle = '#c8c8c8';
        this.ctx.fillRect(-w/2 - 8*scale, h/2 - 5*scale, 6*scale, 4*scale);

        // Anal fin (small fin near tail)
        this.ctx.fillStyle = '#d5d5d5';
        this.ctx.fillRect(-w/2 + 2*scale, h/2 - 3*scale, 4*scale, 2*scale);

        // Add some texture details for more authenticity
        // Lateral line (sensory organ)
        this.ctx.fillStyle = '#a0a0a0';
        this.ctx.fillRect(-w/2 + 3*scale, -h/2 + h/2 - 1*scale, w - 6*scale, 1*scale);

        // Small scales texture
        this.ctx.fillStyle = '#e8e8e8';
        for (let i = 0; i < 3; i++) {
            this.ctx.fillRect(-w/2 + 4*scale + i*8*scale, -h/2 + 3*scale, 2*scale, 1*scale);
            this.ctx.fillRect(-w/2 + 4*scale + i*8*scale, h/2 - 4*scale, 2*scale, 1*scale);
        }
    }

    renderObstacles() {
        this.ctx.fillStyle = '#2d5a3d';

        for (const obstacle of this.obstacles) {
            // Main obstacle
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

            // Add some texture
            this.ctx.fillStyle = '#1a3a2d';
            this.ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, obstacle.height - 10);
            this.ctx.fillStyle = '#2d5a3d';
        }
    }

    renderParticles() {
        for (const particle of this.particles) {
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x, particle.y, 3, 3);
        }
    }

    renderUI() {
        // Score display
        document.getElementById('currentScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;

        // Game message
        const gameMessage = document.getElementById('gameMessage');
        if (this.gameState === 'START') {
            gameMessage.classList.remove('hidden');
            gameMessage.innerHTML = `
                <h1>Dying Shark</h1>
                <p>Press SPACE, click or tap to swim!</p>
                <button id="startButton">Start Game</button>
            `;
            document.getElementById('startButton').addEventListener('click', () => {
                this.startGame();
            });
        } else if (this.gameState === 'GAME_OVER') {
            gameMessage.classList.remove('hidden');
            gameMessage.innerHTML = `
                <h1>Game Over!</h1>
                <p>Score: ${this.score}</p>
                <p>Best: ${this.highScore}</p>
                <button id="restartButton">Play Again</button>
            `;
            document.getElementById('restartButton').addEventListener('click', () => {
                this.restartGame();
            });
        } else {
            gameMessage.classList.add('hidden');
        }
    }

    updateUI() {
        this.renderUI();
    }

    gameLoop() {
        this.update();
        this.render();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await audioManager.init();
    } catch (error) {
        console.warn('Audio initialization failed:', error);
    }
    new FlappySharkGame();
});
