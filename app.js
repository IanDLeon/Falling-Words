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

