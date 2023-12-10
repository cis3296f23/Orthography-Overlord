class WordDifficultyManager {
    constructor() {
        this.wordmap = {};
        this.easy = [];
        this.medium = [];
        this.hard = [];
    }

    calculateWordListDifficulty(wordList) {
        for(var word of wordList) {
            
            word = word.toLowerCase();
            let regex = /^[a-z]+$/
            if(!regex.test(word)) {
                continue;
            }

            var difficulty = this.calculateDifficulty(word);
            if(difficulty in this.wordmap) {
                this.wordmap[difficulty].push(word);
            }
            else{
                this.wordmap[difficulty] = [word];
            }
        }
        // console.log(this.wordmap);
        for(const key in this.wordmap) {
            if(key < 17){
                this.easy.push(...this.wordmap[key]);
            }
            else if(key < 22){
                this.medium.push(...this.wordmap[key]);
            }
            else{
                this.hard.push(...this.wordmap[key]);
            }
        }  
        console.log(this.easy);
        console.log(this.medium);
        console.log(this.hard);
        return [this.easy, this.medium, this.hard];
    }

    calculateDifficulty(currentWord) {
        let length_component = (25*this.wordLengthDifficulty(currentWord));
        let letter_component = (25*this.letterFrequencyCalc(currentWord));
        let consonant_component = (25*this.consonantSequenceCount(currentWord));
        let vowel_component = (25*this.vowelSequenceCount(currentWord));
        return Math.floor(length_component + letter_component + consonant_component + vowel_component);
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
        
        const letterFrequencies = {
            'a': 8.17,
            'b': 1.49,
            'c': 2.78,
            'd': 4.25,
            'e': 12.70,
            'f': 2.23,
            'g': 2.02,
            'h': 6.09,
            'i': 6.97,
            'j': 0.15,
            'k': 0.77,
            'l': 4.03,
            'm': 2.41,
            'n': 6.75,
            'o': 7.51,
            'p': 1.93,
            'q': 0.10,
            'r': 5.99,
            's': 6.33,
            't': 9.06,
            'u': 2.76,
            'v': 0.98,
            'w': 2.36,
            'x': 0.15,
            'y': 1.97,
            'z': 0.07
        };

        for (let i = 0; i < currentWord.length; i++) {
            totalFrequency += letterFrequencies[currentWord[i]];
            bestFrequency += letterFrequencies.e;
        }

        return 1 - (totalFrequency / bestFrequency);
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

module.exports = WordDifficultyManager;