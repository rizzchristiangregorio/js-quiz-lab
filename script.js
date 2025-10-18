// Improved JS: Added timer extension, localStorage for high score, error handling, progress updates, and better UX (e.g., disable options after selection).
// All code is modular, commented, and uses const/let appropriately.
const quizData = [
{
question: "What does 'let' declare in JavaScript?",
options: ["A constant value", "A changeable variable", "A function", "An array"],
correct: 1
},
{
question: "Which is the strict equality operator?",
options: ["==", "=", "===", "!="],
correct: 2
},
{
question: "What is the purpose of a for loop?",
options: ["To declare variables", "To repeat code a set number of times", "To handle events", "To style elements"], 
correct: 1
},
{
question: "How do you select an element by ID in the DOM?",
options: ["querySelector", "getElementById", "createElement", "appendChild"],
correct: 1
},
{
question: "Inside which HTML element do we put the JavaScript?",
options: ["<script>", "<js>", "<javascript>", "<scripting>"],
correct: 0
},
{
question: "Where is the correct place to insert a JavaScript?",
options: ["The <body> section", "The <head> section", "Both <body> and <head> sections", "None of the above"],
correct: 2
},
{
question: "What is the correct syntax for referring to an external script called script.js?",
options: ['<script href="script.js">', '<script name="script.js">', '<script src="script.js">', '<script file="script.js">'],
correct: 2
},
{
question: "The external JavaScript file must contain the <script> tag.",
options: ["True", "False", "Only in HTML5", "Only in HTML4"],
correct: 1
},
{
question: "How do you create a function in JavaScript?",
options: ["function = myFunction()", "function:myFunction()", "function myFunction()", "create myFunction()"],
correct: 2
},
{
question: "How do you call a function named 'myFunction'?",
options: ["call myFunction()", "myFunction()", "Call function myFunction()", "execute myFunction()"],
correct: 1
},
{
question: "How can you add a comment in a JavaScript??",
options: ["<!-- This is a comment -->", "// This is a comment", "' This is a comment", "** This is a comment **"],
correct: 1
},
{
  question: "JavaScript is the same as Java.",
  options: ["True", "False", "True in application development", "Only in web browsers"],
  correct: 1
}
];

// Shuffle questions 
quizData.sort(() => Math.random() - 0.5);



let currentQuestion = 0;
let score = 0;
let totalQuestions = quizData.length;
let selectedAnswer = -1;
let timerInterval; // For per-question timer
let timeLeft = 30; // 30 seconds per question
let highScore = localStorage.getItem('jsQuizHighScore') || 0;
let focusedOption = 0;

//I added feedback images for correct and incorrect answers (LeBron James meme)
const correctImages = [
  'correct.svg'
];
const wrongImages = [
  'incorrect.svg'
];

function playFeedbackSound(isCorrect) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return; // gracefully no-op
    if (!playFeedbackSound.ctx) playFeedbackSound.ctx = new AC();
    const ctx = playFeedbackSound.ctx;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const vol = 0.18;

    // Helper to schedule one note with vibrato and LPF; supports rests via freq=null
    const schedule = (freq, start, dur, type, opts = {}) => {
      if (freq == null) return; // rest
      const attack = Math.min(0.03, dur * 0.35);
      const release = Math.min(0.06, dur * 0.5);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(opts.lpfFreq || 1800, start);

   
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(opts.vibRate || 6, start);
      lfoGain.gain.setValueAtTime(opts.vibDepth || 4, start); 
      lfo.connect(lfoGain).connect(osc.frequency);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(vol, start + attack);
      gain.gain.setValueAtTime(vol, start + Math.max(attack, dur - release));
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(gain).connect(lpf).connect(ctx.destination);
      lfo.start(start);
      osc.start(start);
 
      const stopAt = start + dur + 0.03;
      osc.stop(stopAt);
      lfo.stop(stopAt);
    };

    if (isCorrect) {
      // I added the song "You are My Sunshine" used in the LeBron James meme for correct and incorrect theme
      // I researched that Web Audio API can be used to create music with multiple notes and then try to implement it
      const B4 = 493.88, C5 = 523.25, D5 = 587.33, E5 = 659.25, A4 = 440.00;
      const Csharp5 = 554.37, Fsharp4 = 369.99, Fsharp5 = 739.99, G4 = 392.00;
      const type = 'square'; // 
      const dur = 0.12, gap = 0.026; 
      const seq = [G4, C5, D5, E5, E5];
      let t = now;
      seq.forEach((f) => {
        schedule(f, t, dur, type, { vibDepth: 0, lpfFreq: 10000 });
        t += dur + gap;
      });
    } else {

      const C5 = 523.25, D5 = 587.33, E5 = 659.25;
      const type = 'sawtooth';
      const dur = 0.105, gap = 0.022; 
      const seq = [E5, D5, E5, C5, C5];
      let t = now;
      seq.forEach((f) => {
        schedule(f, t, dur, type, { vibDepth: 0, lpfFreq: 5200 });
        t += dur + gap;
      });
    }
  } catch (_) {
    // For audio errors
  }
}

// Utility: Update progress bar
function updateProgress() {
const progress = ((currentQuestion + 1) / totalQuestions) * 100;
document.getElementById('progress-fill').style.width = progress + '%';
document.getElementById('current-q').textContent = currentQuestion + 1;
document.getElementById('total-q').textContent = totalQuestions;
}
// Extension: Start timer for each question
function startTimer() {
timeLeft = 30;
document.getElementById('timer-container').style.display = 'block';
document.getElementById('timer-text').textContent = timeLeft;
document.getElementById('timer-fill').style.width = '100%';
timerInterval = setInterval(() => {
timeLeft--;
document.getElementById('timer-text').textContent = timeLeft;
document.getElementById('timer-fill').style.width = (timeLeft / 30 * 100) + '%';
if (timeLeft <= 0) {
clearInterval(timerInterval);
nextQuestion(); // Auto-advance on timeout
}
}, 1000);
}
// Extension: Clear timer
function clearTimer() {
if (timerInterval) {
clearInterval(timerInterval);
document.getElementById('timer-container').style.display = 'none';
}
}
function showFeedback(isCorrect) {
  const fb = document.getElementById('feedback-image');
  const img = document.getElementById('feedback-img');
  if (!fb || !img) return;
  const scoreContainer = document.getElementById('score-container');
  if (scoreContainer && scoreContainer.style.display !== 'none') {
    // If results are visible, never show feedback popup
    return;
  }
  // Ensure it's allowed to be visible during questions
  fb.classList.remove('hidden');
  fb.style.visibility = '';
  fb.hidden = false;
  const pool = isCorrect ? correctImages : wrongImages;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  img.src = pick;
  fb.style.display = 'block';
}
function loadQuestion() {
    try {
const q = quizData[currentQuestion];
if (!q) throw new Error('No question data');
document.body.classList.remove('showing-score');
document.getElementById('question').textContent = q.question;
const optionsDiv = document.getElementById('options');
optionsDiv.innerHTML = '';
 const fb = document.getElementById('feedback-image');
 const fbImg = document.getElementById('feedback-img');
 if (fb) { fb.style.display = 'none'; fb.classList.remove('hidden'); fb.style.visibility=''; fb.hidden=false; }
 if (fbImg) fbImg.removeAttribute('src');
q.options.forEach((option, index) => {
const btn = document.createElement('button');
btn.textContent = option;
btn.classList.add('option');
btn.setAttribute('aria-label', `Option: ${option}`);
btn.onclick = () => selectOption(index);
optionsDiv.appendChild(btn);
});
document.getElementById('next-btn').style.display = 'none';
updateProgress();
startTimer(); // Extension: Timer starts
 focusedOption = 0;
 const btns = document.querySelectorAll('.option');
 if (btns.length) btns[0].focus();
} catch (error) {
console.error('Error loading question:', error);
document.getElementById('question').innerHTML = '<p style="color: red;">Error loading question. Check console.</p>';
}
}
function selectOption(index) {
if (selectedAnswer !== -1) return; // Prevent multiple selections
selectedAnswer = index;
clearTimer(); // Stop timer on answer
const options = document.querySelectorAll('.option');
options.forEach((opt, i) => {
opt.disabled = true; // Disable after selection
opt.classList.remove('correct', 'incorrect');
if (i === quizData[currentQuestion].correct) {
opt.classList.add('correct');
} else if (i === index && index !== quizData[currentQuestion].correct) {
opt.classList.add('incorrect');
}
});
 const isCorrect = index === quizData[currentQuestion].correct;
 // Show Next immediately to avoid being blocked by any subsequent errors
 document.getElementById('next-btn').style.display = 'block';
 // Then do feedback UI and audio
 showFeedback(isCorrect);
 playFeedbackSound(isCorrect);

}
function nextQuestion() {
if (selectedAnswer === quizData[currentQuestion].correct) {
score++;
}
currentQuestion++;
selectedAnswer = -1;
if (currentQuestion < totalQuestions) {
loadQuestion();
} else {
showScore();
}
}
function showScore() {
clearTimer();
document.getElementById('question-container').style.display = 'none';
document.getElementById('score-container').style.display = 'block';
document.body.classList.add('showing-score');
const percentage = Math.round((score / totalQuestions) * 100);
  document.getElementById('score-circle-text').textContent = score;
  document.getElementById('total-score').textContent = totalQuestions;
  const fb = document.getElementById('feedback-image');
  const fbImg = document.getElementById('feedback-img');
  if (fb) {
    fb.classList.add('hidden');
  }
  if (fbImg) {
    fbImg.removeAttribute('src');
  }
  let feedback = '';
  if (percentage >= 80) feedback = "Outstanding! You're a JavaScript wizard. 🌟";
  else if (percentage >= 60) feedback = "Well done! Keep practicing those concepts. ⭐";
  else feedback = "Good start—dive back into the lecture notes for a refresh. 📚";
  document.getElementById('feedback').textContent = feedback;
  // Confetti celebration on perfect score
  if (score === totalQuestions && typeof window !== 'undefined' && window.confetti) {
    try {
      const end = Date.now() + 800;
      const defaults = { startVelocity: 45, spread: 360, ticks: 60, zIndex: 2000 }; 
      const frame = () => {
        window.confetti(Object.assign({ particleCount: 40, origin: { x: Math.random(), y: 0.2 } }, defaults));
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    } catch (_) { /* no-op */ }
  }
  // High score: update if beaten, but always show best on results screen
  const bestBefore = parseInt(highScore, 10) || 0;
  if (score > bestBefore) {
    highScore = score;
    localStorage.setItem('jsQuizHighScore', highScore);
  }
  const bestNow = parseInt(localStorage.getItem('jsQuizHighScore') || highScore || 0, 10);
  const hsEl = document.getElementById('high-score');
  const hsValEl = document.getElementById('high-score-val');
  if (hsEl && hsValEl) {
    hsEl.style.display = 'block';
    hsValEl.textContent = bestNow;
  }
}
function restartQuiz() {
currentQuestion = 0;
score = 0;
selectedAnswer = -1;
document.body.classList.remove('showing-score');
document.getElementById('question-container').style.display = 'block';
document.getElementById('score-container').style.display = 'none';
document.getElementById('high-score').style.display = 'none';
 const fb = document.getElementById('feedback-image');
 const fbImg = document.getElementById('feedback-img');
 if (fb) { fb.style.display = 'none'; fb.style.visibility = 'hidden'; fb.hidden = true; fb.classList.add('hidden'); }
 if (fbImg) fbImg.removeAttribute('src');
quizData.sort(() => Math.random() - 0.5);
loadQuestion();
}
// Initialize on page load
//I added keyboard navigation for accessibility based on the suggestion
document.addEventListener('DOMContentLoaded', loadQuestion);
document.addEventListener('keydown', (e) => {
  const qc = document.getElementById('question-container');
  if (!qc || qc.style.display === 'none') return;
  if (selectedAnswer !== -1) return;
  const btns = document.querySelectorAll('.option');
  if (!btns.length) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault();
    focusedOption = (focusedOption + 1) % btns.length;
    btns[focusedOption].focus();
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault();
    focusedOption = (focusedOption - 1 + btns.length) % btns.length;
    btns[focusedOption].focus();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    btns[focusedOption].click();
  }
});