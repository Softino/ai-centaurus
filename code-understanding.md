
# Code Understanding

## Overview
This is a React application built with Vite and TypeScript, simulating a "Think Tank" strategic round table with AI agents.

## Core Components
-   **Frontend**: React + Vite.
-   **AI Integration**: Currently uses `@google/genai` SDK to communicate with Google Gemini models directly.
    -   `services/geminiService.ts`: Handles all AI interactions.
        -   `streamAgentResponse`: Streams text responses.
        -   `generateLiveReport`: Generates JSON reports.
        -   `speak`: Uses `gemini-2.5-flash-preview-tts` for Text-to-Speech (multimodal).
-   **Data Models**: `types.ts` (Agent, ChatMessage).
-   **Constants**: `constants.ts` (Agent definitions, Model IDs).

## Deployment Status
-   Running locally via `vite`.
-   No Docker setup.

## Planned Changes
1.  **AI Switch**:
    -   Replace `@google/genai` with `openai` SDK (for OpenRouter).
    -   Replace `GeminiService` with `OpenRouterService`.
    -   Replace complex Gemini TTS with browser-based `speechSynthesis` (or standard API) as OpenRouter is text-focused.
2.  **Deployment**:
    -   Add `Dockerfile` (Node build -> Nginx serve).
    -   Add `docker-compose.yml`.
