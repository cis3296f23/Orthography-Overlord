const { contextBridge, ipcRenderer } = require('electron')
const fs = require('fs');
const WordDifficultyManager = require('./public/logic/wordDifficulty');

const PAGES = {
    "MENU": "menu.html",
    "GAME": "game.html",
    "SETTINGS": "game.html",    //placeholder
    "CONTINUE": "game.html",    //placeholder
}

function loadDifficulty() {
    let wordDifficultyManager = new WordDifficultyManager();
    let wordSetData;
        try {
            wordSetData = fs.readFileSync('./public/word-sets/words.csv', 'utf-8');
        } catch (error) {
            console.error('Error reading the file:', error);
            return [];
        }
        const words = wordSetData.split(',');
    wordDifficultyManager.calculateWordListDifficulty(words);
}

loadDifficulty();

function switchPage(pagename) {
    if(pagename in PAGES) {
        ipcRenderer.send('load-html', PAGES[pagename]);
    } else {
        console.log(PAGES[pagename]);
        console.log("ERROR: BAD PAGE LOAD!");
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
    loadDifficulty: loadDifficulty,
    fs: fs,
})

