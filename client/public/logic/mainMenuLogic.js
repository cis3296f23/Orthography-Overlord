window.addEventListener('DOMContentLoaded', () => {
    const continueButton = document.getElementById('contButton');
    const startButton = document.getElementById('startButton');
    const tutorialButton = document.getElementById('tutorialButton');
    const buttons = Array.from(document.getElementsByClassName("menuButton"));
    let butNum = 0;
    let allowTutorialKeys = false;
    let allowMenuKeys = true;

    //===============================================Lightning Effect


    //focus the button but after setting lightning
    setTimeout(function() {
        continueButton.focus();
    }, 100);

    function handleMenuKeyPresses(event) {
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
    }

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
        if (!allowMenuKeys) return;
        // Send an IPC message to load the menu
        window.electronAPI.switchPage("GAME");
    });

    continueButton.addEventListener('click', () => {
        if (!allowMenuKeys) return;
        // Send an IPC message to load the menu
        window.electronAPI.switchPage("CONTINUE");
    });

    const slideshowWrapper = document.getElementById("slideshow-wrapper");
    tutorialButton.addEventListener('click', () => {
        if (!allowMenuKeys) return;
        buttons.forEach(function(button) {
            button.blur();
        });
        slideshowWrapper.style.display = 'block';
        allowMenuKeys = false;
        allowTutorialKeys = true;
    });

    // tutorial buttons
    const slides = Array.from(document.getElementsByClassName('slide'));
    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('visible', i === index);
        });
    }

    function nextSlide() {
        if (currentSlide < slides.length - 1) {
            currentSlide++;
            showSlide(currentSlide);
        }
    }

    function prevSlide() {
        if (currentSlide > 0) {
            currentSlide--;
            showSlide(currentSlide);
        }
    }
    function closeTutorial() {
        slideshowWrapper.style.display = 'none';
        allowMenuKeys = true;
        allowTutorialKeys = false;
    }


    function handleTutorialKeyPress(event) {
        switch (event.key) {
            case "ArrowRight":
                nextSlide();
                break;
            case "ArrowLeft":
                prevSlide();
                break;
            case "Escape":
                closeTutorial();
                break;
        }
    }
    

    document.getElementById('nextSlide').addEventListener('click', nextSlide);
    document.getElementById('prevSlide').addEventListener('click', prevSlide);
    document.addEventListener('keydown', (event) => {
        if (allowMenuKeys) {
            handleMenuKeyPresses(event)
        } 
        if (allowTutorialKeys) {
            handleTutorialKeyPress(event)
        }
    });

    document.getElementById("closeTutorial").addEventListener("click", () => {
        if (allowTutorialKeys) {
            closeTutorial()
        }
    });

});
