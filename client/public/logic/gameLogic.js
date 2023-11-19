class CircleManager {
    constructor(_circleContainer, _gameManager) {
        this.circleContainer = _circleContainer
        this.gameManager = _gameManager
        this.maxCircles = 30;
        this.offsetAmount = 5;
        this.offset = 0;
        this.circleList = [];
        this.lastWordDataLength = -1
    }

    makeMark(succeed, retry) {
        var mark = document.createElement("img");
        if(succeed) {
            if(retry) {
                mark.src = "./public/images/yellowcheck.png";
            } else {
                mark.src = "./public/images/greencheck.png";
            }
        } else {
            mark.src = "./public/images/redx.png";
        }

        mark.classList.add("circlemark");
        return mark;
    }

    displayCircles() {
        if(this.lastWordDataLength == Object.keys(this.gameManager.wordData).length) {
            if(!this.gameManager.allWordsSeen) {
                return;
            }
        } else {
            this.lastWordDataLength = Object.keys(this.gameManager.wordData).length;
        }

        this.circleList = [];
        this.circleContainer.innerHTML = "";

        if(this.gameManager.currentWordIndex+1 > this.maxCircles + this.offset) {
            this.offset += this.offsetAmount;
        }

        var firstUncompleted = -1;
        for(var x=this.offset; x<this.maxCircles + this.offset; x++) {
            
            if(x >= this.gameManager.wordList.length) {
                continue;
            }

            const retry = this.gameManager.wordList[x].data == "retry" || this.gameManager.wordList[x].data == "redeemed";
            const seen = this.gameManager.wordData[x] != undefined;
            

            var circle = this.addCircle();

            if(retry) { circle.classList.add("retry"); }
            
            if(seen) {
                var success = this.gameManager.wordData[x];
                circle.classList.add(success ? "complete" : "failed")
                var mark = this.makeMark(success, retry);
                circle.appendChild(mark);
            } else if(firstUncompleted == -1) {
                firstUncompleted = (x - this.offset);
            }
        }
        
        if(this.gameManager.allWordsSeen) {
            for(var x=this.offset; x<this.maxCircles + this.offset; x++) {
                const retry = this.gameManager.wordList[x].data == "retry" 
                if(retry) {
                    firstUncompleted = x;
                    break;
                }
            }
        }
        
        if(firstUncompleted != -1) {
            this.circleList[firstUncompleted].classList.add("current");
        
            if(this.gameManager.currentWordIndex != 0 && !this.gameManager.allWordsSeen) {
                this.circleList[firstUncompleted-1].classList.add("animating")
            } else if(this.gameManager.allWordsSeen) {
                this.circleList[firstUncompleted].classList.add("animating");
            }
        }
    }

    addDummy() {
        var dummy = document.createElement("div");
        dummy.classList.add("transparent");
        this.circleContainer.append(dummy);
    }
    
    addCircle() {
        var circle = document.createElement("div");
        this.circleContainer.append(circle);
        this.circleList.push(circle);
        return circle;
    }
}

class InputManager {
    constructor(_inputContainer) {
        this.inputContainer = _inputContainer;
        this.currentInputBoxes = [];
        this.fallZones = [];
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
        if(this.currentInputBoxes.length == 0) {
            return;
        }
        var fallZone = document.createElement("div");
        fallZone.classList.add("fallZone","letters");

        for(var box of this.currentInputBoxes) {
   
            var duration = (Math.random() * 0.1) + 1;
            box.style.animation = `fall ${duration}s ease-in forwards`;
            fallZone.append(box);
        }

        this.inputContainer.appendChild(fallZone);
        this.currentInputBoxes = [];

        this.fallZones.push(fallZone);

        setTimeout(() => {
            this.inputContainer.removeChild(this.fallZones.shift());
        }, 1000 * duration)
    }

    flashGood() {
        for(var box of this.currentInputBoxes) {
            box.style.animation = `success 0.3s ease forwards`;
        }
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

    constructor(_scoreModal, _scoreDisplay, _scoreGrade) {
        this.scoreModal = _scoreModal;
        this.scoreDisplay = _scoreDisplay;
        this.scoreGrade = _scoreGrade;
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
            grade = "S+";
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
        this.scoreDisplay.innerHTML = `${Math.round(this.score)} %`;
        this.scoreGrade.innerHTML = `${grade}`
    }
    
}

class GameManager {
    constructor(gameElements) {
        this.inputManager = new InputManager(gameElements.inputContainer);
        this.audioManager = new AudioManager(gameElements.wordChannel, gameElements.answerChannel);
        this.hintManager = new HintManager(gameElements.hintText); 
        this.scoreManager = new ScoreManager(gameElements.scoreModal, gameElements.scoreText, gameElements.scoreGrade);
        this.circleManager = new CircleManager(gameElements.circleContainer, this);

        this.wordList = [];
        this.wordData = [];

        this.startingWordCount = 0;

        this.wordAddedToBack = false;
        this.currentWordIndex = 0;

        this.gameActive = false;
        this.allWordsSeen = false;
    }
    
    async setupGame(wordList) {
        this.wordList = wordList.map((w) => {
            return {w: w, data: "original"};
        });
        this.startingWordCount = wordList.length;
        await this.audioManager.loadAudioForCurrentGame(wordList);
        this.currentWordIndex = 0;
        this.circleManager.displayCircles();
        this.loadWord();
    }

    nextWord() {
        this.gameActive = false;
        // loadword sets gameactive to true
        this.audioManager.playAnswerSound(true);
        if(this.currentWordIndex < this.wordList.length-1 && !this.allWordsSeen) {
            this.currentWordIndex++;
            setTimeout(() => {
                this.loadWord();
            }, 800);
        } else {
            // if 
            this.allWordsSeen = true;

            var retryWords = this.wordList.filter((word) => {
                return word.data == "retry";
            }).sort((a, b) => {
                return b.index - a.index;
            })



            if(retryWords.length > 0) {
                var retryable = retryWords.pop();
                if(retryable.index == this.lastIndex && retryWords.length > 1) {
                    retryable = retryWords.pop();
                }
                this.currentWordIndex = retryable.index;
                this.lastIndex = retryable.index;
                
                setTimeout(() => {
                    this.loadWord();
                }, 800);
            } else {
                this.completeGame();
            }
        }

        this.circleManager.displayCircles();

    }
    
    loadWord() {
        this.audioManager.setAudioForWord(this.wordList[this.currentWordIndex].w);
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
        if(this.inputManager.getEnteredLetters() == this.wordList[this.currentWordIndex].w) {
            this.hintManager.clearHint();
            this.inputManager.flashGood();
            if(!this.wordAddedToBack) {
                this.wordData[this.currentWordIndex] = true;
            }

            if(this.wordList[this.currentWordIndex].data == "retry" && this.allWordsSeen && !this.wordAddedToBack) {
                this.wordData[this.currentWordIndex] = true;
                this.wordList[this.currentWordIndex].data = "redeemed"; 
            }

            this.nextWord();
            return true;
        }

        if(!this.wordAddedToBack) {
            this.wordList[this.currentWordIndex].data = "retry";
            this.wordList[this.currentWordIndex].index = this.currentWordIndex;
            // var copyWord = {w: this.wordList[this.currentWordIndex].w, data: "retry"}
            // this.wordList.push(copyWord);
            this.wordAddedToBack = true;
        }

        this.wordData[this.currentWordIndex] = false;
        this.audioManager.playAnswerSound(false);
        this.hintManager.displayHint(this.wordList[this.currentWordIndex].w, this.inputManager.getEnteredLetters());
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
        scoreGrade: document.getElementById('scoreGrade'),
        circleContainer: document.getElementById('circleContainer')
    }

    const game = new GameManager(gameElements);

    replayButton.addEventListener('click', () => { gameElements.wordChannel.play(); 
    replayButton.blur()});
    document.addEventListener("keydown", game.onTypeLetter);
    scoreModalButton.addEventListener('click', () => { window.electronAPI.switchPage("MENU") });
    quitButton.addEventListener('click', () => { window.electronAPI.switchPage("MENU") });

    game.setupGame(["barnacle", "python", "alabaster", "gneiss", "basin", "sediment", "shale", "metamorphic"]);
});
