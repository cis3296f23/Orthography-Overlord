const { ipcRenderer } = require('electron')

class GameManager {
    constructor(_inputContainer) {
        this.inputBoxes = [];
        this.currentInputIndex = 0;
        this.inputContainer = _inputContainer;
        this.currentWord = "";
    }

    resetWord() {
        this.inputContainer.innerHTML = "";
        this.inputBoxes = [];
        this.currentInputIndex = 0;
        this.currentWord = "";
    }

    clearInput() {
        for(const input of this.inputBoxes) {
            input.value = "";
        }
        this.currentInputIndex = 0;
    }

    getEnteredLetters = () => {
        var entered = "";
        for(const input of this.inputBoxes) {
            entered += input.value;
        }
        return entered;
    }

    
    loadWord = (word) => {
        this.resetWord();

        this.currentWord = word;
        for(const _ in word) {
            var input = document.createElement('input');
            input.type = "text";
            input.disabled = true;
            input.classList.add('letter');
            this.inputContainer.appendChild(input);
            this.inputBoxes.push(input);
        }
    }



    onTypeLetter = (e) => {
        console.log(e);
        let key = e.key.toLowerCase();

        if(key == "enter") {
            this.checkForWin();
            return;
        }

        if(key == "backspace" && this.currentInputIndex > 0) {
            this.currentInputIndex--;
            this.inputBoxes[this.currentInputIndex].value = "";
            return;
        }

        if(this.currentInputIndex == this.inputBoxes.length) {
            // shake or something
            return;
        }

        if(key.length == 1) {
            this.inputBoxes[this.currentInputIndex].value = key;
            this.currentInputIndex++;
        }
    }

    checkForWin() {
        
        if(this.currentInputIndex == this.inputBoxes.length && this.getEnteredLetters() == this.currentWord) {
            console.log("YOU WIN!!!");
            return true;
        } else if (this.currentInputIndex == this.inputBoxes.length) {
            // clear input maybe?
            this.clearInput();
        }

         return false;
    }
}

function makeTestRequest() {
    ipcRenderer.send("make-dictionary-request", "barnacle");
}

window.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('replayButton');
    const sound = document.getElementById('primaryAudio');
    const inputContainer = document.getElementById('inputContainer');

    function replaySound() {
        sound.play();
    }

    // IPC !!!!
    // MOVE TO SOMEWHERE ELSE!!!!!!

    ipcRenderer.on('dictionary-data-response', (event, filename) => {
        sound.src = filename;

    });

    ipcRenderer.on('dictionary-error-response', (event, error) => {
        // do something with error here
        console.log("RECEIVED ERROR");
        console.log(error);
    });

    // ASK MAIN.JS FOR DATA
    makeTestRequest();
    
    const game = new GameManager(inputContainer);
    game.loadWord("barnacle");
    
    document.addEventListener("keydown", game.onTypeLetter);
    button.addEventListener('click', replaySound);
})



  