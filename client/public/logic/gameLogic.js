class InputManager {
    constructor(_inputContainer) {
        this.inputContainer = _inputContainer;
        this.currentInputBoxes = [];
    }

    createInputBox() {
        const input = document.createElement('input');
        input.type = "text";
        input.disabled = true;
        input.classList.add('letter');
        this.inputContainer.appendChild(input);
        this.currentInputBoxes.push(input);
        return input;
    }

    getEnteredLetters() {
        var entered = "";
        for(const input of this.currentInputBoxes) {
            entered += input.value;
        }
        return entered;
    }

    onValidLetterEntered(key) {
        var input = this.createInputBox();
        input.value = key;
    }

    onBackspace() {
        if(this.currentInputBoxes.length > 0) {
            this.inputContainer.removeChild(this.currentInputBoxes.pop());
        } else {
            // INDICATE THAT USER COULD NOT DELTE WITH A SCREENSHAKE OR SOUND
        }
    }

    clearInput() {
        this.currentInputBoxes = [];
        this.inputContainer.innerHTML = "";
    }
}


class AudioManager {
    constructor(_audioPlayer) {
        this.audioPlayer = _audioPlayer;
        this.loadedAudio = {};
    }

    loadAudio = async (word) => { return window.electronAPI.loadAudioForWord(word) }

    async loadAudioForCurrentGame(wordlist) {
        for(var word of wordlist) {
            try {
                var filename = await this.loadAudio(word);
            } catch(e) {
                console.error("Could not load a file.", e);
            }
            this.loadedAudio[word] = filename;
        }
    }

    setAudioForWord(word) {
        this.audioPlayer.src = this.loadedAudio[word];
        this.audioPlayer.play();
    }
}

class HintManager {
    constructor(_hintDisplay) {
        this.hintDisplay = _hintDisplay;
    }

    hintConstructor(currentWord, userInput) {
        const input_len = userInput.length;
        let hint = "";
        for (let i = 0; i < currentWord.length - 1; i++) {
            if (i < input_len && currentWord[i] === userInput[i]) {
                hint += currentWord[i].toUpperCase();
                continue;
            }
            if (hint.length + 1 < currentWord.length) {
                hint += currentWord[i].toUpperCase();
            }
            break;
        }
        return hint;
    }
    
    displayHint(currentWord, userInput) {
        let hint = this.hintConstructor(currentWord, userInput)
        this.hintDisplay.innerHTML = "Hint: " + hint
    }

    clearHint() {
        this.hintDisplay.innerHTML = ""
    }
    
}

class GameManager {
    constructor(_inputContainer, _audioPlayer, _hintText) {
        this.inputManager = new InputManager(_inputContainer);
        console.log(this.inputManager);
        this.audioManager = new AudioManager(_audioPlayer);
        this.hintManager = new HintManager(_hintText);

        this.wordAddedToBack = false;

        this.wordlist = [];
        this.currentWordIndex = 0;
    }
    
    async setupGame(wordlist) {
        this.wordlist = wordlist;
        await this.audioManager.loadAudioForCurrentGame(wordlist);

        this.currentWordIndex = 0;
        this.loadWord();
    }

    nextWord() {
        if(this.currentWordIndex < this.wordlist.length-1) {
            this.currentWordIndex++;
            this.loadWord();
        } else {
            window.electronAPI.switchPage("MENU");
        }
    }
    
    loadWord() {
        this.audioManager.setAudioForWord(this.wordlist[this.currentWordIndex]);
        this.inputManager.clearInput();
        this.wordAddedToBack = false;
    }

    onTypeLetter = (e) => {
        let key = e.key.toLowerCase();
        
        if(key == "enter") {
            this.checkForWin();
        } else if(key == "backspace") {
            this.inputManager.onBackspace();
        } else if(key.length == 1 && "abcdefghijklmnopqrstuvwxyz".includes(key)) {
            this.inputManager.onValidLetterEntered(key);
        }
    }

    checkForWin() {
        if(this.inputManager.getEnteredLetters() == this.wordlist[this.currentWordIndex]) {
            this.hintManager.clearHint();
            this.nextWord();
            return true;
        }

        if(!this.wordAddedToBack) {
            this.wordlist.push(this.wordlist[this.currentWordIndex])
            this.wordAddedToBack = true;
        }

        this.hintManager.displayHint(this.wordlist[this.currentWordIndex], this.inputManager.getEnteredLetters());
        this.inputManager.clearInput();
        return false;
    }

}


window.addEventListener('DOMContentLoaded', () => {
    const replayButton = document.getElementById('replayButton');
    const sound = document.getElementById('primaryAudio');
    const hintText = document.getElementById('hintText')
    const inputContainer = document.getElementById('inputContainer');
    
    const game = new GameManager(inputContainer, sound, hintText);

    document.addEventListener("keydown", game.onTypeLetter);

    replayButton.addEventListener('click', () => {
        sound.play();
    });

    document.getElementById('myButton').addEventListener('click', () => {
        window.electronAPI.switchPage("MENU");
    });

    game.setupGame(["barnacle", "python", "kingdom"]);
});