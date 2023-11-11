window.addEventListener('DOMContentLoaded', () => {
    // Set up events
    document.getElementById('backButton').addEventListener('click', () => {
        // Send an IPC message to load the menu
        window.electronAPI.switchPage("GAME");
    });
});