let timer_start, timer_game, timer_finish, timer_time, timer_hide, letters, difficulty, valid_keys, timerStart, maxErrors, time;
let missKeys = 0;
let game_started = false;

const sleep = (ms, fn) => {
    return setTimeout(fn, ms);
};

const random = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

function playSound(snd, vol) {
    document.getElementById(snd).load();
    document.getElementById(snd).volume = vol;
    document.getElementById(snd).play();
  }

function setDifficulty(diff) {                                  // This is where you can adjust the difficulty of the hack. 
    if (diff === 'easy') {
        difficulty = ["qwerasdf", 900, 600, 'easy']; // Value '900' is the amount of time it takes for the letter to go from bottom to top of the hack. Value '600' is the amount of time between the appearance of new letters.
    } else if (diff === 'medium') {
        difficulty = ["qwerasdf", 800, 500, 'medium'];
    } else if (diff === 'hard') {
        difficulty = ["qwerasdf", 800, 400, 'hard'];
    } else {
        console.error("Invalid difficulty level:", diff);
        return;
    }
    console.log("Difficulty set to:", diff);
}

document.addEventListener("keydown", function(ev) {
    let key_pressed = ev.key.toLowerCase();
    if (game_started && valid_keys.includes(key_pressed)) {
      let element = letters[0].el;
      let top = -590 * element.dataset.progress;
      if (top < -475 && top > -580 && key_pressed === element.textContent) {
        letters[0].el.classList.add('green');
        playSound('audiocorrect', 0.5); // correct input sound
      } else {
        missKeys += 1;
        if (maxErrors <= missKeys) {
          stopGame();
        }
        letters[0].el.classList.add('red');
        playSound('audiowrong', 0.5); // wrong input sound
      }
        
        letters[0].stop();
        
        new mojs.Html({
            el: element,
            y: top,
            opacity: {
                1:0,
                duration: 500,
            },
            duration: 500,
            onComplete() {
                element.remove();
            },
        }).play();
        letters.splice(0,1);
    }
});

let createLetter = () => {
    let pos = random(1,4);
    let lettersElem = document.querySelector('.minigame .letters');
    let div = document.createElement('div');
    div.classList.add('letter', 'pos'+pos);
    div.innerHTML = difficulty[0].charAt(random(0, difficulty[0].length - 1));
    lettersElem.append(div);
    let duration = difficulty[1];
    let lettersCnt = letters.length;
    letters.push(new mojs.Html({
        el: div,
        y: {
            0:-590,
            duration: duration,
            easing: 'linear.none',
            onProgress (p) {
                div.dataset.progress = p;
            },
        },
        opacity: {
            0:1,
            duration: 200,
            easing: 'linear.none'
        },
        duration: duration,
        onComplete() {
            div.classList.add('red');
            missKeys += 1;
            if (maxErrors <= missKeys) {
                stopGame(false);
            }
            letters.splice(0,1);
        },
        onUpdate() {
            if(game_started === false) this.pause();
        }
    }));
    
    letters[lettersCnt].then({
        opacity: 0,
        duration: 500,
        onComplete() {
            div.remove();
        },
    }).play()
}

function start() {
    document.querySelector('.minigame .splash').classList.remove('hidden');
    document.querySelector('.minigame').classList.remove('hidden');
    playSound('audiostart', 0.5);
    timer_start = sleep(5100, function() {
        document.querySelector('.minigame .splash').classList.add('hidden');
        document.querySelector('.minigame .hack').classList.remove('hidden');    
        
        missKeys = 0;
        maxErrors = 3;
        
        valid_keys = difficulty[0].split('');
        letters = [];
        game_started = true;
        timer_game = setInterval(createLetter, difficulty[2]);
        timer_finish = sleep((time * 1000), function() {
            if (game_started) {
                stopGame(true);
            }            
        });
    });
}

function resetEverything() {
    game_started = false;

    clearLetters();
    resetTimer();
    clearTimeout(timer_start);
    clearTimeout(timer_game);
    clearTimeout(timer_finish);
    clearTimeout(timer_hide);
    
    document.querySelector('.minigame .splash').classList.add('hidden');
    document.querySelector('.minigame').classList.add('hidden');
}

function clearLetters() {
    let lettersElem = document.querySelector('.minigame .letters');
    letters.forEach(letter => {
        letter.stop();
    });
    letters = [];
    while (lettersElem.firstChild) {
        lettersElem.removeChild(lettersElem.firstChild);
    }
}

function stopGame(status) {
    game_started = false;
    resetTimer();
    clearTimeout(timer_start);
    clearTimeout(timer_game);
    clearTimeout(timer_finish);
    clearTimeout(timer_hide);
    if (status) {
        document.querySelector('.minigame .hack').classList.add('hidden');
        document.querySelector('.minigame .splash').classList.remove('hidden');
        document.querySelector('.minigame .text').innerHTML = 'Access Granted';
        playSound('audiofinish', 0.5);
    } else {
        document.querySelector('.minigame .hack').classList.add('hidden');
        document.querySelector('.minigame .splash').classList.remove('hidden');
        document.querySelector('.minigame .text').innerHTML = 'Access Denied';
        playSound('audiofail', 0.5);
    }
    setTimeout(function() { 
        resetEverything();
        if (status) {
            $.post(`https://${GetParentResourceName()}/callback`, JSON.stringify({ 'success': status }));
        } else {
            $.post(`https://${GetParentResourceName()}/callback`, JSON.stringify({ 'fail': status }));
        }
    }, 4000);
}

function startTimer(){
    timerStart = new Date();
    timer_time = setInterval(timer,1);
}

function timer() {
    let timerNow = new Date();
    let timerDiff = new Date();
    timerDiff.setTime(timerNow - timerStart);
    let ms = timerDiff.getMilliseconds();
    let sec = timerDiff.getSeconds();
    if (ms < 10) {ms = "00"+ms;}else if (ms < 100) {ms = "0"+ms;}
}

function stopTimer() {
    clearInterval(timer_time);
}

function resetTimer() {
    clearInterval(timer_time);
}

window.addEventListener('message', (event) => {
    if (event.data.action === 'open') {
        setDifficulty(event.data.difficulty);
        time = event.data.timer;
        start();
    }
});

document.addEventListener("keydown", function(ev) {
    let key_pressed = ev.key;
    let valid_keys = ['Escape'];

    if (game_started && valid_keys.includes(key_pressed)) {
        switch (key_pressed) {
            case 'Escape':
                stopGame(false);
                $.post(`https://${GetParentResourceName()}/callback`, JSON.stringify({ 'fail': false }));
                break;
        }
    }
});
