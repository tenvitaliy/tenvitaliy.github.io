# Study Assistant & Flashcard Web App: Agent Instructions

## Project Overview
You are an expert frontend web developer. Your task is to build a single-page HTML/CSS/JS application that serves as a personal study tracker and flashcard learning tool. The entire application, including the UI and internal code, must be in **English**. 

Since there is no backend, all data must be saved to the browser's `localStorage` to ensure persistence across sessions.

## Core Features & Requirements

### 1. Main Dashboard (Home Screen)
*   **Lesson Grid:** A grid layout displaying "Lessons" (or Subjects) as individual cards/cells.
*   **Add Lesson:** A button/action to create a new lesson cell. The user should be able to type in a custom name for the subject they are studying.
*   **Pomodoro Timer Widget:** A dedicated section on the main screen featuring a Pomodoro timer.
    *   Standard intervals (25 mins work, 5 mins break).
    *   Controls: Start, Pause, Reset.
    *   Visual countdown display.

### 2. Lesson View (Inside a selected lesson)
When a user clicks on a lesson cell from the dashboard, they should be taken to a detailed view for that specific subject. This view must include:

*   **Mini-Calendar & Deadlines:**
    *   A small calendar widget or a deadline manager.
    *   The user can select dates, add a custom description for a deadline (e.g., "Math Exam", "Essay Due"), and save it.
    *   Display a list of upcoming deadlines for this specific lesson.
*   **Flashcard Decks Manager:**
    *   Ability to create multiple distinct "Decks" (e.g., "Chapter 1 Terms", "Formulas").
    *   Inside each deck, the user can create flashcards by entering text for the "Front" (question/prompt) and "Back" (answer).
*   **Review Mode (Study Mode):**
    *   When the user chooses to study a deck, open a review interface.
    *   Show the front of a card.
    *   User clicks to "Flip" the card to reveal the back.
    *   Buttons to navigate to the "Next" or "Previous" card.

## Technical Specifications
*   **Tech Stack:** Vanilla HTML5, CSS3, and JavaScript (ES6+). No complex build tools or frameworks (React/Vue) unless specifically requested by the user later. You may use a CSS framework like Tailwind CSS via CDN or write clean vanilla CSS.
*   **Data Storage:** Implement a robust `localStorage` manager.
    *   Suggested JSON structure: 
      ```json
      {
        "lessons": [
          {
            "id": "123",
            "name": "History 101",
            "deadlines": [{ "date": "2026-08-15", "title": "Final Essay" }],
            "decks": [
              {
                "deckId": "abc",
                "deckName": "Dates & Events",
                "cards": [{ "front": "WW2 Start", "back": "1939" }]
              }
            ]
          }
        ],
        "settings": { ... }
      }
      ```
*   **UI/UX Guidelines:**
    *   **Modern & Clean:** Use a minimalist design with a soft color palette to avoid distractions.
    *   **Responsive:** Ensure the layout works well on both desktop and mobile screens.
    *   **Interactive:** Use smooth CSS transitions for flipping flashcards, hovering over lesson cells, and switching views.

## Implementation Steps for the Agent
1.  **Step 1:** Setup the basic `index.html`, `styles.css`, and `app.js` file structures.
2.  **Step 2:** Implement the layout structure and navigation logic (switching between Home Screen and Lesson View).
3.  **Step 3:** Build the Pomodoro timer and ensure it works asynchronously.
4.  **Step 4:** Implement `localStorage` CRUD (Create, Read, Update, Delete) operations for Lessons.
5.  **Step 5:** Build the Lesson View UI, integrating the deadline/calendar widget.
6.  **Step 6:** Implement the Flashcard system (creating decks, creating cards, and the flip/review interactive UI).
7.  **Step 7:** Polish the UI, ensuring all elements are properly spaced, styled, and intuitive.

**Note:** Always write clean, well-commented code. Prioritize modularity in your JavaScript (e.g., separating UI rendering functions from data management functions).
