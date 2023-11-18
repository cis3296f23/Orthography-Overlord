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
        }
    }

    clearInput() {
        this.currentInputBoxes = [];
        this.inputContainer.innerHTML = "";
    }
}

class AudioManager {
    constructor(_wordSound, _answerSound) {
        this.wordSound = _wordSound;
        this.loadedAudio = {};
        this.answerSound = _answerSound;
    }

    loadAudio = async (word) => { return window.electronAPI.loadAudioForWord(word) }

    async loadAudioForCurrentGame(wordList) {
        for(var word of wordList) {
            try {
                var filename = await this.loadAudio(word);
            } catch(e) {
                console.error("Could not load a file.", e);
            }
            this.loadedAudio[word] = filename;
        }
    }

    setAudioForWord(word) {
        this.wordSound.src = this.loadedAudio[word];
        this.wordSound.play();
    }

    /*
    This function plays a sound for correct and incorrect answers.
    Input:
        - correct: boolean, true if the answer was correct, false otherwise
    */
    playAnswerSound(correct) {
        if(correct) {
            this.answerSound.src = "./public/sounds/correct_answer.mp3";
        } else {
            this.answerSound.src = "./public/sounds/wrong_answer.mp3";
        }
        this.answerSound.play();
    }
}

class HintManager {
    constructor(_hintDisplay) {
        this.hintDisplay = _hintDisplay;
        this.hintsForCurrentWord = 0;
        // map to word later
        this.hintHistory = [];
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

        this.hintsForCurrentWord++;
        return hint;
    }
    
    displayHint(currentWord, userInput) {
        let hint = this.hintConstructor(currentWord, userInput)
        this.hintDisplay.innerHTML = "Hint: " + hint
    }

    clearHint() {
        this.hintHistory.push(this.hintsForCurrentWord);
        this.hintsForCurrentWord = 0;
        this.hintDisplay.innerHTML = ""
    }

}

class ScoreManager {

    constructor(_scoreModal, _scoreDisplay) {
        this.scoreModal = _scoreModal;
        this.scoreDisplay = _scoreDisplay;
        this.score = 100;
    }
    

    calculateAndDisplayScore(hintHistory, wordCount) {
        var perWordScore = 100 / wordCount;

        for(var hints of hintHistory) {
            switch(hints) {
                case 0:
                    break;
                case 1:
                    this.score -= 0.2 * perWordScore;
                    break;
                case 2: 
                    this.score -= 0.4 * perWordScore;
                    break;
                case 3:
                    this.score -= 0.7 * perWordScore;
                    break;
                default:
                    this.score -= perWordScore;
            }
        }

        var grade = "D";
        if(this.score == 100) {
            grade = "O!";
        } else if(this.score > 90) {
            grade = "A";
        } else if(this.score > 85) {
            grade = "A-";
        } else if(this.score > 80) {
            grade = "B";
        } else if(this.score > 70) {
            grade = "C";
        }

        this.scoreModal.classList.toggle("hidden");
        this.scoreDisplay.innerHTML = `${Math.round(this.score)} % (${grade})`;
    }
    
}

class GameManager {
    constructor(gameElements) {
        this.inputManager = new InputManager(gameElements.inputContainer);
        this.audioManager = new AudioManager(gameElements.wordChannel, gameElements.answerChannel);
        this.hintManager = new HintManager(gameElements.hintText); 
        this.scoreManager = new ScoreManager(gameElements.scoreModal, gameElements.scoreText);

        this.wordList = [];
        this.startingWordCount = 0;

        this.wordAddedToBack = false;
        this.currentWordIndex = 0;

        this.gameActive = false;
    }
    
    async setupGame(wordList) {
        this.wordList = wordList;
        this.startingWordCount = wordList.length;
        await this.audioManager.loadAudioForCurrentGame(wordList);
        this.currentWordIndex = 0;
        this.loadWord();
    }

    nextWord() {
        this.gameActive = false;
        // loadword sets gameactive to true
        this.audioManager.playAnswerSound(true);
        if(this.currentWordIndex < this.wordList.length-1) {
            this.currentWordIndex++;
            setTimeout(() => {
                this.loadWord();
            }, 800);
        } else {
            this.completeGame();
        }
    }
    
    loadWord() {
        this.audioManager.setAudioForWord(this.wordList[this.currentWordIndex]);
        this.inputManager.clearInput();
        this.wordAddedToBack = false;
        this.gameActive = true;
    }

    onTypeLetter = (e) => {
        if(!this.gameActive) return;

        let key = e.key.toLowerCase();
        
        if(key == "enter") {
            this.checkCorrectWord();
        } else if(key == "backspace") {
            this.inputManager.onBackspace();
        } else if(key.length == 1 && "abcdefghijklmnopqrstuvwxyz".includes(key)) {
            this.inputManager.onValidLetterEntered(key);
        }
    }

    checkCorrectWord() {
        if(this.inputManager.getEnteredLetters() == this.wordList[this.currentWordIndex]) {
            this.hintManager.clearHint();
            this.nextWord();
            return true;
        }

        if(!this.wordAddedToBack) {
            this.wordList.push(this.wordList[this.currentWordIndex])
            this.wordAddedToBack = true;
        }

        this.audioManager.playAnswerSound(false);
        this.hintManager.displayHint(this.wordList[this.currentWordIndex], this.inputManager.getEnteredLetters());
        this.inputManager.clearInput();
        return false;
    }

    completeGame() {
        this.scoreManager.calculateAndDisplayScore(this.hintManager.hintHistory, this.startingWordCount)
    }
}


window.addEventListener('DOMContentLoaded', () => {
    const replayButton = document.getElementById('replayButton');
    const quitButton = document.getElementById('quitButton');
    const scoreModalButton = document.getElementById('scoreModalButton');

    const gameElements = {
        hintText: document.getElementById('hintText'),
        inputContainer: document.getElementById('inputContainer'),
        wordChannel: document.getElementById('primaryAudio'),
        answerChannel: document.getElementById('answerSound'),
        scoreModal: document.getElementById('scoreModalWrapper'),
        scoreText: document.getElementById('scoreText'),
    }

    const game = new GameManager(gameElements);

    replayButton.addEventListener('click', () => { gameElements.wordChannel.play(); });
    document.addEventListener("keydown", game.onTypeLetter);
    scoreModalButton.addEventListener('click', () => { window.electronAPI.switchPage("MENU") });
    quitButton.addEventListener('click', () => { window.electronAPI.switchPage("MENU") });

    game.setupGame(["barnacle", "python", "cousin", "oyster", "opportunity", "world"]);
});
