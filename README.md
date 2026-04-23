# ✨ Celestial Mapper | Constellation Story Engine

Mapping the void between data and mythology. An immersive, AI-powered astronomical experience built for the **VishwaNova 2026 Hackathon**.

![Celestial Mapper Preview](https://img.shields.io/badge/Status-Production--Ready-success?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React--19--TS--Tailwind--V4-blue?style=for-the-badge)

## 🌌 Overview

Celestial Mapper is a sophisticated tool that transforms your digital star charts into deeply layered mythologies. By anchoring stars in the digital void, you engage a synthesis engine that weaves unique narratives, scientific classifications, and astrological meanings into a professional, glassmorphic interface.

**Try it here:** [Live Demo](https://ais-pre-qad2eu626vi2aafp45d3kz-44682549552.asia-southeast1.run.app)

## 🚀 Features

- **Generative Mythology:** Powered by **Gemini 3 Flash**, the engine synthesizes coordinate data into scholarly, poetic stories.
- **Ambient Pad Synth:** A custom sound engine built via **Web Audio API** that evolves in real-time.
- **Immersive UI:** A professional "Observatory" aesthetic using glassmorphism, stardust textures, and modern typography.
- **Mobile-First Design:** Fully responsive Mapping Canvas with touch-support for celestial anchoring.
- **High-Fidelity Export:** Download your custom star maps as high-resolution PNGs.
- **Social Integration:** Integrated profiles and sharing for the discovery team.

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation:** [Motion](https://motion.dev/) (formerly Framer Motion)
- **AI:** [Google Gemini API](https://ai.google.dev/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Audio:** Web Audio API (Generative Oscillators & LFOs)
- **Export:** [html-to-image](https://www.npmjs.com/package/html-to-image)
- **Feedback:** [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)

## 🤖 AI Integration

The project utilizes the `gemini-3-flash-preview` model to interpret coordinate geometry. It doesn't just name stars; it creates a structured world including:
- **Latin/Greek-inspired names**
- **Scholarly mythology** (mix of Carl Sagan & ancient historians)
- **Scientific classifications** (Type II Nebula Clusters, etc.)
- **Astrological significance**

## 🏗️ Getting Started

### Prerequisites

- Node.js installed
- A [Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables in `.env`:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 👨‍💻 Authors

This project was built with ❤️ for the VishwaNova 2026 Hackathon by:

### Aditya Mestry
- [GitHub](https://github.com/adimestry)
- [Instagram](https://www.instagram.com/aditya_mestry_x007/)

### Dhruv Kasar
- [GitHub](https://github.com/dhruvkasar)
- [Instagram](https://www.instagram.com/dhruvvkasar/)

## 📄 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.
