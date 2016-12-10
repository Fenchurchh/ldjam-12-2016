let SCALE = 3
var map
var layer
var cursors

function animationRow(n) {
    return [n * 4, n * 4 + 1, n * 4 + 2, n * 4 + 3]
}

const state = {
    WALKING: 0,
    ATTACKING: 1,
    DAMAGE: 2,
    IDLE: 3
}

class Knight extends Phaser.Sprite {
    constructor(game, x = 200, y = 200, spriteName = "knight") {
        super(game, x, y, spriteName, 1)
        game.world.add(this)
        game.physics.arcade.enable(this)

        this.body.setSize(24, 32, 4)
        this.body.drag.setTo(0.8, 0.8)

        this.anchor.setTo(0.5, 0.5)
        this.animations.add("walk", animationRow(0))
        this.animations.add("idle", animationRow(1))
        let attack = this.animations.add("attack", animationRow(2))
        attack.onComplete.add(sprite => {
            sprite.attacking = false
            sprite.state = state.IDLE
            sprite.animations.play("idle", 3, true)
        })
        let damage = this.animations.add("damage", animationRow(3))
        damage.onComplete.add(sprite => {
            sprite.state = state.IDLE
            this.body.velocity.setTo(0, 0)
        })

        let shadow = game.make.sprite(-1, 3, 'shadow')
        shadow.anchor.setTo(0.5, 0.5)
        this.addChild(shadow)

        this.body.velocity = new Phaser.Point(0, 0)
        this.speed = 1.5
    }

    damage(angle, force) {
        console.log("hit knight")
        let x = Math.cos(angle) * force
        let y = Math.sin(angle) * force
        this.body.velocity.setTo(x, y)
        if (x < 0) this.scale.x = 1
        if (x > 0) this.scale.x = -1
        this.animations.play("damage", 15, false)
        this.state = state.DAMAGE
    }

    update() {
        this.body.velocity.normalize()

        switch (this.state) {
            case state.IDLE:
                this.animations.play("idle", 3, true)
                break;
            case state.WALKING:
                this.animations.play("walk", 5, true)
                this.position.add(this.body.velocity.x * this.speed, this.body.velocity.y * this.speed)
                break;
            case state.ATTACKING:
                this.animations.play("attack", 10, false)
                break;
            case state.DAMAGE:
                break;
        }
    }
}

class Player extends Knight {
    constructor(game, x = 200, y = 200) {
        super(game, x, y)
        this.keys = {}
        this.keys.up = game.input.keyboard.addKey(Phaser.KeyCode.W)
        this.keys.right = game.input.keyboard.addKey(Phaser.KeyCode.D)
        this.keys.down = game.input.keyboard.addKey(Phaser.KeyCode.S)
        this.keys.left = game.input.keyboard.addKey(Phaser.KeyCode.A)
        this.keys.attack = game.input.activePointer.leftButton
    }

    update() {
        super.update()

        this.body.velocity.setTo(0, 0)

        if (this.state === state.ATTACKING)return
        this.state = state.IDLE

        this.body.velocity.setTo(0, 0)
        if (this.keys.attack.isDown) {
            this.attacking = true
            this.state = state.ATTACKING
            return
        }

        if (this.keys.up.isDown) {
            this.body.velocity.y = -this.speed
            this.state = state.WALKING
        }
        if (this.keys.right.isDown) {
            this.scale.x = 1
            this.body.velocity.x = this.speed
            this.state = state.WALKING
        }
        if (this.keys.down.isDown) {
            this.body.velocity.y = this.speed
            this.state = state.WALKING
        }
        if (this.keys.left.isDown) {
            this.scale.x = -1
            this.body.velocity.x = -this.speed
            this.state = state.WALKING
        }

        if (this.state !== state.WALKING) {
            this.body.velocity.x *= (0.8)
            this.body.velocity.y *= (0.8)
        }

    }
}

class Npc extends Knight {
    constructor(game, x = Math.random() * 400, y = Math.random() * 400) {
        super(game, x, y)
    }

    setTarget(point) {
        this.target = point
    }

    update() {
        super.update()
        if (this.target && this.state !== state.DAMAGE) {
            game.physics.arcade.moveToObject(this, this.target)
        }
    }
}

function preload() {
    //  tiles are 16x16 each
    game.load.image('tiles', 'examples/assets/tilemaps/tiles/sci-fi-tiles.png');
    game.load.image('shadow', 'images/shadow.png');
    game.load.spritesheet('knight', 'images/knight.png', 32, 32, 16)
}


function create() {
    window.state = this
    // scale the game
    game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE
    game.scale.setUserScale(SCALE, SCALE)

    // enable linear interpolation render
    game.renderer.renderSession.roundPixels = true
    Phaser.Canvas.setImageRenderingCrisp(this.game.canvas)

    createMap()

    game.physics.startSystem(Phaser.Physics.ARCADE)
    cursors = game.input.keyboard.createCursorKeys()

    this.player = new Player(game)
    game.camera.follow(this.player, Phaser.Camera.FOLLOW_TOPDOWN)

    let npcCount = 2
    this.npcGroup = game.add.physicsGroup()
    while (--npcCount) {
        let npc = new Npc(game)
        npc.setTarget(this.player)
        this.npcGroup.add(npc)
    }
}

function collisionHandler(a, b) {
    if (!a.attacking)return false
    let force = 120
    let angle = game.physics.arcade.angleBetween(a, b) + game.rnd.realInRange(-1, 1)
    console.log("hit")
    b.damage(angle, force)
    return true
}


function createMap() {
    //  Create some map data dynamically
    //  Map size is 128x128 tiles
    var data = ''
    let ct = 0

    for (var y = 0; y < 128; y++) {
        for (var x = 0; x < 128; x++) {

            data += game.rnd.pick([18, 18, 18, 18, 18, 18, 19, 20]) // game.rnd.between(18, 20).toString()
            if (x < 127) {
                data += ',';
            }

        }
        if (y < 127) {
            data += "\n";
        }
    }
    //  Add data to the cache
    game.cache.addTilemap('dynamicMap', null, data, Phaser.Tilemap.CSV);

    //  Create our map (the 16x16 is the tile size)
    map = game.add.tilemap('dynamicMap', 16, 16);

    //  'tiles' = cache image key, 16x16 = tile size
    map.addTilesetImage('tiles', 'tiles', 16, 16);

    //  0 is important
    layer = map.createLayer(0);

    //  Scroll it
    layer.resizeWorld();
}


function update() {
    // setup collisions
    if (game.physics.arcade.collide(this.player, this.npcGroup, collisionHandler, null, this)) {
    }

    if (cursors.left.isDown) {
        game.camera.x--;
    }

    else if (cursors.right.isDown) {
        game.camera.x++;
    }

    if (cursors.up.isDown) {
        game.camera.y--;
    }
    else if (cursors.down.isDown) {
        game.camera.y++;
    }

}

function debug() {
    game.debug.body(this.player)
    this.npcGroup.forEach(npc => game.debug.body(npc))
}

function render() {
    debug.call(this)
}




var game = new Phaser.Game(window.innerWidth / SCALE, window.innerHeight / SCALE, Phaser.AUTO, 'phaser-example', {
    preload: preload,
    create: create,
    update: update,
    render: render
})

window.game = game
