# EatMate Web App

## Overview

EatMate is a modern web application for discovering, creating, and sharing recipes. It features a mobile-first, responsive design, robust authentication, AI-powered username generation, and a rich set of tools for food enthusiasts. The platform leverages Next.js, NestJS, MongoDB, and OpenAI for a seamless and intelligent user experience.

## Features

- **Recipe Discovery:** Filter, search, and explore a wide variety of recipes with advanced filters.
- **Recipe Creation:** Authenticated users can create, edit, and manage their own recipes.
- **Favorites & Personal Recipes:** Save favorite recipes and view all recipes you have authored.
- **User Profiles:** Unique display names, theme preferences (auto/dark/light), and profile management.
- **Authentication:** Secure login, registration, and Google OAuth integration.
- **AI Username Generation:** Generate unique, fun usernames using OpenAI.
- **Internationalization:** Multi-language support with i18next.
- **Modern UI:** Built with shadcn/ui, Tailwind CSS, and Radix UI for a clean, accessible interface.
- **Mobile-First:** Fully responsive design for all devices.

## Architecture

### 1. Frontend (Next.js)

- **App Directory:** Uses Next.js App Router for modern routing and layouts.
- **UI Components:** Built with shadcn/ui, Radix UI, and custom components (e.g., RecipeCard, Header, MobileMenu).
- **State Management:** React hooks, react-hook-form, and zod for validation.
- **Theme Management:** next-themes for light/dark/auto theme switching.
- **API Client:** Axios-based client for communication with the backend.

### 2. Backend (NestJS)

- **REST API:** Built with NestJS, providing endpoints for recipes, users, authentication, and AI services.
- **Database:** MongoDB with Mongoose schemas for users and recipes.
- **Authentication:** JWT-based authentication and Google OAuth.
- **OpenAI Integration:** For AI-powered username generation and future enhancements.

### 3. Shared Libraries

- **Data Access:** Shared TypeScript libraries for diets, cooking techniques, and more.

## Getting Started

1. **Clone the repository:**

   ```sh
   git clone https://github.com/bigpetecz/eat-mate.git
   cd eat-mate
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Set up environment variables:**

   - Copy `.env.example` to `.env` in both `apps/api` and `apps/frontend`.
   - Add your MongoDB URI, OpenAI API key, and other secrets.

4. **Run the development servers:**

   - **API:**
     ```sh
     cd apps/api
     npm run start:dev
     ```
   - **Frontend:**
     ```sh
     cd apps/frontend
     npm run dev
     ```

5. **Access the app:**  
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Security

- **API Keys & Secrets:** All sensitive keys are excluded from version control via `.gitignore`.
- **Authentication:** JWT and OAuth for secure user sessions.

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss your ideas.

## License

This project is licensed under the MIT License.
