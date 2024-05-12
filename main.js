const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const numberOfColumns = 8
const numberOfRows = 20
const brickSize = (window.innerHeight * 0.8) / 20

const gridWidth = numberOfColumns * brickSize
const gridHeight = numberOfRows * brickSize

canvas.height = window.innerHeight * 0.8
canvas.width = (canvas.height * numberOfColumns) / numberOfRows
canvas.style.height = canvas.height + 'px'
canvas.style.width = canvas.width + 'px'

const P = true
const O = false
const shapes = [
    rotateArrayRight([
        [O, O, O, O, O],
        [O, O, P, O, O],
        [O, O, P, O, O],
        [O, O, P, O, O],
        [O, O, P, O, O],
    ]), // "I"
    rotateArrayRight([
        [O, O, O, O, O],
        [O, O, P, O, O],
        [O, O, P, O, O],
        [O, O, P, P, O],
        [O, O, O, O, O],
    ]), // "L"
    rotateArrayRight([
        [O, O, O, O, O],
        [O, O, P, O, O],
        [O, O, P, O, O],
        [O, P, P, O, O],
        [O, O, O, O, O],
    ]), // Reverted "L"
    rotateArrayRight([
        [O, O, O, O, O],
        [O, O, O, O, O],
        [O, P, P, O, O],
        [O, P, P, O, O],
        [O, O, O, O, O],
    ]), // Square
    rotateArrayRight([
        [O, O, O, O, O],
        [O, O, P, P, O],
        [O, P, P, O, O],
        [O, O, O, O, O],
        [O, O, O, O, O],
    ]), // "S"
    rotateArrayRight([
        [O, O, O, O, O],
        [O, O, P, P, O],
        [O, P, P, O, O],
        [O, O, O, O, O],
        [O, O, O, O, O],
    ]), // Reverted "S"
    rotateArrayRight([
        [O, O, O, O, O],
        [O, O, P, O, O],
        [O, P, P, P, O],
        [O, O, O, O, O],
        [O, O, O, O, O],
    ]), // "T"
]

const isOccupied = Array.from({ length: numberOfColumns }, (_) => Array.from({ length: numberOfRows }, (_) => false))

let movingPiece = undefined
let tickCounter = 0
let score = 0

let gameStarted = false
let fastMode = false
let layingMode = false
let isPaused = false
let gameOver = false

function keyDownHandler(event) {
    if (gameStarted) {
        if (event.code === 'ArrowLeft') moveLeft()
        if (event.code === 'ArrowRight') moveRight()
        if (event.code === 'Space') layingMode = true
        if (event.code === 'ArrowDown') fastMode = true
        if (event.code === 'KeyQ') rotateLeft()
        if (event.code === 'KeyW') rotateRight()
        if (event.code === 'KeyP') {
            isPaused = !isPaused
            layingMode = false
            fastMode = false
        }
    } else {
        if (event.code === 'Enter') gameStarted = true
    }
}

function keyUpHandler(event) {
    if (event.code === 'ArrowDown') fastMode = false
}

function drawBrick(column, row, color) {
    const x = column * brickSize
    const y = row * brickSize

    ctx.beginPath()
    ctx.rect(x, y, brickSize, brickSize)
    if (color) {
        ctx.fillStyle = color
        ctx.fill()
    }
    ctx.stroke()
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.closePath()
}

function drawGrid() {
    for (let column = 0; column < numberOfColumns; column++) {
        for (let row = 0; row < numberOfRows; row++) {
            drawBrick(column, row, isOccupied[column][row] ? 'rgb(255, 100, 50)' : undefined)
        }
    }
}

function drawScore() {
    document.getElementById('score').innerText = score
}

function drawPiece() {
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            const column = movingPiece.column - 2 + x
            const row = movingPiece.row - 2 + y

            if (column < 0 || column >= numberOfColumns || row < 0 || row >= numberOfRows) continue

            if (movingPiece.shape[x][y]) {
                drawBrick(column, row, 'rgb(123, 25, 250)')
            }
        }
    }
}

function drawBanner({ size, style, color, bannerRgba }, ...lines) {
    ctx.beginPath()
    ctx.rect(0, 0, gridWidth, gridHeight)
    ctx.fillStyle = bannerRgba || 'rgba(200, 150, 100, 0.75)'
    ctx.fill()
    ctx.closePath()

    const fontSize = size || 45
    const interline = fontSize * 1.1

    ctx.font = `${style || 'bold'} ${fontSize}px sans-serif`
    ctx.fillStyle = color || 'rgb(70, 70, 70)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    let y = gridHeight / 2 - ((lines.length - 1) / 2) * interline

    for (const line of lines) {
        ctx.fillText(line, canvas.width / 2, y, gridWidth - 15)
        y += interline
    }
}

function moveRight() {
    if (!isShapeCollision(movingPiece.column + 1, movingPiece.row)) {
        movingPiece.column++
    }
}

function moveLeft() {
    if (!isShapeCollision(movingPiece.column - 1, movingPiece.row)) {
        movingPiece.column--
    }
}

function rotateArrayRight(array) {
    let newArray = Array.from({ length: 5 }, (_) => Array.from({ length: 5 }, (_) => false))

    for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
            newArray[4 - y][x] = array[x][y]
        }
    }

    return newArray
}

function rotateArrayLeft(array) {
    return rotateArrayRight(rotateArrayRight(rotateArrayRight(array)))
}

function rotateLeft() {
    const shape = rotateArrayLeft(movingPiece.shape)
    if (!isShapeCollision(movingPiece.column, movingPiece.row, shape)) {
        movingPiece.shape = shape
    }
}

function rotateRight() {
    const shape = rotateArrayRight(movingPiece.shape)
    if (!isShapeCollision(movingPiece.column, movingPiece.row, shape)) {
        movingPiece.shape = shape
    }
}

function layPiece() {
    for (let row = movingPiece.row; row < numberOfRows; row++) {
        if (!isShapeCollision(movingPiece.column, row)) {
            movingPiece.row = row
        } else return
    }
}

function isRowFull(row) {
    for (let column = 0; column < numberOfColumns; column++) {
        if (!isOccupied[column][row]) return false
    }
    return true
}

function removeFullRow(rowToRemove) {
    for (let column = 0; column < numberOfColumns; column++) {
        for (let row = rowToRemove; row > 0; row--) {
            isOccupied[column][row] = isOccupied[column][row - 1]
        }
    }

    score += 90
}

function insertPieceAtTop() {
    const shapeNumber = Math.floor(Math.random() * shapes.length)
    movingPiece = {
        row: 0,
        column: Math.floor(numberOfColumns / 2 - 1),
        shape: shapes[shapeNumber],
    }
}

function isBrickOnFirstRow() {
    for (let column = 0; column < numberOfColumns; column++) {
        if (isOccupied[column][0]) return true
    }
    return false
}

function movePieceDown() {
    tickCounter++
    if (tickCounter < 4 && !fastMode) return

    if (layingMode) {
        layPiece()
        layingMode = false
    }

    if (!isShapeCollision(movingPiece.column, movingPiece.row + 1)) {
        movingPiece.row++
    } else {
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                if (movingPiece.shape[x][y]) isOccupied[movingPiece.column - 2 + x][movingPiece.row - 2 + y] = true
            }
        }

        movingPiece = undefined
        score += 10
    }

    tickCounter = 0
}

function isShapeCollision(shapeColumn, shapeRow, shape = movingPiece.shape) {
    for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
            if (!shape[x][y]) continue

            const column = shapeColumn - 2 + x
            const row = shapeRow - 2 + y
            if (row >= numberOfRows || column < 0 || column >= numberOfColumns || isOccupied[column][row]) return true
        }
    }
    return false
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawGrid()
    drawScore()

    if (movingPiece) {
        drawPiece()
    }

    if (!gameStarted) {
        drawBanner(
            {
                size: 35,
                color: 'black',
                style: '',
                bannerRgba: 'rgba(75, 75, 255, 0.975)',
            },
            'Press',
            'ENTER',
            'to start'
        )
    } else if (gameOver) {
        drawBanner({}, 'Game', 'Over')
    } else if (isPaused) {
        drawBanner({}, 'Paused')
    }
}

function tick() {
    if (isBrickOnFirstRow()) gameOver = true

    draw()

    if (!gameStarted || gameOver || isPaused) return

    if (movingPiece) {
        movePieceDown()
    } else {
        insertPieceAtTop()
    }

    for (row = 0; row < numberOfRows; row++) {
        if (isRowFull(row)) removeFullRow(row)
    }
}

document.addEventListener('keydown', keyDownHandler, false)
document.addEventListener('keyup', keyUpHandler, false)

setInterval(tick, 50)
