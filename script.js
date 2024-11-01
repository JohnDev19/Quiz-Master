        const categoryScreen = document.getElementById('category-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const questionElement = document.getElementById('question');
const optionsElement = document.getElementById('options');
const progressElement = document.getElementById('progress');
const restartBtn = document.getElementById('restart-btn');
const hintBtn = document.getElementById('hint-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const restartPopup = document.getElementById('restart-popup');
const restartConfirm = document.getElementById('restart-confirm');
const restartCancel = document.getElementById('restart-cancel');
const muteButton = document.getElementById('mute-button');
const sounds = {
    correct: document.getElementById('correct-sound'),
    incorrect: document.getElementById('incorrect-sound'),
    click: document.getElementById('button-click'),
    gameOver: document.getElementById('game-over'),
    perfect: document.getElementById('perfect-sound'),
    goodJob: document.getElementById('goodjob-sound')
};

function playSound(sound) {
    if (!isMuted) {
        sound.currentTime = 0;
        sound.play();
    }
}

let isMuted = false;
function toggleMute() {
    isMuted = !isMuted;
    muteButton.classList.toggle('muted');
    muteButton.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
}

muteButton.addEventListener('click', toggleMute);

document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => playSound(sounds.click));
});

function playCorrectSound() {
    playSound(sounds.correct);
}

function playIncorrectSound() {
    playSound(sounds.incorrect);
}

let currentQuestion = 0;
let score = 0;
let streak = 0;
let maxStreak = 0;
let timer;
let seconds = 0;
let questions = [];
let hintUsed = false;

async function fetchQuestions(category) {
    try {
        const response = await fetch(`https://opentdb.com/api.php?amount=10&category=${category}&type=multiple`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            questions = data.results;
            startQuiz();
        }
    } catch (error) {
        console.error('Error fetching questions:', error);
    }
}

function resetGame() {
    currentQuestion = 0;
    score = 0;
    streak = 0;
    maxStreak = 0;
    seconds = 0;
    questions = [];
    hintUsed = false;

    if (timer) {
        clearInterval(timer);
        timer = null;
    }

    progressElement.style.width = '0%';
    questionElement.innerHTML = '';
    optionsElement.innerHTML = '';

    categoryScreen.style.display = 'block';
    quizScreen.style.display = 'none';
    resultScreen.style.display = 'none';

    restartBtn.style.display = 'none';
    hintBtn.style.display = 'none';
    hintBtn.disabled = false;
    muteButton.style.display = 'none';
}

function startQuiz() {
    categoryScreen.style.display = 'none';
    resultScreen.style.display = 'none';
    muteButton.style.display = 'flex';
    
    quizScreen.style.display = 'block';
    currentQuestion = 0;
    score = 0;
    streak = 0;
    maxStreak = 0;
    seconds = 0;
    hintUsed = false;
    
    restartBtn.style.display = 'block';
    hintBtn.style.display = 'block';
    hintBtn.disabled = false;
    
    startTimer();
    showQuestion();
}

function showQuestion() {
    if (!questions.length || currentQuestion >= questions.length) {
        endQuiz();
        return;
    }

    hintUsed = false;
    hintBtn.disabled = false;
    
    const question = questions[currentQuestion];
    questionElement.innerHTML = question.question;
    optionsElement.innerHTML = '';

    const options = [...question.incorrect_answers, question.correct_answer];
    shuffleArray(options);

    options.forEach((option, index) => {
        const button = document.createElement('div');
        button.className = 'option slide-in';
        button.style.animationDelay = `${index * 0.1}s`;
        button.innerHTML = option;
        button.addEventListener('click', () => selectOption(option, question.correct_answer));
        optionsElement.appendChild(button);
    });

    updateProgress();
}

function selectOption(selected, correct) {
    const options = document.querySelectorAll('.option');
    options.forEach(option => {
        option.style.pointerEvents = 'none';
        if (option.innerHTML === correct) {
            option.classList.add('correct');
        } else if (option.innerHTML === selected) {
            option.classList.add('incorrect');
        }
    });

    if (selected === correct) {
        playCorrectSound();
        score += hintUsed ? 5 : 10;
        streak++;
        maxStreak = Math.max(maxStreak, streak);
    } else {
        playIncorrectSound();
        streak = 0;
    }

    setTimeout(() => {
        currentQuestion++;
        if (currentQuestion < questions.length) {
            showQuestion();
        } else {
            endQuiz();
        }
    }, 1500);
}

function endQuiz() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }

    quizScreen.style.display = 'none';
    categoryScreen.style.display = 'none';
    resultScreen.style.display = 'block';
    
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-time').textContent = formatTime(seconds);
    document.getElementById('final-streak').textContent = maxStreak;

    let message;
    if (score === 100) {
        message = "Perfect score! You're a quiz master!";
        playSound(sounds.perfect);
    } else if (score > 0) {
        message = score >= 80 ? "Great job! You're very knowledgeable!" :
                 score >= 60 ? "Good effort! Keep learning and improving!" :
                 "Nice try! There's always room for improvement.";
        playSound(sounds.goodJob);
    } else {
        message = "Better luck next time!";
        playSound(sounds.gameOver);
    }
    
    document.getElementById('result-message').textContent = message;

    restartBtn.style.display = 'block';
    hintBtn.style.display = 'none';
}

function startTimer() {
    if (timer) {
        clearInterval(timer);
    }
    seconds = 0;
    timer = setInterval(() => {
        seconds++;
    }, 1000);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

function updateProgress() {
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    progressElement.style.width = `${progress}%`;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function showHint() {
    if (hintUsed) return;

    const question = questions[currentQuestion];
    const options = document.querySelectorAll('.option');
    const incorrectOptions = Array.from(options).filter(option => 
        option.textContent !== question.correct_answer
    );

    if (incorrectOptions.length > 1) {
        const randomIndex = Math.floor(Math.random() * incorrectOptions.length);
        incorrectOptions[randomIndex].style.opacity = '0.3';
        incorrectOptions[randomIndex].style.pointerEvents = 'none';
    }

    hintUsed = true;
    hintBtn.disabled = true;
}

document.querySelectorAll('.category-btn[data-category]').forEach(button => {
    button.addEventListener('click', () => {
        const category = button.getAttribute('data-category');
        if (category) {
            fetchQuestions(category);
        }
    });
});

restartBtn.addEventListener('click', () => {
    restartPopup.style.display = 'flex';
});

restartConfirm.addEventListener('click', () => {
    restartPopup.style.display = 'none';
    resetGame();
});

restartCancel.addEventListener('click', () => {
    restartPopup.style.display = 'none';
});

hintBtn.addEventListener('click', showHint);

playAgainBtn.addEventListener('click', resetGame);

resetGame();