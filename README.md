<div align="center">
  
  # 🎥 OpenLoom
  
  **The ultimate, privacy-first, open-source alternative to Loom.**  
  *Record your screen, transcribe audio locally, and summarize meetings with zero cloud dependency.*

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Electron](https://img.shields.io/badge/Electron-30.0.0-47848F?logo=electron&logoColor=white)](#)
  [![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](#)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](#)
  [![Ollama](https://img.shields.io/badge/Ollama-Local_AI-black?logo=ollama&logoColor=white)](#)
  
  <br />

  <!-- PLACEHOLDER: Create a 10-15 second GIF showing you starting a recording and opening the library -->
  <img src="assets/hero-demo.gif" alt="OpenLoom Demo" width="800" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />

</div>

<br />

## ✨ Features

OpenLoom brings the best of modern screen recording and AI right to your desktop, entirely locally. 

| Feature | Description |
| :--- | :--- |
| 📹 **High-Quality Recording** | Record your screen, camera, or both simultaneously in crisp HD. |
| 🎙️ **Local Transcription** | Built-in `whisper.cpp` transcribes your videos entirely on-device. No data leaves your Mac. |
| 🧠 **Plug & Play AI** | Auto-detects your local [Ollama](https://ollama.com/) models (e.g., Llama 3) to generate titles, summaries, and action items instantly. |
| 🚀 **1-Click YouTube Upload** | Seamless Drag & Drop workflow to publish your recordings as unlisted YouTube videos for instant sharing. |
| 🎨 **Native macOS UI** | Beautiful, dark-mode-first design inspired by Apple's HIG and MacWhisper. |

<br />

<div align="center">
  <!-- PLACEHOLDER: Take a nice screenshot of the Settings screen showing the Ollama model dropdown -->
  <img src="assets/screenshot-settings.png" alt="Settings & AI" width="600" style="border-radius: 8px; border: 1px solid #333;" />
  <p><i>Effortless AI model management with auto-detection.</i></p>
</div>

<br />

## 🏗 Tech Stack

OpenLoom is built on a modern, robust foundation:

- **Frontend:** [React 18](https://reactjs.org/), [Vite](https://vitejs.dev/), [TailwindCSS](https://tailwindcss.com/)
- **Desktop Framework:** [Electron](https://www.electronjs.org/) (via [electron-vite](https://electron-vite.org/))
- **AI Transcription:** [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) (compiled from source)
- **AI Processing:** [Ollama](https://ollama.com/) (Local LLM Integration)
- **Media Processing:** FFmpeg (bundled dynamically)

<br />

## 🚀 Getting Started

### Prerequisites
- macOS (Apple Silicon M1/M2/M3 recommended)
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [Ollama](https://ollama.com/) (Optional, but required for local AI summaries)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/matteo-ise/open-loom.git
   cd open-loom
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start in development mode**
   ```bash
   pnpm dev
   ```

### Building for Production
To compile the app into a standalone macOS `.app` and `.dmg`:
```bash
pnpm dist
```
The compiled artifacts will be located in the `release/` folder.

<br />

<div align="center">
  <!-- PLACEHOLDER: Take a screenshot of the video player/library view -->
  <img src="assets/screenshot-library.png" alt="Library View" width="800" style="border-radius: 8px;" />
</div>

<br />

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check the [issues page](https://github.com/matteo-ise/open-loom/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---
<div align="center">
  Built with ❤️ by <a href="https://github.com/matteo-ise">Matteo Isemann</a>
</div>
