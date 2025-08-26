// EXAMPLE: THIS FILE IS BASED ON EXAMPLE GIVEN ON chessboard.js DOCUMENTATION
initPGN()

function attachEvent(selectorOrId, eventType, fn) {
    const el1 = document.getElementById(selectorOrId)
    if (el1) { el1.addEventListener(eventType, fn); return }

    const el2 = document.querySelector(selectorOrId)
    if (el2) { el2.addEventListener(eventType, fn); return }

    console.warn('Unable to attachEvent to element:', selectorOrId)
}
const game = new Chess()
const boardConfig = {
    draggable: true,
    onDragStart,
    onTouchSquare,
    onDrop,
    onSnapEnd,
    position: game.fen(),
    touchMove: true
}
const board = Chessboard2('myBoard', boardConfig)

updateStatus()

let pendingMove = null

// There are 5 outcomes from this action:
// - start a pending move
// - clear a pending move
// - clear a pending move AND start a different pending move
// - make a move (ie: complete their pending move)
// - do nothing
function onTouchSquare(square, piece, boardInfo) {
    // ask chess.js what legal moves are available from this square
    const legalMoves = game.moves({ square, verbose: true })

    // Option 1: start a pending move
    if (!pendingMove && legalMoves.length > 0) {
        pendingMove = square

        // add circles showing where the legal moves are for this piece
        legalMoves.forEach(move => {
            board.addCircle(move.to)
        })

        // Option 2: clear a pending move if the user selects the same square twice
    } else if (pendingMove && pendingMove === square) {
        pendingMove = null
        board.clearCircles()

        // Option 3: clear a pending move and start a new pending move
    } else if (pendingMove) {
        // ask chess.js to make a move
        const moveResult = game.move({
            from: pendingMove,
            to: square,
            promotion: 'q' // TODO: Add Options for Promotions
        })

        // was this a legal move?
        if (moveResult) {
            // clear circles on the board
            board.clearCircles()

            // update to the new position
            board.position(game.fen()).then(() => {
                // wait a smidge, then make a random move for Black
                window.setTimeout(makeBotMove, 250)
                updatePGN()
                updateStatus()
            })

            // if the move was not legal, then start a new pendingMove from this square
        } else if (piece) {
            pendingMove = square

            // remove any previous circles
            board.clearCircles()

            // add circles showing where the legal moves are for this piece
            legalMoves.forEach(m => {
                board.addCircle(m.to)
            })

            // else clear pendingMove
        } else {
            pendingMove = null
            board.clearCircles()
        }
    }
}

function updateStatus() {
    let statusHTML = ''
    const whosTurn = game.turn() === 'w' ? 'White' : 'Black'

    if (!game.game_over()) {
        if (game.in_check()) statusHTML = whosTurn + ' is in check! '
        statusHTML = statusHTML + whosTurn + ' to move...'
    } else if (game.in_checkmate() && game.turn() === 'w') {
        statusHTML = 'White is in checkmate. Black wins!'
    } else if (game.in_checkmate() && game.turn() === 'b') {
        statusHTML = 'Black is in checkmate. White wins!'
    } else if (game.in_stalemate() && game.turn() === 'w') {
        statusHTML = 'White is stalemated.'
    } else if (game.in_stalemate() && game.turn() === 'b') {
        statusHTML = 'Black is stalemated.'
    } else if (game.in_threefold_repetition()) {
        statusHTML = 'Game is drawn by threefold repetition rule.'
    } else if (game.insufficient_material()) {
        statusHTML = 'Game is drawn by insufficient material.'
    } else if (game.in_draw()) {
        statusHTML = 'Game is drawn by fifty-move rule.'
    }

    document.getElementById('gameStatus').innerHTML = statusHTML
}

function initPGN() {
    const container = document.getElementById('pgnTable');
    container.innerText = ''

    const table = document.createElement('table');

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['#', 'White', 'Black'];

    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    container.appendChild(table);
}

function updatePGN() {
    // const pgnEl = document.getElementById('gamePGN')
    // pgnEl.innerHTML = game.pgn({ max_width: 5, newline_char: '<br />' })
    console.log(game.pgn())

    const pgnString = game.pgn();

    // Parse PGN
    const moveRegex = /(\d+)\.\s+(\S+)(?:\s+(\S+))?/g;
    const matches = [...pgnString.matchAll(moveRegex)];
    const moves = matches.map(match => ({
        move: match[1],
        white: match[2],
        black: match[3] || '' // Use empty string if Black's move is missing
    }));

    const container = document.getElementById('pgnTable');
    container.innerText = ''

    const table = document.createElement('table');

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['#', 'White', 'Black'];

    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    moves.forEach(moveData => {
        const row = document.createElement('tr');

        const moveCell = document.createElement('td');
        moveCell.textContent = moveData.move;
        row.appendChild(moveCell);

        const whiteCell = document.createElement('td');
        whiteCell.textContent = moveData.white;
        row.appendChild(whiteCell);

        const blackCell = document.createElement('td');
        blackCell.textContent = moveData.black;
        row.appendChild(blackCell);

        tbody.appendChild(row);
    });

    table.appendChild(tbody);


    container.appendChild(table);


}

function updateEvalBar(score) {
    const whiteBar = document.querySelector('.eval-bar-white');
    if (!whiteBar) {
        console.error("Eval bar element not found!");
        return;
    }

    // A +/- score of 800 centipawns (8 pawns) is usually a completely winning advantage.
    // We can cap the visualization at this value.
    const maxEval = 800; 
    
    // Clamp the score to the range [-maxEval, maxEval]
    const clampedScore = Math.max(-maxEval, Math.min(maxEval, score));

    // Convert the score from the range [-800, 800] to a percentage [0, 100].
    // -800 score -> 0% height for white
    //    0 score -> 50% height for white
    // +800 score -> 100% height for white
    const percentage = ((clampedScore + maxEval) / (2 * maxEval)) * 100;

    // Apply the calculated height to the white bar element
    whiteBar.style.height = `${percentage}%`;
}
// function updateFEN(fen) {
//     const fenEl = document.getElementById('gameFEN')
//     fenEl.innerHTML = game.fen()
//     console.log(game.fen())
// }

function onDragStart(dragStartEvt) {
    // do not pick up pieces if the game is over
    if (game.game_over()) return false

    // only pick up pieces for White
    if (!isWhitePiece(dragStartEvt.piece)) return false

    // what moves are available to White from this square?
    const legalMoves = game.moves({
        square: dragStartEvt.square,
        verbose: true
    })

    // do nothing if there are no legal moves
    if (legalMoves.length === 0) return false

    // place Circles on the possible target squares
    legalMoves.forEach((move) => {
        board.addCircle(move.to)
    })
}

function isWhitePiece(piece) { return /^w/.test(piece) }

async function make_move() {
    const payload = {
        "fen": game.fen(),
        "pgn": game.pgn()
    }
    const response = await fetch("/api/get_server_move", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    const json = await response.json()
    return json
}

async function makeBotMove() {

    json = await make_move()
    console.log("Response from server: ", json)
    const possibleMoves = game.moves()

    // game over
    // if (possibleMoves.length === 0) return
    // const randomIdx = Math.floor(Math.random() * possibleMoves.length)
    // console.log(possibleMoves)
    // game.move(possibleMoves[randomIdx])
    game.move(json.move)
    updateEvalBar(parseFloat(json.score))
    

    board.position(game.fen(), (_positionInfo) => {
        updateStatus()
        updatePGN()
        // updateFEN(game.fen())
    })
}

function showGameOverOnBoard() {
    const myBoardDiv = document.getElementById('myBoard');
    if (myBoardDiv) {
        myBoardDiv.classList.add('game-over');
    }
}

function onDrop(dropEvt) {
    // see if the move is legal
    const move = game.move({
        from: dropEvt.source,
        to: dropEvt.target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    })

    board.clearCircles()

    // the move was legal
    if (move) {
        // reset the pending move
        pendingMove = null

        // update the board position
        board.fen(game.fen(), () => {
            updateStatus()
            updatePGN()
            if (game.game_over()) {
                console.log("Game Over!")
                showGameOverOnBoard()
                return
            }
            // make a random legal move for black
            window.setTimeout(makeBotMove, 250)
        })
    } else {
        // reset the pending move
        pendingMove = null

        // return the piece to the source square if the move was illegal
        return 'snapback'
    }
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd() {
    board.position(game.fen())
}
