class CircleManager {
    constructor(_circleContainer, _gameManager) {
        this.circleContainer = _circleContainer
        this.gameManager = _gameManager
        this.maxCircles = 40;
        this.offsetAmount = 1;
        this.offset = 0;
        this.circleList = [];
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

    initializeCircles() {
        this.circleList = [];
        this.circleContainer.innerHTML = "";

        for(var x=0; x<Math.min(this.gameManager.wordList.length - this.offset, this.maxCircles); x++) {
            this.addCircle();
        }
    }

    displayCircles() {
        if(this.circleList.length == 0) {
            this.initializeCircles();
        }

        const lookAheadIndex = this.gameManager.currentWordIndex + this.offsetAmount;

        if(this.gameManager.currentWordIndex < this.offset) {
            if(this.gameManager.currentWordIndex == 0) {
                this.offset = 0;
            } else {
                this.offset = this.gameManager.currentWordIndex -1;
            }

            this.initializeCircles();
        } else if(lookAheadIndex > this.offset+this.maxCircles) {
            if(this.gameManager.currentWordIndex > this.offset+this.offsetAmount) {
                this.offset = this.gameManager.currentWordIndex-1;
            } else {
                this.offset += this.offsetAmount;
            }

            this.initializeCircles();
        }

        var subset = this.gameManager.wordList.slice(this.offset, this.offset+this.maxCircles);
        var currentIndexInSubset = this.gameManager.currentWordIndex - this.offset;

        for(var word of subset) {
            const redeemable = word.displayAsRedeemedWord;
            const seen = word.seen;
            const success = word.firstTried;
            
            const circle = this.circleList[subset.indexOf(word)];
            if(circle.classList.contains("animating")) {
                circle.classList = "";
                circle.classList.add("animating");
            } else {
                circle.classList = "";
            }

            circle.innerHTML = "";

            if(redeemable) { circle.classList.add("retry"); }
            
            if(seen) {
                circle.classList.add(success ? "complete" : "failed")
                var mark = this.makeMark(success, redeemable);
                circle.appendChild(mark);
            }
        }
        
        this.circleList[currentIndexInSubset].classList.add("current");
    }

    flashCurrentCircle() {
        var currentIndexInSubset = this.gameManager.currentWordIndex - this.offset;
        console.log(currentIndexInSubset);
        this.circleList[currentIndexInSubset].classList.add("animating");
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

    async loadAudioForCurrentGame(wordList, requiredCount) {
        var validWordlist = [];

        for(var w of wordList) {
            if(validWordlist.length == requiredCount) {
                break;
            }
            try {
                var filename = await this.loadAudio(w);
                this.loadedAudio[w] = filename;
                validWordlist.push(w);
            } catch(e) {
                console.error("Could not load a file.", e);
            }
        }

        return validWordlist;
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

    playGameFinishSound() {
        const gameFinishSound = document.getElementById('winGameSound');
        setTimeout(function() {
            gameFinishSound.volume = 0.7;
            gameFinishSound.play();
        }, 1000);
    }
}

class HintManager {
    constructor(_hintDisplay) {
        this.hintDisplay = _hintDisplay;
        this.hintsForCurrentWord = 0;
        // map to word later
        this.hintHistory = {};
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
        let hint = this.hintConstructor(currentWord, userInput);
        this.hintDisplay.innerHTML = "Hint: " + hint;
        (currentWord in this.hintHistory)? this.hintHistory[currentWord]++ : this.hintHistory[currentWord]=1;
    }

    clearHint() {
        this.hintsForCurrentWord = 0;
        this.hintDisplay.innerHTML = ""
    }

}

class ScoreManager {

    constructor(_scoreModal,_scoreModalWrapper ,_scoreDisplay, _scoreGrade, _finalTime) {
        this.scoreModal = _scoreModal;
        this.scoreModalWrapper = _scoreModalWrapper;
        this.scoreDisplay = _scoreDisplay;
        this.scoreGrade = _scoreGrade;
        this.finalTime = _finalTime;
        this.score = 100;
    }
    
    calculateAndDisplayScore(hintHistory, wordCount, finishTimeString) {
        var perWordScore = 100 / wordCount;

        for(let hints of Object.values(hintHistory)) {
            switch(hints) {
                case 0:
                    break;
                case 1:
                    this.score -= 0.2 * perWordScore;
                    break;
                case 2: 
                    this.score -= 0.5 * perWordScore;
                    break;
                case 3:
                    this.score -= 0.9 * perWordScore;
                    break;
                default:
                    this.score -= perWordScore;
            }
        }

        var grade = "F-";
        if(this.score == 100) {
            grade = "S+";
        } else if(this.score > 90) {
            grade = "A";
        } else if(this.score > 85) {
            grade = "B+";
        } else if(this.score > 80) {
            grade = "B";
        } else if(this.score > 75) {
            grade = "C+";
        } else if (this.score > 70) {
            grade = "C"
        } else if (this.score > 60) {
            grade = "D+"
        } else if (this.score > 50) {
            grade = "D"
        } else if (this.score >25) {
            grade = "F"
        }

        this.scoreModalWrapper.classList.toggle("hidden");
        this.scoreDisplay.innerHTML = `${Math.round(this.score)} %`;
        this.scoreGrade.innerHTML = `${grade}`
        if (this.finalTime) {
            this.finalTime.innerHTML = finishTimeString;
        }
        this.scoreModal.classList.add("show");
    }
    
}

class WordQueueManager {
    constructor(_wordsetName, _wordsetDifficulty) {
        this.wordsetName = _wordsetName
        this.wordsetDifficulty = _wordsetDifficulty;
        this.wordQueue = []
    }
    fillWordQueue(arraySize) {
        this.wordQueue = this._getRandomWordQueue(arraySize);
        console.log("Word queue for current game:");
        console.log(this.wordQueue);
        return this.wordQueue;
    }

    _getRandomWordQueue(arraySize) {
        const words = window.electronAPI.loadWordset(this.wordsetName, this.wordsetDifficulty);
        console.log(words);
        const actualArraySize = Math.min(arraySize, words.length);
        const shuffledWords = this._shuffleArray(words);

        return shuffledWords.slice(0, actualArraySize);
    }

    _shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

class timerManager {
    constructor(timerDisplay) {
        this.startTime = 0;
        this.isRunning = false;
        this.interval_id = null;
        this.timerDisplay = timerDisplay;
    }
    
    startTimer() {
        if (!this.isRunning) {
        this.startTime = Date.now() - (this.elapsedTime || 0);
        this.isRunning = true;
    
        this.interval_id = setInterval(() => {
            this._updateDisplay();
        }, 50); // update display every 50 ms (20 fps)
        }
    }
    
    stopTimer() {
        if (this.isRunning) {
            clearInterval(this.interval_id);
            this.elapsedTime = Date.now() - this.startTime;
            this.isRunning = false;
        }
        return this.timerDisplay.textContent;
    }
    
    _updateDisplay() {
        const elapsedTime = Date.now() - this.startTime;
        const minutes = Math.floor(elapsedTime / (60 * 1000));
        const seconds = Math.floor((elapsedTime % (60 * 1000)) / 1000);
        const centiseconds = Math.floor((elapsedTime % 1000) / 10);
    
        const displayString = `${this._formatTimeComponent(minutes)}:${this._formatTimeComponent(seconds)}.${this._formatTimeComponent(centiseconds)}`;
        this.timerDisplay.textContent = displayString;
    }
    
    _formatTimeComponent(value) {
        return value < 10 ? `0${value}` : value;
    }
}

class GameManager {
    constructor(gameElements) {
        if (gameElements.timerDisplay!=null) {
            this.timerManager = new timerManager(gameElements.timerDisplay);
        }

        this.inputManager = new InputManager(gameElements.inputContainer);
        this.audioManager = new AudioManager(gameElements.wordChannel, gameElements.answerChannel);
        this.hintManager = new HintManager(gameElements.hintText); 
        this.scoreManager = new ScoreManager(gameElements.scoreModal, gameElements.scoreModalWrapper, gameElements.scoreText, gameElements.scoreGrade, gameElements.finalTime);
        this.circleManager = new CircleManager(gameElements.circleContainer, this);
        this.wordQueueManager = new WordQueueManager(gameElements.wordsetName, gameElements.wordsetDifficulty);

        this.wordList = [];

        this.wordAddedToBack = false;
        this.currentWordIndex = 0;

        this.gameActive = true;
        this.inRetryStage = false;
    }
    
    async setupGame(numWords) {
        const wordList = this.wordQueueManager.fillWordQueue(numWords+10);
        // include some backup words
        var validWords = await this.audioManager.loadAudioForCurrentGame(wordList);
        validWords = validWords.slice(0, numWords);

        this.wordList = validWords.map((w) => {
            return {
                word: w.toLowerCase(), 
                needsRetry: false, 
                displayAsRedeemedWord: false,
                firstTried: false, 
                seen: false
            };
        });

        document.getElementById("loadingBlurb").classList.add("hidden");
        this.currentWordIndex = 0;
        this.circleManager.displayCircles();
        this.loadWord();
        if (this.timerManager) {
            this.timerManager.startTimer();
        }
    }

    fillRetryableWordList() {
        this.retryWords = this.wordList.filter((word) => { return word.needsRetry; });
        for(var word of this.wordList) {
            word.needsRetry = false;
        }
    }

    nextWord() {
        this.gameActive = false;
        this.circleManager.flashCurrentCircle();

        if(!this.inRetryStage && this.currentWordIndex >= this.wordList.length-1) {
            this.inRetryStage = true;
            this.fillRetryableWordList();
        }

        if(!this.inRetryStage) {
            this.currentWordIndex++;
            setTimeout(() => { this.loadWord(); this.gameActive = true; }, 800);
        } else {

            if(this.retryWords.length == 0) {
                // done with this list. can we get more?
                this.fillRetryableWordList();
            }

            var retryable = this.retryWords.shift() || -1;
            console.log(retryable);

            if(retryable == -1) {
                this.completeGame();
            } else {
                this.currentWordIndex = this.wordList.indexOf(retryable);
                setTimeout(() => { this.loadWord(); this.gameActive = true;}, 800);
            }
        }

        this.circleManager.displayCircles();

    }
    
    loadWord() {
        var currentWord = this.wordList[this.currentWordIndex];
        this.audioManager.setAudioForWord(currentWord.word);
        currentWord.seen = true;
        this.inputManager.clearInput();
        this.wordAddedToBack = false;
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
        var currentWord = this.wordList[this.currentWordIndex];

        // user guessed successfully
        if(this.inputManager.getEnteredLetters() == currentWord.word) {
            this.audioManager.playAnswerSound(true);
            this.hintManager.clearHint();
            this.inputManager.flashGood();

            // did the user guess first try?
            if(!currentWord.needsRetry) {
                currentWord.firstTried = true;
            }

            this.nextWord();
            return true;
        }

        // user failed.
        currentWord.needsRetry = true;
        currentWord.displayAsRedeemedWord = true;
        this.audioManager.playAnswerSound(false);
        this.hintManager.displayHint(currentWord.word, this.inputManager.getEnteredLetters());
        this.inputManager.clearInput();

        return false;
    }

    completeGame() {
        const finalTime = (this.timerManager)? this.timerManager.stopTimer():0;
        this.scoreManager.calculateAndDisplayScore(this.hintManager.hintHistory, this.wordList.length, finalTime);
        this.audioManager.playGameFinishSound();
    }
}


window.addEventListener('DOMContentLoaded', async () => {
    // GAME SETTINGS
    let numWords = 5; 
    let timerOn = true;
    let selectedDifficulty = 0;

    const wordsetSelectionMenu = document.getElementById("wordsetSelector");
    for(var wordset of Object.keys(window.electronAPI.availableWordsets)) {
        const option = document.createElement("option");
        option.value = wordset;
        option.innerHTML = wordset;
        wordsetSelectionMenu.appendChild(option);
    }

    // Event listeners for keyboard navigation of the game settings
    const wordsRadioButtons = document.querySelectorAll('input[name="numWords"]');
    const timerRadioButtons = document.querySelectorAll('input[name="timedMode"]');
    const radioButtonsArr = [wordsRadioButtons, timerRadioButtons]
    let currentRadioButtons = wordsRadioButtons
    function handleKeyPress(event) {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            const currentIndex = Array.from(currentRadioButtons).findIndex(button => button.checked);
            const offset = (event.key === 'ArrowRight') ? 1 : -1;
            const nextIndex = (currentIndex + offset + currentRadioButtons.length) % currentRadioButtons.length;
            currentRadioButtons[nextIndex].checked = true;
        }
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            const currentIndex = radioButtonsArr.indexOf(currentRadioButtons);
            const offset = (event.key === 'ArrowDown') ? 1 : -1;
            const nextIndex = (currentIndex + offset + radioButtonsArr.length) % radioButtonsArr.length;
            currentRadioButtons = radioButtonsArr[nextIndex]
        }
    }
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            document.getElementById('continueButton').click();
        }
    });
    // Event listeners for going back to main menu
    const switchToMenu = () => {
        window.electronAPI.switchPage("MENU");
    };
    const settingsQuitButton = document.getElementById('settingsQuitButton');
    settingsQuitButton.addEventListener('click', switchToMenu);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' || event.code === 'Escape') {
            switchToMenu();
        }
    });

    // Create a promise that will be resolved when the continueButton is clicked
    const continuePromise = new Promise(resolve => {
        const continueButton = document.getElementById('continueButton');
        continueButton.addEventListener('click', function () {
            const numWordsOptions = document.getElementsByName("numWords");
            for (const numWordsOption of numWordsOptions) {
                if (numWordsOption.checked) {
                    numWords = parseInt(numWordsOption.value);
                    break;
                }
            }
            const difficulty = document.getElementById("difficulty");
            selectedDifficulty = difficulty.value;
            console.log(selectedDifficulty)
            const timedModeOptions = document.getElementsByName("timedMode")
            for (const timedModeOption of timedModeOptions) {
                if (timedModeOption.checked) {
                    timerOn = (timedModeOption.value == "on")? true:false;
                }
            }
            if (timerOn) {
                document.getElementById('timerWrapper').classList.remove('hidden');
            } else {
                document.getElementById("scoreAndTimerModal").classList.add("hidden");
                document.getElementById("scoreModal").classList.remove("hidden")
            }

            document.getElementById('gameSettings').style.display = 'none';
            document.getElementById('circleContainer').classList.remove('hidden');
            document.getElementById('topDisplayWrapper').classList.remove('hidden');
            document.getElementsByClassName('typezone')[0].classList.remove('hidden');

            // Remove the keyboard event listener
            document.removeEventListener('keydown', handleKeyPress);
            resolve();
        });
    });
    // Wait for the promise to be resolved before continuing
    await continuePromise;

    const gameElements = {
        hintText: document.getElementById('hintText'),
        inputContainer: document.getElementById('inputContainer'),
        wordChannel: document.getElementById('primaryAudio'),
        answerChannel: document.getElementById('answerSound'),
        scoreModalWrapper: document.getElementById('scoreModalWrapper'),
        scoreText: document.getElementById('scoreText'),
        circleContainer: document.getElementById('circleContainer'),

        scoreModal: timerOn? document.getElementById('scoreAndTimerModal'): document.getElementById('scoreModal'),
        scoreGrade: timerOn? document.getElementById('scoreAndTimerGrade'): document.getElementById('scoreGrade'),
        scoreText: timerOn? document.getElementById('scoreAndTimerText'): document.getElementById('scoreText'),
        timerDisplay: timerOn? document.getElementById('timerDisplay'):null,
        finalTime: timerOn? document.getElementById('timerText'):null,
        // should change wordSetPath the directory of the word sets and add functionality to select a word set
        wordsetName: wordsetSelectionMenu.value,
        wordsetDifficulty: selectedDifficulty,
    }
    const game = new GameManager(gameElements);

    const replayButton = document.getElementById('replayButton');
    const quitButton = document.getElementById('quitButton');
    const scoreModalButton = document.getElementById('scoreModalButton');

    replayButton.addEventListener('click', () => { gameElements.wordChannel.play(); 
    replayButton.blur()});
    document.addEventListener("keydown", game.onTypeLetter);
    scoreModalButton.addEventListener('click', switchToMenu);
    quitButton.addEventListener('click', switchToMenu);

    game.setupGame(numWords);
});
