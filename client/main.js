// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const axios = require('axios');
const fs = require('fs');
const userpath = app.getPath("userData");

// **************
// ELECTRON SETUP
// **************

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  })

  mainWindow.loadFile('menu.html')


  // mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
 

// **************************
// ORTHOGRAPHY OVERLORD LOGIC
// **************************


async function retrieveAudioFileForWord(event, word) {
  const url = `https://dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=fa42b88d-7476-4683-8554-836973c63ab2`;
  const filename = path.join(userpath, `${word}.mp3`);

  if(fs.existsSync(filename)) {
    console.log("Audio file has already been downloaded.");
    event.reply("dictionary-data-response", filename);
    return;
  }

  try {
    const res = await axios.get(url);
    console.log(res.data[0].hwi.prs[0]);
    const audioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${word[0]}/${res.data[0].hwi.prs[0].sound.audio}.mp3`;
    const audioStream = await axios.get(audioUrl, {
      responseType: 'stream',
    });
    await audioStream.data.pipe(fs.createWriteStream(filename));
    event.reply("dictionary-data-response", filename);
  } catch(err) {
    console.error(err);
    event.reply("dictionary-error-response", JSON.stringify(err));
  }
}


function loadHTML(event, filename) {
  const win = BrowserWindow.getFocusedWindow();
  win.loadFile(path.join(__dirname, filename));
}


// declare new event listener
ipcMain.on("make-dictionary-request", retrieveAudioFileForWord);

ipcMain.on('load-html', loadHTML);
