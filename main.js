// Importamos las constantes necesarias para el juego
import { SHAPES, TEXTURES } from './constants.js';

class Tetris {
  constructor(rows = 20, cols = 10) {
    this.rows = rows;  // Número de filas del tablero
    this.cols = cols;  // Número de columnas del tablero
    this.board = this.createBoard();  // Creamos el tablero
    this.score = 0;  // Puntuación inicial
    this.level = 1;  // Nivel inicial
    this.combo = 0;  // Contador de combo
    this.gameOver = false;  // Estado del juego
    this.currentPiece = this.newPiece();  // Pieza actual
    this.nextPiece = this.newPiece();  // Siguiente pieza
    this.holdPiece = null;  // Pieza guardada
    this.canHold = true;  // Indica si se puede guardar una pieza
  }

  // Crea un tablero vacío
  createBoard() {
    return Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
  }

  // Genera una nueva pieza aleatoria
  newPiece() {
    const shapeNames = Object.keys(SHAPES);
    const randomShape = shapeNames[Math.floor(Math.random() * shapeNames.length)];
    return {
      shape: SHAPES[randomShape],
      texture: TEXTURES[randomShape],
      x: Math.floor(this.cols / 2) - 1,
      y: 0
    };
  }

  // Verifica si un movimiento es válido
  isValidMove(piece, offsetX, offsetY) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + offsetX;
          const newY = piece.y + y + offsetY;
          if (newX < 0 || newX >= this.cols || newY >= this.rows || (newY >= 0 && this.board[newY][newX])) {
            return false;
          }
        }
      }
    }
    return true;
  }

  // Mueve la pieza actual
  movePiece(offsetX, offsetY) {
    if (this.isValidMove(this.currentPiece, offsetX, offsetY)) {
      this.currentPiece.x += offsetX;
      this.currentPiece.y += offsetY;
      return true;
    }
    return false;
  }

  // Rota la pieza actual
  rotatePiece() {
    const rotated = this.currentPiece.shape[0].map((_, index) =>
      this.currentPiece.shape.map(row => row[index]).reverse()
    );
    const originalShape = this.currentPiece.shape;
    this.currentPiece.shape = rotated;
    if (!this.isValidMove(this.currentPiece, 0, 0)) {
      this.currentPiece.shape = originalShape;
    }
  }

  // Deja caer la pieza hasta el fondo
  dropPiece() {
    while (this.movePiece(0, 1)) {}
    this.lockPiece();
  }

  // Fija la pieza actual al tablero
  lockPiece() {
    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        if (this.currentPiece.shape[y][x]) {
          this.board[this.currentPiece.y + y][this.currentPiece.x + x] = this.currentPiece.texture;
        }
      }
    }
    this.clearLines();
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.newPiece();
    this.canHold = true;
    if (!this.isValidMove(this.currentPiece, 0, 0)) {
      this.gameOver = true;
    }
  }

  // Elimina las líneas completas y actualiza la puntuación
  clearLines() {
    let linesCleared = 0;
    for (let y = this.rows - 1; y >= 0; y--) {
      if (this.board[y].every(cell => cell !== 0)) {
        this.board.splice(y, 1);
        this.board.unshift(Array(this.cols).fill(0));
        linesCleared++;
        y++;
      }
    }
    this.updateScore(linesCleared);
  }

  // Actualiza la puntuación y el nivel
  updateScore(linesCleared) {
    const points = [0, 40, 100, 300, 1200];
    if (linesCleared > 0) {
      this.combo++;
    } else {
      this.combo = 0;
    }
    this.score += (points[linesCleared] * this.level) + (this.combo * 50);
    document.getElementById('score-value').textContent = this.score;
    document.getElementById('combo-value').textContent = this.combo;
    if (this.score > this.level * 1000) {
      this.level++;
      document.getElementById('level-value').textContent = this.level;
    }
  }

  // Función para guardar/intercambiar la pieza actual
  holdPieceFunction() {
    if (this.canHold) {
      if (this.holdPiece === null) {
        this.holdPiece = this.currentPiece;
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.newPiece();
      } else {
        const temp = this.currentPiece;
        this.currentPiece = this.holdPiece;
        this.holdPiece = temp;
      }
      this.currentPiece.x = Math.floor(this.cols / 2) - 1;
      this.currentPiece.y = 0;
      this.canHold = false;
      this.drawHoldPiece();
    }
  }

  // Obtiene la posición de la pieza fantasma
  getGhostPiecePosition() {
    const ghostPiece = { ...this.currentPiece };
    while (this.isValidMove(ghostPiece, 0, 1)) {
      ghostPiece.y++;
    }
    return ghostPiece;
  }

  // Dibuja todos los elementos del juego
  draw() {
    this.drawBoard();
    this.drawGhostPiece();
    this.drawCurrentPiece();
    this.drawNextPiece();
    this.drawHoldPiece();
  }

  // Dibuja el tablero
  drawBoard() {
    const boardElement = document.getElementById('tetris-board');
    boardElement.innerHTML = '';
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = document.createElement('div');
        cell.className = 'tetris-block';
        if (this.board[y][x]) {
          const texture = this.board[y][x];
          this.applyTexture(cell, texture);
        }
        boardElement.appendChild(cell);
      }
    }
  }

  // Dibuja la pieza actual
  drawCurrentPiece() {
    this.drawPiece(this.currentPiece, 'tetris-board');
  }

  // Dibuja la pieza fantasma
  drawGhostPiece() {
    const ghostPiece = this.getGhostPiecePosition();
    this.drawPiece(ghostPiece, 'tetris-board', true);
  }

  // Dibuja la siguiente pieza
  drawNextPiece() {
    const nextPieceElement = document.getElementById('next-piece');
    this.drawPieceInContainer(this.nextPiece, nextPieceElement);
  }

  // Dibuja la pieza guardada
  drawHoldPiece() {
    const holdPieceElement = document.getElementById('hold-piece');
    if (this.holdPiece) {
      this.drawPieceInContainer(this.holdPiece, holdPieceElement);
    } else {
      holdPieceElement.innerHTML = '';
    }
  }

  // Dibuja una pieza en el tablero
  drawPiece(piece, containerId, isGhost = false) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const pieceX = piece.x + x;
          const pieceY = piece.y + y;
          if (pieceY >= 0) {
            const index = pieceY * this.cols + pieceX;
            const cell = document.getElementById(containerId).children[index];
            if (isGhost) {
              cell.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              cell.style.border = '1px solid rgba(255, 255, 255, 0.5)';
            } else {
              this.applyTexture(cell, piece.texture);
            }
          }
        }
      }
    }
  }

  // Dibuja una pieza en un contenedor específico
  drawPieceInContainer(piece, container) {
    container.innerHTML = '';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${piece.shape.length}, 1fr)`;
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        const cell = document.createElement('div');
        cell.className = 'tetris-block';
        if (piece.shape[y][x]) {
          this.applyTexture(cell, piece.texture);
        }
        container.appendChild(cell);
      }
    }
  }

  // Aplica una textura a una celda
  applyTexture(cell, texture) {
    cell.style.backgroundColor = texture.color;
    cell.style.backgroundImage = `url('textures.svg')`;
    cell.style.backgroundPosition = `-${texture.x}px -${texture.y}px`;
    cell.style.backgroundSize = '400px 100px';
  }

  // Bucle principal del juego
  gameLoop() {
    if (!this.gameOver) {
      if (!this.movePiece(0, 1)) {
        this.lockPiece();
      }
      this.draw();
    } else {
      this.showGameOver();
    }
  }

  // Muestra la pantalla de fin de juego
  showGameOver() {
    const gameOverElement = document.getElementById('game-over');
    gameOverElement.style.display = 'block';
    document.getElementById('final-score').textContent = this.score;
  }

  // Reinicia el juego
  restart() {
    this.board = this.createBoard();
    this.score = 0;
    this.level = 1;
    this.combo = 0;
    this.gameOver = false;
    this.currentPiece = this.newPiece();
    this.nextPiece = this.newPiece();
    this.holdPiece = null;
    this.canHold = true;
    document.getElementById('score-value').textContent = this.score;
    document.getElementById('level-value').textContent = this.level;
    document.getElementById('combo-value').textContent = this.combo;
    document.getElementById('game-over').style.display = 'none';
    this.draw();
  }
}

// Inicializa el juego
const game = new Tetris();

// Configura los controles de teclado
document.addEventListener('keydown', (e) => {
  if (!game.gameOver) {
    switch (e.key) {
      case 'ArrowLeft':
        game.movePiece(-1, 0);
        break;
      case 'ArrowRight':
        game.movePiece(1, 0);
        break;
      case 'ArrowDown':
        game.movePiece(0, 1);
        break;
      case 'ArrowUp':
        game.rotatePiece();
        break;
      case ' ':
        game.dropPiece();
        break;
      case 'c':
      case 'C':
        game.holdPieceFunction();
        break;
    }
    game.draw();
  }
});

// Configura el botón de reinicio
document.getElementById('restart-button').addEventListener('click', () => {
  game.restart();
});

// Inicia el bucle del juego
function gameLoop() {
  game.gameLoop();
  setTimeout(gameLoop, 1000 - (game.level - 1) * 50);
}

gameLoop();

// Dibuja el estado inicial del juego
game.draw();