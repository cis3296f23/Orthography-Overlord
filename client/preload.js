const { ipcRenderer } = require('electron')

class GameManager {
    constructor(_inputContainer) {
        this.inputBoxes = [];
        this.currentInputIndex = 0;
        this.inputContainer = _inputContainer;
        this.currentWord = "";
    }

    hint_constructor() {
        user_input = this.getEnteredLetters
        let hint = "";
        let input_len = user_input.length;
        for (let i = 0; i < this.currentWord.length - 1; i++) {
            if (i < input_len && word[i] === user_input[i]) {
                hint += word[i];
                continue;
            }
            if (hint.length + 1 < this.currentWord.length) {
                hint += word[i];
            }
            break;
        }
        return hint;
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

function getAudio(word) {
    ipcRenderer.send("make-dictionary-request", word);
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
    
    const game = new GameManager(inputContainer);
    getAudio("barnacle");
    game.loadWord("barnacle");
    
    document.addEventListener("keydown", game.onTypeLetter);
    button.addEventListener('click', replaySound);
})
