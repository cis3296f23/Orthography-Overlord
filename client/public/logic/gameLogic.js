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

class WordDifficultyManager {
    constructor() {
        this.difficulty = 0;
        this.wordmap = new Map();
    }

    calculateWordListDifficulty(wordList) {
        for(var word of wordList) {
            try {
                this.calculateDifficulty(word);
                if(this.wordmap.has(this.difficulty)) {
                    this.wordmap.get(this.difficulty).push(word);
                }
                else{
                    this.wordmap.set(this.difficulty, [word]);
                }
            } catch(e) {
                console.error("Could not read word.", e);
            }
        }
        console.log(this.wordmap);
        for(var key of this.wordmap.keys()) {
            console.log(this.wordmap.get(key));
        }
    }

    calculateDifficulty(currentWord) {
        let length_component = (25*this.wordLengthDifficulty(currentWord));
        let letter_component = (25*this.letterFrequencyCalc(currentWord));
        let consonant_component = (25*this.consonantSequenceCount(currentWord));
        let vowel_component = (25*this.vowelSequenceCount(currentWord));
        this.difficulty = Math.floor(length_component + letter_component + consonant_component + vowel_component);
    }

    wordLengthDifficulty(currentWord) {
        const wordLength = currentWord.length;
        if (wordLength < 10){
            return 0.2;
        }
        else if (wordLength < 20){
            return 0.5;
        }
        else{
            return 1;
        }
    }

    letterFrequencyCalc(currentWord) {
        let totalFrequency = 0;
        let bestFrequency = 0;
        const letterFrequencies = new Map([
            ['a', 8.17],
            ['b', 1.49],
            ['c', 2.78],
            ['d', 4.25],
            ['e', 12.70],
            ['f', 2.23],
            ['g', 2.02],
            ['h', 6.09],
            ['i', 6.97],
            ['j', 0.15],
            ['k', 0.77],
            ['l', 4.03],
            ['m', 2.41],
            ['n', 6.75],
            ['o', 7.51],
            ['p', 1.93],
            ['q', 0.10],
            ['r', 5.99],
            ['s', 6.33],
            ['t', 9.06],
            ['u', 2.76],
            ['v', 0.98],
            ['w', 2.36],
            ['x', 0.15],
            ['y', 1.97],
            ['z', 0.07]
        ]);

        for (let i = 0; i < currentWord.length; i++) {
            totalFrequency += letterFrequencies.get(currentWord[i]);
            bestFrequency += letterFrequencies.get('e');
        }

        return totalFrequency / bestFrequency;
    } 

    consonantSequenceCount(currentWord) {
        const vowels = ['a', 'e', 'i', 'o', 'u'];
        let i = 0
        let seq = 0
        let seqcount = 0;
        while(i < currentWord.length) {
            if(!vowels.includes(currentWord[i])) {
                seq++;
            }
            else{
                seq = 0;
            }

            if(seq >= 3){
                seqcount++;
            }
            i++;
        }
        if(seqcount == 0) {
            return 0;
        }
        else if(seqcount == 1) {
            return 0.25;
        }
        else if(seqcount == 2) {
            return 0.5;
        }
        else {
            return 1;
        }
    }

    vowelSequenceCount(currentWord) {
        const vowels = ['a', 'e', 'i', 'o', 'u'];
        let i = 0
        let seq = 0
        let seqcount = 0;
        while(i < currentWord.length) {
            if(vowels.includes(currentWord[i])) {
                seq++;
            }
            else{
                seq = 0;
            }

            if(seq >= 2){
                seqcount++;
            }
            i++;
        }
        
        if(seqcount == 0) {
            return 0;
        }
        else if(seqcount == 1) {
            return 0.25;
        }
        else if(seqcount == 2) {
            return 0.5;
        }
        else {
            return 1;
        }
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
    constructor(_inputContainer, _wordSound, _hintText, _answerSound) {
        this.inputManager = new InputManager(_inputContainer);
        this.audioManager = new AudioManager(_wordSound, _answerSound);
        this.hintManager = new HintManager(_hintText); 
        this.WordDifficultyManager = new WordDifficultyManager();

        this.wordAddedToBack = false;

        this.wordList = [];
        this.currentWordIndex = 0;
    }
    
    async setupGame(wordList) {
        this.wordList = wordList;
        await this.audioManager.loadAudioForCurrentGame(wordList);
        this.WordDifficultyManager.calculateWordListDifficulty(wordList);
        this.currentWordIndex = 0;
        this.loadWord();
    }

    nextWord() {
        this.audioManager.playAnswerSound(true);
        if(this.currentWordIndex < this.wordList.length-1) {
            this.currentWordIndex++;
            setTimeout(() => {
                this.loadWord();
            }, 800);
        } else {
            window.electronAPI.switchPage("MENU");
        }
    }
    
    loadWord() {
        this.audioManager.setAudioForWord(this.wordList[this.currentWordIndex]);
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
}


window.addEventListener('DOMContentLoaded', () => {
    const replayButton = document.getElementById('replayButton');
    const wordSound = document.getElementById('primaryAudio');
    const hintText = document.getElementById('hintText')
    const inputContainer = document.getElementById('inputContainer');
    const answerSound = document.getElementById('answerSound');
    
    const game = new GameManager(inputContainer, wordSound, hintText, answerSound);

    document.addEventListener("keydown", game.onTypeLetter);

    replayButton.addEventListener('click', () => {
        wordSound.play();
        // Remove focus from the button to prevent automatic triggering on Enter
        replayButton.blur();
    });

    document.getElementById('myButton').addEventListener('click', () => {
        window.electronAPI.switchPage("MENU");
    });

    game.setupGame(["barnacle", "vinegar", "phylum", "melee", "meiosis", "pharaoh"]);
});
