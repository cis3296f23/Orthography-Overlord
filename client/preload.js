const { contextBridge, ipcRenderer } = require('electron')
const fs = require('fs');
const WordDifficultyManager = require('./public/logic/wordDifficulty');
const path = require('path');
const WORDSETPATH = "./public/word-sets/";

// USER SETS WILL BE IN const userpath = app.getPath("userData");
// USE MAIN.JS FOR THIS

const PAGES = {
    "MENU": "menu.html",
    "GAME": "game.html",
    "SETTINGS": "game.html",    //placeholder
    "CONTINUE": "game.html",    //placeholder
}

const WORDSETS = {
    "Food": "foods.csv",
    "Medical Vocabulary": "medical.csv",
    "Geology Vocabulary": "geology.csv",
}

function switchPage(pagename) {
    if(pagename in PAGES) {
        ipcRenderer.send('load-html', PAGES[pagename]);
    } else {
        console.log(PAGES[pagename]);
        console.log("ERROR: BAD PAGE LOAD!");
    }
}

// TODO:::::::::::::::::::::;
// RUN WORD DIFFICULTY CALCULATION HERE
// RETURN SUBSET OF WORDS THAT MATCH DESIRED DIFFICULTY
// AND MOVE THIS FUNCTION TO MAIN.JS
// COMMUNICATE VIA IPC

function loadWordset(wordsetName, difficultyInt) {
    if(wordsetName in WORDSETS) {
        try {
            var pathToSet = path.join(WORDSETPATH, WORDSETS[wordsetName]);
            var set = fs.readFileSync(pathToSet, 'utf-8');
            var data = set.split(',');
            let wordDifficultyManager = new WordDifficultyManager();
            var difficulties = wordDifficultyManager.calculateWordListDifficulty(data);

            // difficulty is 0, 1 or 2
            // (easy, medium, hard);

            if(difficultyInt > 2) {
                difficultyInt = 2;
            } else if(difficultyInt < 0) {
                difficultyInt = 0;
            }

            return difficulties[difficultyInt];
        } catch(e) {
            console.error("Could not read from wordset", wordsetName, WORDSETS[wordsetName], e);
            return [];
        }
    } else {
        return [""];
    }
}

async function loadAudioForWord(word) {
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


// IDEAS:
// GENERIC LOAD-PAGE FUNCTION (LOADS HTML FILE ACCORDING TO ENUM?)

contextBridge.exposeInMainWorld('electronAPI', {
    switchPage: switchPage,
    loadAudioForWord: loadAudioForWord,
    loadWordset: loadWordset,
    availableWordsets: WORDSETS
})

