const { contextBridge, ipcRenderer } = require('electron')

const PAGES = {
    "MENU": "menu.html",
    "GAME": "game.html",
    "SETTINGS": "game.html",    //placeholder
    "CONTINUE": "game.html",    //placeholder
}

function switchPage(pagename) {
    if(pagename in PAGES) {
        ipcRenderer.send('load-html', PAGES[pagename]);
    } else {
        console.log(PAGES[pagename]);
        console.log("ERROR: BAD PAGE LOAD!");
    }

    // page list... names with html?
    // ipcrenderer send loadpage?
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
})

