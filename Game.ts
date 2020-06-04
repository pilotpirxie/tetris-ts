class Game {
  private readonly _canvas : HTMLCanvasElement;
  private readonly _ctx : CanvasRenderingContext2D;

  private _COLORS = [
    'black', 'orange', 'blue', 'yellow', 'cyan', 'red', 'green', 'magenta'
  ];

  private _TETROMINOS = [
    {
      name: 'L',
      color: 1,
      schema: [
        [1, 1, 1],
        [1, 0, 0]
      ]
    }, {
      name: 'J',
      color: 2,
      schema: [
        [1, 1, 1],
        [0, 0, 1]
      ]
    }, {
      name: 'O',
      color: 3,
      schema: [
        [1, 1],
        [1, 1]
      ]
    }, {
      name: 'I',
      color: 4,
      schema: [
        [1, 1, 1, 1]
      ]
    }, {
      name: 'Z',
      color: 5,
      schema: [
        [0, 1, 1],
        [1, 1, 0]
      ]
    }, {
      name: 'S',
      color: 6,
      schema: [
        [1, 1, 0],
        [0, 1, 1]
      ]
    }, {
      name: 'T',
      color: 7,
      schema: [
        [0, 1, 0],
        [1, 1, 1]
      ]
    }
  ];

  private readonly _WIDTH = 10;
  private readonly _HEIGHT = 20;
  private readonly _BLOCK_SIZE = 32;
  private readonly _NEXT_BLOCKS = 4;

  private _landed = [];
  private _currentX = 0;
  private _currentY = 0;
  private _currentBlockIndex;
  private _nextBlockIndexes = [];
  private _currentSchema;
  private _timeBefore = 0;
  private _timeAfter = 0;
  private _stoper = 0;
  private _score = 0;

  public constructor(selector : string) {
    this._canvas = document.querySelector(selector) as HTMLCanvasElement;
    this._ctx = this._canvas.getContext('2d');

    this.run = this.run.bind(this);
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
    this.drawBlock = this.drawBlock.bind(this);
    this.onPressKeyboard = this.onPressKeyboard.bind(this);
    this.getNewBlock = this.getNewBlock.bind(this);
    this.checkCollision = this.checkCollision.bind(this);
    this.checkLines = this.checkLines.bind(this);
  }

  public run() {
    window.addEventListener('keydown', this.onPressKeyboard, false);

    this._landed = Game.getNewArray(this._WIDTH, this._HEIGHT);
    this.getNewBlock();
    this.update();
  }

  private update() {
    this._timeBefore = performance.now();
    this._stoper += this._timeBefore - this._timeAfter;

    if (this._stoper > 500) {
      this._currentY += 1;
      this._stoper = 0;
    }

    if (this.checkCollision(this._currentSchema, 0, 0)) {
      this.setSolid();
      this.getNewBlock();
    }

    this.checkLines();

    this.render();
    requestAnimationFrame(this.update);
    this._timeAfter = performance.now();
  }

  private render() {
    const ctx = this._ctx;
    const canvas = this._canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000b1f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < this._HEIGHT; y++) {
      for (let x = 0; x < this._WIDTH; x++) {
        ctx.fillRect(x * this._BLOCK_SIZE, y * this._BLOCK_SIZE, this._BLOCK_SIZE, this._BLOCK_SIZE)
        this.drawBlock(
          x * this._BLOCK_SIZE,
          y * this._BLOCK_SIZE,
          this._COLORS[this._landed[y][x]]
        )
      }
    }

    for (let y = 0; y < this._currentSchema.length; y++) {
      for (let x = 0; x < this._currentSchema[y].length; x++) {
        if (this._currentSchema[y][x] === 1) {
          this.drawBlock(
            (x + this._currentX) * this._BLOCK_SIZE,
            (y + this._currentY) * this._BLOCK_SIZE,
            this._COLORS[this._TETROMINOS[this._currentBlockIndex].color]
          )
        }
      }
    }

    for (let i = 0; i < this._nextBlockIndexes.length; i++) {
      for (let y = 0; y < this._TETROMINOS[this._nextBlockIndexes[i]].schema.length; y++) {
        for (let x = 0; x < this._TETROMINOS[this._nextBlockIndexes[i]].schema[y].length; x++) {
          if (this._TETROMINOS[this._nextBlockIndexes[i]].schema[y][x] === 1) {
            this.drawBlock(
              (x + this._WIDTH) * this._BLOCK_SIZE + 32,
              y * this._BLOCK_SIZE + ((i + 1) * 128),
              this._COLORS[this._TETROMINOS[this._nextBlockIndexes[i]].color]
            )
          }
        }
      }
    }

    ctx.font = '26px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Score: ${this._score}`, (this._WIDTH + 1) * this._BLOCK_SIZE, 64);

    ctx.font = '16px sans-serif';
    ctx.fillText(`Next blocks`, (this._WIDTH + 1) * this._BLOCK_SIZE, 90);
  }

  private drawBlock(x : number, y : number, color : string) {
    this._ctx.fillStyle = color;
    this._ctx.fillRect(
      x,
      y,
      this._BLOCK_SIZE,
      this._BLOCK_SIZE
    )
  }

  private checkCollision(schema : Array<Array<number>>, offsetX : number, offsetY : number) : boolean {
    for (let y = 0; y < schema.length; y++) {
      for (let x = 0; x < schema[y].length; x++) {
        const pieceY = y + this._currentY + offsetY;
        const pieceX = x + this._currentX + offsetX;

        if (schema[y][x] !== 0 && pieceY > 0
          && (pieceY >= this._HEIGHT
            || pieceX < 0
            || pieceX > this._WIDTH
            || this._landed[pieceY][pieceX] !== 0)) {
          return true;
        }
      }
    }

    return false;
  }

  private setSolid() {
    for (let y = 0; y < this._currentSchema.length; y++) {
      for (let x = 0; x < this._currentSchema[y].length; x++) {
        if (this._currentSchema[y][x] === 1) {
          this._landed[y + this._currentY - 1][x + this._currentX] = this._TETROMINOS[this._currentBlockIndex].color;
        }
      }
    }
  }

  private onPressKeyboard(event) {
    switch (event.code) {
      case 'ArrowUp':
        const newSchema = Game.rotateClockwise(this._currentSchema);
        if (!this.checkCollision(newSchema, 0, 0)
          && !this.checkCollision(newSchema, 0, 1)
        ) {
          this._currentSchema = newSchema;
        }
        break;
      case 'ArrowLeft':
        if (!this.checkCollision(this._currentSchema, -1, 0)) {
          this._currentX -= 1;
        }
        break;
      case 'ArrowRight':
        if (!this.checkCollision(this._currentSchema, 1, 0)) {
          this._currentX += 1;
        }
        break;
      case 'ArrowDown':
        if (!this.checkCollision(this._currentSchema, 0, 1)) {
          this._currentY += 1;
          this._stoper = 0;
        }
        break;
      case 'Space':
        while (!this.checkCollision(this._currentSchema, 0, 1)) {
          this._currentY += 1;
          this._stoper = 0;
        }
        break;
    }
  }

  private getNewBlock() {
    if (this._nextBlockIndexes.length === 0) {
      for(let i = 0; i < this._NEXT_BLOCKS; i++) {
        this._nextBlockIndexes.push(Math.floor(Math.random() * (this._TETROMINOS.length - 0.5)));
      }
    }
    this._currentBlockIndex = this._nextBlockIndexes[0];
    this._currentSchema = Game.copy(this._TETROMINOS[this._currentBlockIndex].schema);
    this._nextBlockIndexes.shift();
    this._nextBlockIndexes.push(Math.floor(Math.random() * (this._TETROMINOS.length - 0.5)));

    for (let i = 0; i < Math.random() * 4; i++) {
      this._currentSchema = Game.rotateClockwise(this._currentSchema);
    }

    this._currentY = -this._currentSchema.length + 1;
    this._currentX = Math.floor((this._WIDTH / 2) - (this._currentSchema[0].length / 2));
  }

  private static getNewArray(width : number, height : number) : Array<Array<number>>{
    let newArray = [];
    for (let y = 0; y < height; y++) {
      newArray.push([]);
      for(let x = 0; x < width; x++) {
        newArray[y].push(0);
      }
    }

    return newArray;
  }

  private static copy(arr : Array<Array<number>>) : Array<Array<number>> {
    return JSON.parse(JSON.stringify(arr));
  }

  private static rotateClockwise(arr : Array<Array<number>>) : Array<Array<number>> {
    let transformedArray = [];

    const M = arr.length;
    const N = arr[0].length;

    for (let y = 0; y < N; y++) {
      transformedArray.push([]);
      for (let x = 0; x < M; x++) {
        transformedArray[y].push([]);
      }
    }

    for (let y = 0; y < M; y++) {
      for (let x = 0; x < N; x++) {
        transformedArray[x][M - 1 - y] = arr[y][x];
      }
    }

    return transformedArray;
  }

  private checkLines() {
    let linesToShift = [];
    for (let y = this._HEIGHT - 1; y > 0; y--) {
      let blocksInRow = 0;
      for (let x = 0; x < this._WIDTH; x++) {
        if (this._landed[y][x] !== 0) {
          blocksInRow++;
        }
      }
      if (blocksInRow === this._WIDTH) {
        linesToShift.push(y);
      }
    }

    switch (linesToShift.length) {
      case 0:
        break;
      case 1:
        this._score += 100;
        break;
      case 2:
        this._score += 300;
        break;
      case 3:
        this._score += 500;
        break;
      case 4:
        this._score += 800;
        break;
      default:
        this._score += 800 + ( 400 * linesToShift.length)
        break;
    }

    for (const line of linesToShift) {
      this.shiftLines(line);
    }
  }

  private shiftLines(line : number) {
    for (let y = line; y > 0; y--) {
      if (line === 0) {
        this._landed[y][0] = 0;
      }
      for (let x = 0; x < this._WIDTH; x++) {
        this._landed[y][x] = this._landed[y-1][x];
      }
    }
  }
}
