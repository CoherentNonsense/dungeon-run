// issue when generating board
// it chooses a random spot and if its taken it tries again
// chrome doesnt like that and throws an error
// it could be fixed by making the available spots a list
// but ill do that later

/************************/
/* COLLAPSE THE CLASSES */
/*  FOR EASIER READING  */
/************************/

// game object. has everything related to the game logic
class Game {
    mapSize = 8
    tileBoard = null
    entityBoard = null
    playerPos = {x:0, y:7}
    enemies = []
    health = 3
    hasKey = false
    score = 0
    difficulty = 1

    constructor(removeEnemy, newBoard, gameOver) {
        this.removeEnemy = removeEnemy
        this.newBoard = newBoard
        this.gameOver = gameOver
    }

    // resetting variables on a new map
    restart() {
        this.won = false
        this.difficulty += 0.25
        this.hasKey = false
        this.playerPos = {x:0, y:7}
        this.enemies = []
    }

    // when player has valid input
    onMove(direction) {
        // get next pos
        let newPos
        switch(direction) {
            case 0:
                newPos = {
                    x: this.playerPos.x,
                    y:this.playerPos.y - 1
                }
                break
            case 1:
                newPos = {
                    x: this.playerPos.x + 1,
                    y:this.playerPos.y
                }
                break
            case 2:
                newPos = {
                    x: this.playerPos.x,
                    y:this.playerPos.y + 1
                }
                break
            case 3:
                newPos = {
                    x: this.playerPos.x - 1,
                    y:this.playerPos.y
                }
                break
        }

        // check and move to next pos
        if (newPos.x === 7 && newPos.y === -1 && this.hasKey) {
            if (this.hasKey) {
                this.newBoard()
            }
        }

        // off the board
        if (newPos.x > 7 || newPos.x < 0 || newPos.y > 7 || newPos.y < 0) {
            console.log("off the board")
            return
        }

        // into obstacle
        switch (this.entityBoard[newPos.x][newPos.y]) {
            case 1:
            case 2:
                console.log('cant move')
                return
            case 3:
                console.log('health up')
                this.health++
                break
            case 4:
                console.log('score up')
                this.score++
                break
            case 5:
                console.log('key got')
                this.hasKey = true
                break
        }

        // into enemy
        for (let i = 0; i < this.enemies.length; i++) {
            if (this.enemies[i].x === newPos.x && this.enemies[i].y === newPos.y) {
                this.hitEnemy(i)
            }
        }

        this.moveEnemies(newPos)

        // move
        this.entityBoard[newPos.x][newPos.y] = 0
        this.playerPos = newPos
    }

    // what happens when player hits an enemy
    hitEnemy(i) {
        this.health--
        if (this.health <= 0) {
            let score = Math.floor(this.score * this.difficulty) * 100
            this.gameOver(score)
        }
        this.removeEnemy(this.enemies[i].id)
        this.enemies.splice(i, 1)
        console.log('hit')
    }

    // generate a random map | enemy count depending on difficulty
    genMap(difficulty) {
        // board
        this.tileBoard = new Array(this.mapSize + 2)
        for (let i = 0; i < this.tileBoard.length; i++) {
            this.tileBoard[i] = new Array(this.mapSize + 2)
        }
        
        // add a tile type to each tile
        iterate(this.tileBoard, (x, y) => {
            if (y === this.tileBoard.length - 1) {
                this.tileBoard[x][y] = -1
            } else if (x === 0 || x === this.tileBoard.length - 1 || y === 0) {
                this.tileBoard[x][y] = 3
            } else {
                this.tileBoard[x][y] = Math.floor(Math.random() * 3)
            }
        })

        // add door
        this.tileBoard[this.tileBoard.length - 2][0] = 4
        
        // ENTITIES
        // get list of available spaces
        this.entityBoard = new Array(this.mapSize)
        for (let i = 0; i < this.entityBoard.length; i++) {
            this.entityBoard[i] = new Array(this.mapSize)
        }
        iterate(this.entityBoard, (x, y) => {
            this.entityBoard[x][y] = 0
        })

        // add key
        this.insertEntities(1, (x, y) => {
            this.entityBoard[x][y] = 5
        })

        // add random obstacles
        this.insertEntities(5, (x, y) => {
            this.entityBoard[x][y] = Math.floor(Math.random() * 2) + 1
        })

        // add random items
        this.insertEntities(2, (x, y) => {
            this.entityBoard[x][y] = Math.floor(Math.random() * 2) + 3
        })

        // add random enemies
        this.insertEntities(Math.floor(this.difficulty), (x, y) => {
            let id = Math.floor(Math.random() * 5000)
            this.enemies.push({id,x,y})
        })
    }

    // move enemy positions
    moveEnemies(playerPos) {
        for(let i = 0; i < this.enemies.length; i++) {
            // get offset to player
            let xOffset = playerPos.x - this.enemies[i].x
            let yOffset = playerPos.y - this.enemies[i].y
            //normalize
            // let magnitude = Math.sqrt(xOffset * xOffset + yOffset * yOffset)
            // let offset = {
            //     x: xOffset / magnitude,
            //     y:yOffset / magnitude
            // }
            let offset = {
                x: xOffset,
                y: yOffset
            }
            
            // move towards player if not obstructed
            let newPos
            if (Math.abs(offset.x) > Math.abs(offset.y)) {
                // there has to be a better way to do this
                newPos = {
                    x: this.enemies[i].x + offset.x / Math.abs(offset.x),
                    y: this.enemies[i].y
                }
            } else {
                newPos = {
                    x: this.enemies[i].x,
                    y: this.enemies[i].y + offset.y / Math.abs(offset.y)
                }
            }
            
            // check collisions
            switch (this.entityBoard[newPos.x][newPos.y]) {
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                    continue
            }

            // into enemy
            for (let i = 0; i < this.enemies.length; i++) {
                if (this.enemies[i].x === newPos.x && this.enemies[i].y === newPos.y) {
                    continue
                }
            }

            // into player
            if (newPos.x === playerPos.x && newPos.y === playerPos.y) {
                this.hitEnemy(i)
                continue
            }

            this.enemies[i].x = newPos.x
            this.enemies[i].y = newPos.y
        }
    }

    // insert n amount of things in random positions
    insertEntities(n, cb) {
        let remaining = n
        for (let i = 0; i < n; i++) {
            let X = Math.floor(Math.random() * (this.mapSize - 2)) + 1
            let Y = Math.floor(Math.random() * (this.mapSize - 2)) + 1
    
            if(this.entityBoard[X][Y] === 0) {
                cb(X, Y)
                remaining--
            } else {
                this.insertEntities(1, cb)
            }
        }
    }
}

// view object. does everything related to the dom
class View {
    //BOARD IMAGES:
    BOARD_IMAGES = [
        "https://www.kasandbox.org/programming-images/cute/DirtBlock.png", // dirt
        "https://www.kasandbox.org/programming-images/cute/GrassBlock.png", // grass
        "https://www.kasandbox.org/programming-images/cute/StoneBlock.png", // cobblestone
        "https://www.kasandbox.org/programming-images/cute/WallBlockTall.png", // wall
        "https://www.kasandbox.org/programming-images/cute/DoorTallClosed.png" // door
    ]

    // ENTITY IMAGES:
    ENTITY_IMAGES = [
        "",
        "https://www.kasandbox.org/programming-images/cute/Rock.png", // rock
        "https://www.kasandbox.org/programming-images/cute/TreeUgly.png", // bush
        "https://www.kasandbox.org/programming-images/cute/Heart.png", // heart
        "https://www.kasandbox.org/programming-images/cute/GemBlue.png", // gem
        "https://www.kasandbox.org/programming-images/cute/Key.png", // key
        "https://www.kasandbox.org/programming-images/cute/EnemyBug.png", // enemy
        "http://drapak.ca/cpg/img/pacman/pacmanSlug1.png" // player
    ]

    constructor(newBoard) {
        this.newBoard = newBoard
        this.init()
    }

    init() {
        this.cacheElements()
    }

    cacheElements() {
        this.$gameContainer = $("#gameContainer")
        this.$menu = $("#menuTemplate").html()
        this.$game = $("#gameTemplate").html()
    }

    gameOver(score) {
        alert("Game Over\nOverall Score: " + score)
        window.history.go('/')
    }

    clearMap() {
        this.$gameContainer.html(this.$game)
    }

    drawMap(tileBoard) {
        iterate(tileBoard, (x, y) => {
            if (tileBoard[x][y] !== -1) {
                let el = document.createElement("img")
                el.classList.add("tile")
                el.src = this.BOARD_IMAGES[tileBoard[x][y]]
                el.style.top = `${y * 5}vw`
                el.style.left = `${x * 5}vw`
                
                $("#gameBoard").append(el)
            }
        })
    }

    drawEntities(entityBoard) {
        $("#entityBoard").html("")
        iterate(entityBoard, (x, y) => {
            if (entityBoard[x][y] !== 0) {
                let el = document.createElement("img")
                el.classList.add("tile")
                el.src = this.ENTITY_IMAGES[entityBoard[x][y]]
                el.style.top = `${y * 5 + 2.5}vw`
                el.style.left = `${x * 5 + 5}vw`
                
                $("#entityBoard").append(el)
            }
        })
    }

    drawPlayer(playerPos) {
        let x = playerPos.x
        let y = playerPos.y
        let el = document.createElement("img")
        el.classList.add("tile")
        el.setAttribute("id", "player")
        el.src = this.ENTITY_IMAGES[7]
        el.style.top = `${y * 5 + 2.5}vw`
        el.style.left = `${x * 5 + 5}vw`
        
        $("#gameBoard").append(el)
    }

    updateUI(level, health, score) {
        $("#level").html(level)
        $("#health").html(health)
        $("#score").html(score)
    }

    drawEnemies(enemies) {
        $("#enemyBoard").html()
        for (let i = 0; i < enemies.length; i++) {
            let x = enemies[i].x
            let y = enemies[i].y
            let el = document.createElement("img")
            el.classList.add("tile")
            el.setAttribute("id", enemies[i].id)
            el.src = this.ENTITY_IMAGES[6]
            el.style.top = `${y * 5 + 2.5}vw`
            el.style.left = `${x * 5 + 5}vw`

            $("#enemyBoard").append(el)
        }
    }

    moveEnemies(enemies) {
        for (let i = 0; i < enemies.length; i++) {
            let x = enemies[i].x
            let y = enemies[i].y
            let el = $("#" + enemies[i].id)
            el.animate({
                top: `${y * 5 + 2.5}vw`,
                left: `${x * 5 + 5}vw`
            }, { 
                duration: 50,
                easing: "linear"
            })
        }
    }

    removeEnemy(id) {
        $(`#${id}`).remove()
    }

    movePlayer(playerPos) {
        let x = playerPos.x
        let y = playerPos.y
        $("#player").animate({
            top: `${y * 5 + 2.5}vw`,
            left: `${x * 5 + 5}vw`
        }, { 
            duration: 50,
            easing: "linear"
        })
    }
}

// input object. does everything related to user input
class Input {
    constructor() {
        this.isMoving = false
        this.direction = -1
    }

    getInput(event, cb) {
        let inputNumber = event.keyCode | event.which
        let btnDown = event.type === "keydown" ? true : false

        //console.log(inputNumber, btnDown)
        switch(inputNumber) {
            case 87:
                this.direction = 0
                break
            case 68:
                this.direction = 1
                break
            case 83:
                this.direction = 2
                break
            case 65:
                this.direction = 3
        }

        if (!btnDown) {
            this.direction = -1
            return
        }

        // callback
        if (this.direction >= 0) {
            cb(this.direction)
        }
    }
}

// iterates over a 2d board which will call a function for every position
let iterate = (board, cb) => {
    for (let x = 0; x < board.length; x++) {
        for (let y = 0; y < board.length; y++) {
            cb(x, y)
        }
    }
}

// the connection between the three classes
const gameManager = () => {
    const game = new Game(removeEnemy, newBoard, gameOver) // Modal | handles game logic
    const view = new View() // View | displays information to the screen
    const input = new Input() // Controller | manages input

    // loop
    function update(e) {
        input.getInput(e, direction => {
            //game
            game.onMove(direction)
            // view
            view.movePlayer(game.playerPos)
            view.moveEnemies(game.enemies)
            view.updateUI((game.difficulty * 4) - 4, game.health, game.score)
            view.drawEntities(game.entityBoard)
        })
    }

    function gameOver(score) {
        view.gameOver(score)
    }

    function removeEnemy(id) {
        view.removeEnemy(id)
    }

    newBoard()
    function newBoard() {
        game.restart()
        view.clearMap()
        game.genMap(game.difficulty)
        view.drawMap(game.tileBoard)
        view.drawEntities(game.entityBoard)
        view.drawEnemies(game.enemies)
        view.drawPlayer(game.playerPos)
    }

    // bind things
    window.addEventListener("keydown", update)
    window.addEventListener("keyup",  update)
}



//menu stuff i didnt organize but it works
// move to view
$(document).ready(() => {
$("#gameContainer").html($("#menuTemplate").html())
const $menuOne = $("#menuOne")
const $menuTwo = $("#menuTwo")

$("#howToPlayButton").click(() => {
    menuTransistion($menuOne, $menuTwo)
})
$("#backButton").click(() => {
    menuTransistion($menuTwo, $menuOne)
})
$("#startButton").click(gameManager)

function menuTransistion($cur, $to) {
    if ($cur != null) {
        $cur.animate({
            width: "20%",
            minWidth: 0,
            opacity: 0
        }, 100, () => {
            $cur.css("display", "none")
            $to.css("display", "flex")
            $to.animate({
                width: "40%",
                minWidth: "300px",
                opacity: 1
            })
        })    
    } else {
        $to.css("display", "flex")
        $to.animate({
            width: "40%",
            minWidth: "300px",
            opacity: 1
        })
    }
}

menuTransistion(null, $menuOne)

})