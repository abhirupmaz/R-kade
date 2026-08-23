# R-kade 🕹️

R-kade is a mobile-first web gaming arcade, currently featuring a high-stakes, adrenaline-pumping twist on the classic Wordle game. Built with React, TypeScript, and Vite, it delivers a premium, highly tactile experience straight to your mobile browser.

🌐 **Play Now:** [r-kade.vercel.app](https://r-kade.vercel.app)

---

## 🎲 The Game: Arcade Wordle

It's Wordle, but the arcade fights back. 
You have 6 attempts to guess the hidden 5-letter word. But after your first guess, the **Arcade Curses** awaken.

### 🔮 The Curse System
Guesses 2 through 5 are afflicted by dynamic modifiers that force you to adapt your strategy on the fly. Curses are **target-aware**—they will never make the correct answer impossible to guess on your current turn.

*   **Echo Fragment 🔮:** You must use at least 1 letter from your previous guess.
*   **Twin Chains ⛓️:** You must use at least 2 letters from your previous guess.
*   **Alpha Link ⚡:** Your next guess must start with the first letter of your previous guess.
*   **Ouroboros 🔁:** Your next guess must start with the last letter of your previous guess.
*   **Forbidden Rune 🚫:** A specific letter is taboo and cannot be used this turn.
*   **Anchor Slot 🎯:** You must match at least 1 exact letter position with your previous guess.
*   **Glitch Mirage 🎭:** One of the tiles in your result will display a false, inverted color clue. Trust nothing.
*   **Overload Pulse ⏱️:** A 30-second countdown begins. Submit a word before time expires, or your previous word is auto-submitted, wasting a turn!

### 🛡️ The Final Stand
If you survive until Attempt 6, the curse lifts. Your final shot is based purely on skill and the clues you've gathered.

### 📜 Game Chronicle
After the game ends, check the **Curse Recap** to review the history of modifiers you faced and whether you overcame them or succumbed.

---

## ✨ Features & Aesthetics

R-kade is designed to feel like a premium, tactile application:

*   **1-by-1 Sequential Reveals:** 3D tile flips are staggered to build tension.
*   **Immersive Audio:** Pitch-shifted chimes accompany tile reveals, with dark bass swells for curse awakenings, ticking clocks for timers, and violation buzzers.
*   **Advanced Haptics & Recoil:** Features an acoustic sub-bass transducer impulse (28Hz–140Hz) and full-screen impact shockwaves when invalid words are submitted or wrong guesses are made.
*   **Two Game Modes:** 
    *   **Daily Mode:** A globally synced daily word with a deterministic curse seed. Compete with friends on the exact same challenge and build your streak.
    *   **Practice Mode:** Infinite randomized gameplay to hone your skills.

---

## 🛠️ Technology Stack

*   **Core:** React 18, TypeScript
*   **Build Tool:** Vite
*   **Styling:** Vanilla CSS (Dynamic layouts, glassmorphism, keyframe animations)
*   **Deployment:** Vercel

---

## 🚀 Running Locally

1.  **Clone the repository**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Start the development server:**
    ```bash
    npm run dev
    ```
4.  Open `http://localhost:5173` in your browser. (For the best haptic/audio experience, test on a mobile device by accessing your local IP).

---

*Designed and built for the bold.*
