// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const path = require('node:path')
const axios = require('axios');
const fs = require('fs');
const userpath = app.getPath("userData");
const API_ADDRESS = "http://157.245.136.109:3050";
// const API_ADDRESS = "http://localhost:3050";

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
    },
    autoHideMenuBar: true,
  })

  mainWindow.setFullScreen(true);

  mainWindow.loadFile('menu.html')
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

function download(response, path) {
  const writer = fs.createWriteStream(path)
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
    })
}

//pipe back response over event

async function retrieveAudioFileForWord(event, word) {
  const url = `${API_ADDRESS}/audio/${word}`
  // const url = `https://dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=fa42b88d-7476-4683-8554-836973c63ab2`;
  const filename = path.join(userpath, `${word}.mp3`);

  if(fs.existsSync(filename)) {
    console.log("Audio file has already been downloaded.");
    event.reply("dictionary-data-response", filename);
    return;
  }



  try {
    const response = await axios.get(url);
    console.log(response);
    if(response.status == 404) {
      event.reply("dictionary-error-response", "404, word not found");
      return;
    }

    const audioStream = await axios.get(url, { responseType: 'stream' });
    
    download(audioStream, filename)
    .then((_) => {
    
    // await audioStream.data.pipe(fs.createWriteStream(filename));
      event.reply("dictionary-data-response", filename);
    })
    .catch((err) => {
      console.err("dL ERR");
    })

  } catch(err) {
    console.error(err);
    console.log("AUD ERR", err)
    event.reply("dictionary-error-response", JSON.stringify(err));
  }
}

/* This function retrieves the word's data from the server, stores it in a
* a user file and sends the location of that file to the preload for exposure
* in the main world                                                           */
async function retrieveDefinitionFileForWord(event, word) {

  console.log("Main.js Test: 'retrieveDef #1'");

  //words location on server, if present
  const serverLoc = `${API_ADDRESS}/def/${word}`

  //otherwise get from
  try {
    //get stream for word on server
    const def = await axios.get(serverLoc);
    event.reply("definition-data-response", JSON.stringify(def.data));
  } catch(err) {
    console.error(err);
    console.log("DEF ERR", err);
    event.reply("defintion-error-response", JSON.stringify(err));
  }
}


function loadHTML(event, filename) {
  const win = BrowserWindow.getFocusedWindow();
  win.loadFile(path.join(__dirname, filename));
}


ipcMain.on("make-definition-request", retrieveDefinitionFileForWord);
ipcMain.on("make-dictionary-request", retrieveAudioFileForWord);

ipcMain.on('load-html', loadHTML);
ipcMain.on("get-user-path", (event) => { event.reply("user-path-response", app.getPath("userData"))})
