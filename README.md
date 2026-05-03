# GC Assist 🤖🎓

**GC Assist** is an AI-powered campus assistant built specifically for Gordon College (GC), Olongapo City. It operates locally and acts as a dynamic chatbot that provides students, faculty, and visitors with quick, accurate answers regarding enrollment, programs, facilities, faculty, and campus services.

### 🌟 Features
- **Local AI Powered**: Completely private and fast — connects to your local LM Studio instance (`localhost:1234`).
- **Gordon College Knowledge Base**: Custom-scraped and curated data directly from the Gordon College website.
- **Smart Context Retrieval**: Automatically scores and injects only the most relevant sections of the knowledge base into the context window to prevent token overflow.
- **Modern UI/UX**: Built with React, Vite, Framer Motion, and vanilla CSS for a native-feeling, Apple-inspired interface with seamless dark mode support.
- **Rich Markdown Formatting**: Answers are beautifully formatted using `react-markdown` with fully styled tables, lists, and code blocks.
- **Cloud Deployable**: Includes a custom Python script (`cloud.py`) to instantly build the app and tunnel both the frontend and LM Studio backend to the public internet via Cloudflare.

### 🛠️ Tech Stack
- Frontend: React 19, Vite, Framer Motion, Lucide React
- CSS: Vanilla CSS with custom property theming
- Backend/AI: LM Studio (Local AI Models)
- Data Ingestion: Python (`crawl.py` using BeautifulSoup4)
- Tunneling: Cloudflared

### 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the AI Server**
   - Open [LM Studio](https://lmstudio.ai/)
   - Load a local model (e.g., Llama 3 or Mistral)
   - Go to **Local Server** and click **Start Server** (`http://127.0.0.1:1234`)
   - *Ensure CORS is enabled in LM Studio settings.*

3. **Run the Web App**
   ```bash
   npm run dev
   ```

4. **Update the Knowledge Base (Optional)**
   You can re-scrape the latest data from the Gordon College site by running:
   ```bash
   python crawl.py
   ```

### ☁️ Share with the World
Want to let your friends try it? We built a zero-config cloud deployer.

```bash
python cloud.py
```
This script will build the production `.dist/` folder, spin up a local server, and create two secure Cloudflare tunnels (one for the web app and one for your LM Studio instance). It automatically stitches them together so anyone with the link can use your personal AI without needing to download anything!

---

### 👨‍💻 Author

**Built by June Vic M. Abello (aka EcomineAI)**

- GitHub: [EcomineAI](https://github.com/EcomineAI)

*Developed for the students of Gordon College, Olongapo City.*
