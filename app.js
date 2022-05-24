var debugFlag = false;
var debugDrawFlag = false;

function debugLog() {
    console.log("Debug Logged!");
}

function setupCanvas() {
    var canvas = document.getElementById("cvs");
    var width = getWidth() - 7;
    var height = getHeight() - 7;

    if (debugFlag) {
        console.log("Window height found to be: " + height)
        console.log("Window width found to be: " + width)
    }
    canvas.width = width;
    canvas.height = height;

    return canvas;
}

function gameController(canvas) {
    this.gameRunning = true;
    this.canvas = canvas;
    this.wpm = 30;
    this.wordContainer = [];
    this.currentWord = '';
    this.buffer = '';
    this.score = 0;
    this.health = 100;
    this.clears = 0;
    this.clearChance = 5;
    this.modChance = 5;
    this.scoreMultiplier = 1;

    this.doubleTime = false;
    this.slowMo = false;
    this.downpour = false;
    this.cascade = false;
    this.overload = false;
    this.blur = false;
    this.upPour = false;

}

function wordObj(text, x, y) {
    this.text = text;
    this.value = text.length;
    this.x = x;
    this.y = y;
    this.speed = (Math.random() * (controller.score / 100)) + 1; //Using globals again... (Laziness > desire for good practice) : True
    if (Math.random() > 0.5) {
        this.cascadeDir = 3;
    } else {
        this.cascadeDir = -3;
    }
}
gameController.prototype.resetModifiers = function () {
    this.doubleTime = false;
    this.slowMo = false;
    this.downpour = false;
    this.overload = false;
    this.blur = false;
    this.cascade = false;
    this.upPour = false;
    downpour(false);
}

gameController.prototype.addWord = function () {
    if (this == window) {
        var that = controller; //SUPER HOKEY way to avoid setTimeout from using global window context...
    } else {
        var that = this;
    }

    var timeUntilNextWord = ((60 / that.wpm) * 1000)

    if (Math.random() < (that.clearChance / 100)) { //Roll for clear chance
        var word = new wordObj("CLEAR", Math.floor(Math.random() * (that.canvas.width - 300)), 30);
        that.wordContainer.push(word);
        window.setTimeout(that.addWord, timeUntilNextWord);
        return word;
    }
    if (Math.random() < (that.modChance / 100)) { //Roll for modifier. If failed, up the chance!
        var word = new wordObj("MODIFIER", Math.floor(Math.random() * (that.canvas.width - 300)), 30);
        that.wordContainer.push(word);
        window.setTimeout(that.addWord, timeUntilNextWord);
        return word;
    } else { that.modChance++; }

    var lengthOfArr = fullWordListArr.length;
    var text = fullWordListArr[Math.floor(Math.random() * lengthOfArr)]; //Grab a random word from wordlist in words.js

    var x = Math.floor(Math.random() * (that.canvas.width - 300)); //Grab random x coordinate within canvas

    var word = new wordObj(text, x, 30);

    that.wordContainer.push(word);

    //Override time if not special
    timeUntilNextWord = ((60 / that.wpm) * 1000) + (100 * word.text.length); //In milliseconds, so 60 seconds / words per minute, * 1000 milliseconds/sec

    if (that.gameRunning) {
        window.setTimeout(that.addWord, timeUntilNextWord); //Break our timer if game is over
    }

    if (debugFlag) { console.log("Pushing word: " + word.text + " to gameController.") }
    return word;
}

/* -------------- Game Logic ---------------- */

//Main program loop
function mainLoop() {
    requestAnimationFrame(mainLoop);
  
    now = Date.now();
    elapsed = now - then; // if enough time has elapsed, draw the next frame
    if (elapsed > fpsInterval) {
        // Get ready for next frame by setting then=now, but also adjust for 
        // specified fpsInterval not being a multiple of RAF's interval (16.7ms)
        then = now - (elapsed % fpsInterval);
  
        updatePositions(controller); //Update all word locations!
        updateWords(controller); //Checks for completed words
        draw(controller); //Draw to the screen!
        if (controller.health <= 0) { gameOver(); } //Run game over if health is 0
  
        if (controller.gameRunning) {
            requestAnimationFrame(mainLoop); //Loop again when browser is ready. 60FPS if possible
        }
    }
  }
  
  function updatePositions(gameController) {
    var wordsArr = gameController.wordContainer;
    var multiplier = 1.0;
    if (gameController.doubleTime) { multiplier = multiplier * 1.25; }
    if (gameController.slowMo) { multiplier = multiplier / 2; }
  
    for (var i = 0; i < wordsArr.length; i++) {
        var currentWord = wordsArr[i];
        if (currentWord === undefined) { //Catch errors
            return;
        }
  
        currentWord.y += currentWord.speed * multiplier;
  
        if (gameController.cascade) {
            currentWord.x += currentWord.cascadeDir;
            if (currentWord.x > gameController.canvas.width - 100 || currentWord.x < 10) {
                currentWord.cascadeDir = (currentWord.cascadeDir * -2);
                if (currentWord.cascadeDir > 20 || currentWord.cascadeDir < -20) {
                    currentWord.cascadeDir = currentWord.cascadeDir * 0.5;
                }
            }
        }
  
        if (currentWord.y >= gameController.canvas.height - 10) {
            gameController.health -= currentWord.value;
            wordsArr.splice(i, 1);
            if (currentWord.text.startsWith(gameController.buffer)) { gameController.buffer = ''; } //Only reset buffer if it is current word
        }
    }
  }
  
  function updateWords(gameController) {
    var wordsArr = gameController.wordContainer;
  
    for (var i = 0; i < wordsArr.length; i++) {
        var currentWord = wordsArr[i];
        if (currentWord === undefined) {
            return;//Catch errors
        }
        if (currentWord.text == gameController.buffer) { // If complete buffer word found in array
            wordsArr.splice(i, 1);
            gameController.score += currentWord.value * gameController.scoreMultiplier;
            gameController.wpm += (currentWord.value / 10);
            if (gameController.buffer == "CLEAR") {
                gameController.clears++;
            }
            if (gameController.buffer == "MODIFIER") {
                gameController.modChance = 0;
                randomModifier(gameController);
            }
            gameController.buffer = ''; //Reset buffer
            return;
        }
    }
  }
  
  function draw(gameController) {
    var canvas = gameController.canvas;
    clear(canvas, '#111111'); //Clear the canvas
  
    var ctx = canvas.getContext('2d');
    ctx.font = "30px Arial";
    ctx.strokeStyle = '#FFFFFF';
    ctx.fillStyle = '#FF0000';
  
    if (gameController.blur) { canvas.style.webkitFilter = "blur(2px)"; } //Blur effect!
    else{
        canvas.style.webkitFilter = "blur(0px)";  //Blur effect!
    }
  
    var wordsArr = gameController.wordContainer;
    for (var i = 0; i < wordsArr.length; i++) {
        var currentWord = wordsArr[i];
        if (currentWord === undefined) { //Catch errors
            return;
        }
        var text = currentWord.text;
  
        ctx.strokeText(currentWord.text, currentWord.x, currentWord.y);
  
        if (currentWord.text == "CLEAR") {
            ctx.fillStyle = '#0000FF';
            ctx.fillText(currentWord.text, currentWord.x, currentWord.y);
            ctx.fillStyle = '#FF0000';
        }
        if (currentWord.text.startsWith(gameController.buffer)) { //Fill characters of words matching buffer...
            ctx.fillText(gameController.buffer, currentWord.x, currentWord.y);
        }
  
        if (debugDrawFlag) {
            console.log("Drawing " + currentWord.text + " @ " + currentWord.x + " , " + currentWord.y)
        }
  
    }
    
