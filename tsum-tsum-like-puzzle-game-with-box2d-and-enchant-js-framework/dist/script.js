enchant();
enchant.ENV.USE_TOUCH_TO_START_SCENE = false;
Array.prototype.last = function() {return this[this.length - 1];}

window.onload = function() {
	var WIDTH = 160, HEIGHT = 160, BALL_NUM = 90, PLAYTIME = 30;
	var game = new Core(WIDTH, HEIGHT);
	var selectedBalls = [];
	var highScore = 0;
	var iconPath = 'https://cdn.rawgit.com/wise9/enchant.js/master/images/icon1.png';

	var Cursor = Class.create(Sprite, {
		size: 15,
		initialize: function() {
			Sprite.call(this, this.size, this.size);
			this.x = this.y = -100;

			var _cursor = this;
			document.ontouchmove = function(event) {
  			_cursor.x = event.touches[0].pageX / game.scale - _cursor.size / 2;
  			_cursor.y = event.touches[0].pageY / game.scale - _cursor.size / 2;
			};
			document.onmousemove = function(event) {
				_cursor.x = event.x / game.scale - _cursor.size / 2;
				_cursor.y = event.y / game.scale - _cursor.size / 2;
			};
		}
	});

	var Score = Class.create(Label, {
		lastScore: 0,
		highScore: 0,
		initialize: function() {
			Label.call(this, this.count);
			this.updateText();
		},
		charge: function(ballNum) {
			this.lastScore += ballNum * ballNum;
			this.updateText();
		},
		isHighScore: function() {
			return this.lastScore === this.highScore ? true : false;
		},
		setHighScore: function() {
			this.highScore = Math.max(this.highScore, this.lastScore);
		},
		resetScore: function() {
			this.lastScore = 0;
			this.updateText();
		},
		updateText: function() {
			this.text = 'SCORE ' + this.lastScore;
		}
	});

	var Timer = Class.create(Label, {
		time: PLAYTIME,
		initialize: function() {
			Label.call(this, 0);
			this.x = WIDTH - 60;
			game.score.resetScore();
		},
		gameOver: function() {
			game.score.setHighScore();
			game.replaceScene(new GameOverScene());
		},
		onenterframe: function() {
			if(game.frame % game.fps === 0) {
				this.text = 'TIME ' + --this.time;
				if(this.time <= 0) this.gameOver();
			}
		}
	});

	var Ball = Class.create(PhyCircleSprite, {
		size: 8,
		variation: 6,
		initialize: function(x, y) {
			PhyCircleSprite.call(this, this.size, enchant.box2d.DYNAMIC_SPRITE, 1.5, 1.0, 0.3, true);
			this.image = game.assets[iconPath];
			this.frame = Math.floor(Math.random() * this.variation);
			this.x = Math.random() * WIDTH - this.size;
			this.y = Math.random() * HEIGHT * -1;
		},
		select: function() {
			if(this.opacity === 0.5) return;

			this.opacity = 0.5;
			selectedBalls.push(this);
		},
		onenterframe: function() {
			if(
				selectedBalls.length !== 0 &&
				this.frame === selectedBalls.last().frame  &&
			  game.cursor.within(this) &&
			  game.cursor.within(selectedBalls.last())
			){
				this.select();
			};
		},
		ontouchstart: function() {
			if(selectedBalls.length === 0) this.select();
		},
		ontouchend: function() {
			if(selectedBalls.length < 3) {
        selectedBalls.forEach(function(ball) {ball.opacity = 1.0;});
			}else{
				game.score.charge(selectedBalls.length);
				this.parentNode.spawnBalls(selectedBalls.length);
				selectedBalls.forEach(function(ball) {ball.destroy();});
			}

			selectedBalls = [];
		}
	});

	var Wall = Class.create(PhyBoxSprite, {
		initialize: function(w, h, x, y) {
			PhyBoxSprite.call(this, w, h, enchant.box2d.STATIC_SPRITE, 0, 1.0, 0, false);
			this.position = {x, y};
		}
	});

	var TitleScene = Class.create(Scene, {
		initialize: function() {
			Scene.call(this);
			var startLabel = new Label('TOUCH TO START');
			var scoreLabel = new Label('HIGH SCORE ' + game.score.highScore);

			startLabel.y = HEIGHT / 2 - 10;
			scoreLabel.y = HEIGHT - 20;
			this.addChild(startLabel);
			if(game.score.highScore > 0) this.addChild(scoreLabel);
		},
		ontouchstart: function() {
			game.replaceScene(new GameScene());
		}
	});

	var GameScene = Class.create(Scene, {
		initialize: function() {
			Scene.call(this);
			this.world = new PhysicsWorld(0, 9.8);
			this.addChild(new Wall(1000000, 1,      500000,    HEIGHT)); // floor
			this.addChild(new Wall(1,      1000000, 0,         500000));  // left wall
			this.addChild(new Wall(1,      1000000, WIDTH - 1, 500000));  // right wall
			this.addChild(game.cursor);
			this.addChild(game.score);
			this.spawnBalls(BALL_NUM);
			this.addChild(new Timer());
		},
		spawnBalls: function(count) {
			for(var i = 0; i < count; i += 1) this.addChild(new Ball());
		},
		onenterframe: function() {
			this.world.step(game.fps);
		}
	});

	GameOverScene = Class.create(Scene, {
		initialize: function() {
			Scene.call(this);

			var timeUpLabel    = new Label('TIME UP');
			var scoreLabel     = new Label('SCORE ' + game.score.lastScore);
			var highScoreLabel = new Label(game.score.isHighScore() ? 'HIGH SCORE!' : '');

			timeUpLabel.y     = HEIGHT * 1 / 4;
			scoreLabel.y      = HEIGHT * 2 / 4;
			highScoreLabel.y  = HEIGHT * 2 / 4 + 20;
			highScoreLabel.color = 'red';
			this.addChild(timeUpLabel);
			this.addChild(scoreLabel);
			this.addChild(highScoreLabel);

			setTimeout(function() {game.replaceScene(new TitleScene());}, 4000);
		}
	});

	game.cursor = new Cursor()
	game.score  = new Score();
	game.onload = function() {game.replaceScene(new TitleScene());}
	game.preload(iconPath);
	game.start();
}