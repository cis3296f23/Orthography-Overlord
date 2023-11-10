const { ipcRenderer } = require('electron')



class GameManager {
    constructor(_inputContainer, _audioPlayer, _winCallback, _hintText) {
        this.inputBoxes = [];
        this.currentInputIndex = 0;
        this.inputContainer = _inputContainer;
        this.audioPlayer = _audioPlayer;
        this.currentWord = "";
        this.hintText = _hintText

        this.loadedAudio = [];
        this.wordList = [];
        this.winCallback = _winCallback;

        this.solvedWords = [];   
        this.gameIndex = 0;
    }

    hintConstructor() {
        const userInput = this.getEnteredLetters();
        const input_len = userInput.length;
        let hint = "";
        for (let i = 0; i < this.currentWord.length - 1; i++) {
            if (i < input_len && this.currentWord[i] === userInput[i]) {
                hint += this.currentWord[i].toUpperCase();
                continue;
            }
            if (hint.length + 1 < this.currentWord.length) {
                hint += this.currentWord[i].toUpperCase();
            }
            break;
        }
        return hint;
    }
    
    displayHint() {
        let hint = this.hintConstructor()
        this.hintText.innerHTML = "Hint: " + hint
    }

    clearHint() {
        this.hintText.innerHTML = ""
    }
    
    setupGame = async (wordList) => {
        this.wordList = wordList;
        this.loadedAudio = [];

        for(var word of this.wordList) {
            try {
            var filename = await this.loadAudio(word);
            } catch(e) {
                console.error("Could not load a file.", e);
            }

            this.loadedAudio.push(filename);
        }

        this.solvedWords = [];
        this.gameIndex = 0;
        this.loadWord();
    }

    nextWord = () => {
        if(this.gameIndex < this.wordList.length-1) {
            this.gameIndex++;
            this.loadWord();
        } else {
            this.winCallback();
            this.setupGame(["flatulence", "armor"]);
        }
    }
    
    resetWord = () => {
        this.inputContainer.innerHTML = "";
        this.inputBoxes = [];
        this.currentInputIndex = 0;
        this.currentWord = "";
        this.clearInput();
    }

    clearInput = () => {
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


    loadWord = () => {

        var word = this.wordList[this.gameIndex];
        this.audioPlayer.src = this.loadedAudio[this.gameIndex];
        this.audioPlayer.play();
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

    checkForWin = () => {
        
        if(this.currentInputIndex == this.inputBoxes.length && this.getEnteredLetters() == this.currentWord) {
            this.clearHint();
            this.nextWord();
            return true;
        } else if (this.currentInputIndex == this.inputBoxes.length) {
            // clear input maybe?
            this.displayHint();
            this.clearInput();
        }

         return false;
    }

    loadAudio = async (word) => {
        return new Promise((resolve, reject) => {
            ipcRenderer.send("make-dictionary-request", word);

            ipcRenderer.on('dictionary-data-response', (event, filename) => {
                // sound.src = filename;
                resolve(filename);
            });
        
            ipcRenderer.on('dictionary-error-response', (event, error) => {
                reject(error);
            });
        })
    }
}

// function getAudio(word) {
//     ipcRenderer.send("make-dictionary-request", word);
// }

window.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('replayButton');
    const sound = document.getElementById('primaryAudio');
    const alien = document.getElementById('alien');
    const hintText = document.getElementById('hintText')
    const inputContainer = document.getElementById('inputContainer');


    function replaySound() {
        sound.play();
    }

    function winCallback() {
        alien.classList.remove("hidden");
    }
    
    const game = new GameManager(inputContainer, sound, winCallback, hintText);
    game.setupGame(["barnacle", "python"]);
    

    document.addEventListener("keydown", game.onTypeLetter);
    button.addEventListener('click', replaySound);
    document.getElementById('myButton').addEventListener('click', () => {
        // Send an IPC message to load the menu
        ipcRenderer.send('load-menu', { /* additional data if needed */ });
    });
})
