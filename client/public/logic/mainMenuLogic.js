window.addEventListener('DOMContentLoaded', () => {
    const continueButton = document.getElementById('contButton');
    const startButton = document.getElementById('startButton');
    const settingsButton = document.getElementById('settingsButton');
    const buttons = Array.from(document.querySelectorAll('button'));
    let butNum = 0;


    //===============================================Lightning Effect


    //focus the button but after setting lightning
    setTimeout(function() {
        continueButton.focus();
    }, 100);

    //Enter will click the button
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            buttons[butNum].click();

        //go to next button in the array and focus it when a directional arrow is pressed
        }else if(event.key === 'ArrowDown'){
            //find the index of the currently active button
            butNum = buttons.findIndex(button => document.activeElement === button);
            butNum = (butNum + 1) % buttons.length;
            buttons[butNum].focus();
        }else if(event.key === 'ArrowUp'){
            butNum = buttons.findIndex(button =>document.activeElement === button);
            butNum = (butNum - 1);

            //Go around to the last element from first
            if(butNum === -1){
                butNum = buttons.length-1;
            }else{
                butNum = butNum % buttons.length;
            }
            buttons[butNum].focus();

        }
    });

    //Remove lightning effect when focus is lost
    buttons.forEach(function(button){
        button.addEventListener('blur', function(){
            button.classList.remove('lightning-effect');
        });
    });

    buttons.forEach(function(button){
        button.addEventListener('focus', function() {
                button.classList.add('lightning-effect');
        });
    });


    buttons.forEach(function(button){
        button.addEventListener('mouseover', function(){
            buttons.forEach(function(button) {
                button.blur();
            });
        });
    });




    //=====================================Basic click events for each button

    startButton.addEventListener('click', () => {
        // Send an IPC message to load the menu
        window.electronAPI.switchPage("GAME");
    });

    continueButton.addEventListener('click', () => {
        // Send an IPC message to load the menu
        window.electronAPI.switchPage("CONTINUE");
    });

    settingsButton.addEventListener('click', () => {
        // Send an IPC message to load the menu
        window.electronAPI.switchPage("SETTINGS");
    });

});