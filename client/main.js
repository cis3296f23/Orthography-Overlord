
// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const axios = require('axios');
const fs = require('fs');

const userpath = app.getPath("userData");

// declare new event listener
ipcMain.on("make-dictionary-request", async (event, word) => {
 	const win = BrowserWindow.getFocusedWindow();
  var url = `https://dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=fa42b88d-7476-4683-8554-836973c63ab2`;

  try {
    const res = await axios.get(url);
    const audioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${word[0]}/${res.data[0].hwi.prs[0].sound.audio}.mp3`;
    const filename = path.join(userpath, `${res.data[0].hwi.prs[0].sound.audio}.mp3`);
    
    const audioStream = await axios.get(audioUrl, {
      responseType: 'stream',
    });

    await audioStream.data.pipe(fs.createWriteStream(filename));

    event.reply("dictionary-data-response", filename);

  } catch(err) {
    console.log(err);
    event.reply("dictionary-error-response", JSON.stringify(err));
  }
})

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  ipcMain.on('load-menu', (event, data) => {
    mainWindow.loadFile(path.join(__dirname, 'menu.html'));
  });
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.