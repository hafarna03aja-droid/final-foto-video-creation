# 🎨 Final Foto Video Creation

<div align="center">
  
[![React](https://img.shields.io/badge/React-19.2.0-61dafb?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

**AI-Powered Multimedia Content Creation Platform**

*Generate stunning images, videos, text content, and audio using Google's Gemini AI*

[🚀 Live Demo](https://your-app-name.vercel.app) • [📖 Documentation](./DEPLOYMENT.md) • [🐛 Report Bug](https://github.com/hafarna03aja-droid/final-foto-video-creation/issues)

</div>

## ✨ Features

### 🖼️ **Image Generation & Editing**
- AI-powered image creation from text prompts
- Advanced image editing capabilities
- Multiple style and format options
- High-resolution output support

### 🎬 **Video Creation**
- Text-to-video generation
- AI-driven video editing
- Multiple output formats
- Professional quality results

### 📝 **Text Generation**
- Creative writing assistance
- Content creation for social media
- Blog post and article generation
- Multiple writing styles and tones

### 🔊 **Audio Synthesis**
- Text-to-speech conversion
- Voice synthesis with multiple voices
- Audio transcription capabilities
- High-quality audio output

### 🌐 **Social Media Integration**
- Direct sharing to social platforms
- Optimized content for different platforms
- Batch processing capabilities
- Content scheduling features

## 🚀 Quick Start

Aplikasi AI untuk generasi konten multimedia (gambar, video, teks, dan audio) yang siap untuk deployment produksi.

## 🚀 Deployment ke Vercel

### 1. Persiapan

```bash
# Install dependencies
npm install

# Buat file environment
cp .env.example .env
```

### 2. Setup Environment Variables

Edit file `.env` dan tambahkan:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Deploy ke Vercel

#### Opsi 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy
vercel --prod
```

#### Opsi 2: GitHub Integration
1. Push code ke GitHub repository
2. Connect repository di Vercel dashboard
3. Set environment variable `GEMINI_API_KEY` di Vercel dashboard
4. Deploy otomatis akan berjalan

### 4. Environment Variables di Vercel

Di Vercel dashboard, tambahkan environment variable:
- **Name:** `GEMINI_API_KEY`
- **Value:** Your actual Gemini API key
- **Environment:** Production, Preview, Development

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Production Features

- ✅ **SDK-based dependencies** (bukan CDN)
- ✅ **Tailwind CSS** properly configured
- ✅ **Production optimized build**
- ✅ **Code splitting** untuk performance
- ✅ **Environment variables** support
- ✅ **Vercel deployment ready**
- ✅ **TypeScript** support
- ✅ **Modern ES modules**

## 🏗️ Build Output

Build menghasilkan:
- Optimized bundles dengan code splitting
- Compressed assets
- Source maps (disabled untuk production)
- Proper asset hashing untuk caching

## 📂 Project Structure

```
├── src/
│   └── index.css          # Tailwind CSS dengan custom styles
├── components/            # React components
├── services/             # API services
├── utils/               # Utility functions
├── hooks/               # Custom React hooks
├── tailwind.config.js   # Tailwind configuration
├── postcss.config.js    # PostCSS configuration
├── vite.config.ts       # Vite configuration
├── vercel.json          # Vercel deployment config
└── package.json         # Dependencies dan scripts
```

## 🛠️ Tech Stack

- **Frontend:** React 19.2.0 + TypeScript
- **Build Tool:** Vite 6.2.0
- **Styling:** Tailwind CSS 3.4.0
- **AI Platform:** Google Gemini AI
- **Deployment:** Vercel
- **Package Manager:** npm

## 📸 Screenshots

<details>
<summary>Click to view screenshots</summary>

### Dashboard
![Dashboard](./docs/screenshots/dashboard.png)

### Image Generation
![Image Generation](./docs/screenshots/image-generation.png)

### Video Creation
![Video Creation](./docs/screenshots/video-creation.png)

### Text Generation
![Text Generation](./docs/screenshots/text-generation.png)

</details>

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for providing the AI capabilities
- [React Team](https://reactjs.org/) for the amazing framework
- [Vite](https://vitejs.dev/) for the fast build tool
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Vercel](https://vercel.com/) for the deployment platform

## 🎯 Roadmap

- [ ] Add more AI models support
- [ ] Implement user authentication
- [ ] Add collaborative features
- [ ] Mobile app development
- [ ] API for third-party integrations
- [ ] Advanced analytics dashboard

---

<div align="center">
  
**Made with ❤️ by [Hafarna](https://github.com/hafarna03aja-droid)**

If you found this project helpful, please consider giving it a ⭐️

</div>
