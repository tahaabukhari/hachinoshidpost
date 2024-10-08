let game;

function createGame() {
  const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 600,
    height: 400,
    scene: [StartMenu, MyScene],
    physics: {
      default: 'matter',
      matter: {
        gravity: { y: 1 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };

  game = new Phaser.Game(config);
}

class StartMenu extends Phaser.Scene {
  constructor() {
    super('StartMenu');
  }

  preload() {
    this.load.image('start-button', 'start-button.png');
    this.load.image('header', 'header.png');
  }

  create() {
    const { width, height } = this.scale.gameSize;

    let header = this.add.image(width / 3, height / 2, 'header');
    header.setAlpha(0.3);
    this.add.text(width / 2, height / 2 - 50, 'hachinoshidpost', {
      fontSize: '64px',
      fill: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    let startButton = this.add.sprite(width / 2, height / 2 + 50, 'start-button').setInteractive();
    startButton.setDisplaySize(250, 150);
    startButton.on('pointerdown', () => {
      this.scene.start('MyScene');
    });

    this.add.text(width / 2, height / 2 + 100, 'creator: tahaaa❔❔', {
      fontSize: '24px',
      fill: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);
  }
}

class MyScene extends Phaser.Scene {
  constructor() {
    super('MyScene');
    this.obstacles = [];
    this.flyingObstacles = [];
    this.score = 0;
    this.scoreText = null;
    this.player = null;
    this.gameOver = false;
    this.platform = null;
    this.restartButton = null;
    this.restartText = null;
    this.background = null;
    this.isPlayerGrounded = false;
  }

  preload() {
    this.load.image('player', 'player.png');
    this.load.image('obstacle', 'obstacle.png');
    this.load.image('flyingchaahat', 'flyingchaahat.png');
    this.load.image('background', 'background.jpg');
    this.load.image('platform', 'platform.png');
    this.load.image('jump-button', 'jump-button.png');
    this.load.image('restart-button', 'restart-button.png');

    this.load.audio('flyinggreeting', 'flyinggreeting.mp3');
    this.load.audio('deathsound', 'deathsound.mp3');
    this.load.audio('jump-up', 'jump-up.mp3');
    this.load.audio('die', 'die.mp3');
    this.load.audio('jump', 'jump.mp3');
  }

  create() {
    const { width, height } = this.scale.gameSize;

    this.background = this.add.tileSprite(0, 0, width, height, 'background').setOrigin(0);

    this.platform = this.add.tileSprite(width / 2, height - 50, width, 150, 'platform');
    this.matter.add.gameObject(this.platform, {
      isStatic: true,
      chamfer: 10,
    });

    this.platform.setPosition(width / 2, height - this.platform.displayHeight / 2);

    this.player = this.matter.add.sprite(width / 2, height - 150, 'player', null, {
      restitution: 0.1,
      friction: 0.2,
      frictionAir: 0.1,
      density: 0.5,
    }).setCircle(20);

    this.player.setScale(0.4);
    this.player.setFixedRotation();
    this.player.setBounce(0.1);
    this.player.setPosition(width / 2, this.platform.y - this.platform.displayHeight / 2 - this.player.displayHeight / 2);

    this.scoreText = this.add.text(10, 10, 'SCORE: 0', {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    }).setOrigin(0).setAlpha(0.7);

    this.gameOver = false;

    this.obstacleTimer = this.time.addEvent({
      delay: 3000,
      callback: this.generateObstacle,
      callbackScope: this,
      loop: true,
    });

    let randomdelay = Phaser.Math.Between(15000, 30000);
    this.time.addEvent({
      delay: randomdelay,
      callback: this.generateFlyingObstacle,
      callbackScope: this,
      loop: true,
    });

    let jumpButton = this.add.sprite(80, height - 85, 'jump-button').setInteractive();
    jumpButton.setDisplaySize(150, 100);
    jumpButton.on('pointerdown', () => {
      if (this.isPlayerGrounded) {
        this.sound.play('jump');
        this.player.setVelocityY(-10);
      }
    });

    this.matter.world.on('collisionstart', (event) => {
      const pairs = event.pairs;
      pairs.forEach(pair => {
        const otherBody = pair.bodyA === this.player.body ? pair.bodyB : pair.bodyA;

        if (otherBody === this.platform.body) {
          this.isPlayerGrounded = true;
        } else if (otherBody.label === 'flyingchaahat') {
          this.sound.play('die');
          this.player.setVelocityY(-10);
          this.gameOver = true;
          this.showGameOverScreen();
        } else if (otherBody.label === 'obstacle') {
          this.player.setVelocityY(-10);
        }
      });
    });

    this.matter.world.on('collisionend', (event) => {
      const pairs = event.pairs;
      pairs.forEach(pair => {
        const otherBody = pair.bodyA === this.player.body ? pair.bodyB : pair.bodyA;
        if (otherBody === this.platform.body) {
          this.isPlayerGrounded = false;
        }
      });
    });

    this.restartButton = this.add.sprite(width / 2, height / 2 + 100, 'restart-button').setInteractive().setVisible(false);
    this.restartButton.setDisplaySize(150, 100);
    this.restartButton.on('pointerdown', () => {
      this.restartGame();
    });

    this.restartText = this.add.text(width / 2, height / 2 + 150, 'L bozo', {
      fontSize: '24px',
      fill: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5).setVisible(false);
  }

  generateObstacle() {
    if (this.gameOver) return;

    const { width, height } = this.scale.gameSize;
    const obstacle = this.matter.add.sprite(width, height - 160, 'obstacle', null, {
      label: 'obstacle',
      friction: 0,
      isKinematinennekonjiKdrdrdrdrdrdrdrdrdrkkkc: true
    });

    obstacle.setRectangle(40, 40, { density: 0.1, friction: 0, restitution: 0.5 });
    obstacle.setScale(0.12);

    let baseSpeed = 5;
    let baseDelay = 3000;

    if (this.score > 30) {
      baseSpeed = 20;
      baseDelay = 1000;
    } else if (this.score > 10) {
      baseSpeed = 10;
      baseDelay = 2000;
    } else if (this.score > 5) {
      baseSpeed = 8;
      baseDelay = 2500;
    }

    const randomSpeed = Phaser.Math.Between(baseSpeed, baseSpeed + 5);
    obstacle.setVelocityX(-randomSpeed);
    this.obstacles.push(obstacle);

    this.obstacleTimer.delay = baseDelay;
  }

  generateFlyingObstacle() {
    if (this.gameOver) return;
    this.sound.play('flyinggreeting');
    const { width, height } = this.scale.gameSize;
    const flyingObstacle = this.matter.add.sprite(width, height - 300, 'flyingchaahat', null, {
      isStatic: false,
      friction: 0,
      label: 'flyingchaahat',
    });

    flyingObstacle.setScale(0.4);
    flyingObstacle.setIgnoreGravity(true);
    const randomSpeed = Phaser.Math.Between(30, 30);

    flyingObstacle.setVelocityX(-randomSpeed);
    this.flyingObstacles.push(flyingObstacle);
  }
  
  update() {
    const { width, height } = this.scale.gameSize;

    if (this.gameOver) return;

    this.background.tilePositionX += 0.3
    this.platform.tilePositionX += 4.5;
    
    this.obstacles = this.obstacles.filter(obstacle => {
      obstacle.x = obstacle.body.position.x;
      obstacle.y = obstacle.body.position.y;

      if (obstacle.x < -obstacle.width) {
        this.matter.world.remove(obstacle.body);
        obstacle.destroy();
        return false;
      }

      if (!obstacle.hasScored && obstacle.x < 0) {
        this.updateScore();
        obstacle.hasScored = true;
      }

      return true;
    });

    this.flyingObstacles = this.flyingObstacles.filter(flyingObstacle => {
      flyingObstacle.x = flyingObstacle.body.position.x;
      flyingObstacle.y = flyingObstacle.body.position.y;

      if (flyingObstacle.x < -flyingObstacle.width) {
        this.matter.world.remove(flyingObstacle.body);
        flyingObstacle.destroy();
        return false;
      }

      if (!flyingObstacle.hasScored && flyingObstacle.x < 0) {
        this.updateScore();
        flyingObstacle.hasScored = true; 
      }

      return true;
    });

    if (this.player.body.position.y > height + 50 || this.player.body.position.y < -50) {
      this.gameOver = true;
      this.showGameOverScreen();
    }

    if (this.player.y > height) {
      this.gameOver = true;
      this.showGameOverScreen();
    }

    if (this.player && Math.abs(this.player.body.velocity.y) > 0.1) {
      this.isPlayerGrounded = false;
    }

    this.player.body.position.x = Phaser.Math.Clamp(this.player.body.position.x, 0, width);
    this.player.body.position.y = Phaser.Math.Clamp(this.player.body.position.y, 0, height);
  }

  updateScore() {
    this.score += 1;
    this.scoreText.setText(`SCORE: ${this.score}`);
  }

  showGameOverScreen() {
    const { width, height } = this.scale.gameSize;
    this.sound.play('deathsound');
    this.add.text(width / 2, height / 2, 'GAME OVER', {
      fontSize: '64px',
      fill: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.restartButton.setVisible(true);
    this.restartText.setVisible(true);
  }

  restartGame() {
    this.score = 0;
    this.obstacles.forEach(obstacle => obstacle.destroy());
    this.flyingObstacles.forEach(flyingObstacle => flyingObstacle.destroy());
    this.obstacles = [];
    this.flyingObstacles = [];
    this.gameOver = false;
    this.restartButton.setVisible(false);
    this.restartText.setVisible(false);
    this.scene.restart();
  }
}

window.onload = createGame;