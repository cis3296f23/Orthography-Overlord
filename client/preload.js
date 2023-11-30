const { contextBridge, ipcRenderer } = require('electron')
const fs = require('fs');
const WordDifficultyManager = require('./public/logic/wordDifficulty');
const path = require('path');
const WORDSETPATH = "./public/word-sets/";
var USERDATAPATH = "";



// USER SETS WILL BE IN const userpath = app.getPath("userData");
// USE MAIN.JS FOR THIS

const PAGES = {
    "MENU": "menu.html",
    "GAME": "game.html",
    "SETTINGS": "game.html",    //placeholder
    "CONTINUE": "game.html",    //placeholder
}

var wordsets = {};

function getWordsets() {
    return new Promise((resolve, reject) => {
        getUserPath().then((userpath) => {
            // get preset paths
            var files = fs.readdirSync(path.join(__dirname, WORDSETPATH));
            console.log(files);
            files.forEach(file => {
                console.log(file);
                console.log(file.split('.').pop());
                if(file.split('.').pop() == "csv") {
                    console.log(file.split('.')[0])
                    wordsets[file.split('.')[0]] = path.join(WORDSETPATH, file);
                }
            });

            // loading user files
            console.log("looking for user's stuff");
            console.log(path.join(userpath, "/wordsets"));
            if(fs.existsSync(path.join(userpath, "/wordsets"))) {
                var files = fs.readdirSync(path.join(userpath,"/wordsets"));
                console.log(files);
                files.forEach(file => {
                    console.log(file);
                    console.log(file.split('.').pop());
                    if(file.split('.').pop() == "csv") {
                        console.log(file.split('.')[0])
                        wordsets[file.split('.')[0]] = path.join(userpath+"/wordsets", file);
                    }
                });
            }

            resolve(wordsets);
        });
    });
}

function switchPage(pagename) {
    if(pagename in PAGES) {
        ipcRenderer.send('load-html', PAGES[pagename]);
    } else {
        console.log(PAGES[pagename]);
        console.log("ERROR: BAD PAGE LOAD!");
    }
}

function loadWordset(wordsetName, difficultyInt) {
    if(wordsetName in wordsets) {
        try {
            var pathToSet = wordsets[wordsetName];
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
            console.error("Could not read from wordset", wordsetName, wordsets[wordsetName], e);
            return [];
        }
    } else {
        return [""];
    }
}

//loadAudioforword copy paste
//call main.js to get request

async function loadDefForWord(word) {
    return new Promise((resolve, reject) => {

        ipcRenderer.send("make-definition-request", word);

        ipcRenderer.on('definition-data-response', (event, def) => {
            resolve(def);
        });

        ipcRenderer.on('definition-error-response', (event, error) => {
            reject(error);
        });
    })
}

function getUserPath() {
    return new Promise((resolve, reject) => {

        if(USERDATAPATH != "") {
            resolve(USERDATAPATH);
        }

        ipcRenderer.send("get-user-path");

        ipcRenderer.on('user-path-response', (event, path) => {
            // sound.src = filename;
            resolve(path);
        });
    })
}

function loadAudioForWord(word) {   
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

getWordsets().then(() => {
    contextBridge.exposeInMainWorld('electronAPI', {
        switchPage: switchPage,
        loadAudioForWord: loadAudioForWord,
        loadWordset: loadWordset,
        loadDefForWord: loadDefForWord,
        wordsets: wordsets
    })
});

