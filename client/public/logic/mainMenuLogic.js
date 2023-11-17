window.addEventListener('DOMContentLoaded', () => {

    const continueButton = document.getElementById('contButton');

    //focus the button but after setting lightning
    setTimeout(function() {
        continueButton.focus();
    }, 100);

    //Enter will click the button
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            continueButton.click();
        }
    });

    continueButton.addEventListener('focus', function() {
        continueButton.classList.add('lightning-effect');
    });

    //No lightning effect when we lose focus
    continueButton.addEventListener('blur', function() {
        continueButton.classList.remove('lightning-effect');
    });


    document.getElementById('startButton').addEventListener('click', () => {
        // Send an IPC message to load the menu
        window.electronAPI.switchPage("GAME");
    });

    document.getElementById('contButton').addEventListener('click', () => {
        // Send an IPC message to load the menu
        window.electronAPI.switchPage("CONTINUE");
    });

    document.getElementById('settingsButton').addEventListener('click', () => {
        // Send an IPC message to load the menu
        window.electronAPI.switchPage("SETTINGS");
    });

});