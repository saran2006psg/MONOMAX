# 🚀 MONOMAX - Codebase Navigator

A full-stack web application for exploring and analyzing monorepo codebases with an intuitive interface.

## 📋 Features

- **📁 File Upload**: Upload zip files containing your codebase
- **🗂️ Interactive File Tree**: Navigate through your project structure
- **📝 Code Viewer**: Syntax-highlighted code viewing with Monaco Editor
- **🔍 Code Analysis**: View functions, classes, and other code symbols
- **🌓 Dark/Light Theme**: Toggle between dark and light modes
- **📱 Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Monaco Editor** for code viewing
- **Lucide React** for icons
- **Axios** for API calls

### Backend
- **Node.js** with TypeScript
- **Express.js** for API server
- **Multer** for file uploads
- **Node.js built-in modules** for file processing

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/saran2006psg/MONOMAX.git
   cd MONOMAX
   ```

2. **Install dependencies:**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. **Start the development servers:**
   
   **Backend (Terminal 1):**
   ```bash
   cd backend
   npm run dev
   ```
   
   **Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Open your browser:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 📂 Project Structure

```
MONOMAX/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript type definitions
│   │   └── ...
│   ├── package.json
│   └── ...
├── backend/                 # Node.js backend application
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic services
│   │   ├── utils/           # Utility functions
│   │   └── index.ts         # Entry point
│   ├── uploads/             # File upload directory (ignored by git)
│   ├── package.json
│   └── ...
├── package.json             # Root package.json
└── README.md
```

## 🎨 Features in Detail

### 🌓 Theme Support
- **Dark Mode**: Perfect for late-night coding sessions
- **Light Mode**: Clean and bright interface
- **Auto-detection**: Respects system preferences
- **Manual Toggle**: Switch themes with a single click

### 📝 Code Viewing
- **Syntax Highlighting**: Support for multiple programming languages
- **Monaco Editor**: Same editor used in VS Code
- **File Explorer**: Navigate through your project structure
- **Symbol List**: View functions, classes, and other code symbols

### 🔍 Code Analysis
- **Function Detection**: Automatically detect and list functions
- **Class Detection**: Find and display class definitions
- **Import/Export Tracking**: See module dependencies
- **Search Functionality**: Find code symbols quickly

## 🚀 Deployment

### Frontend
```bash
cd frontend
npm run build
```

### Backend
```bash
cd backend
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Monaco Editor** - For the amazing code editor
- **Tailwind CSS** - For the utility-first CSS framework
- **Lucide React** - For the beautiful icon set
- **Vite** - For the lightning-fast build tool

## 🐛 Issues & Support

If you encounter any issues or have questions, please [open an issue](https://github.com/saran2006psg/MONOMAX/issues) on GitHub.

---

Made with ❤️ by [saran2006psg](https://github.com/saran2006psg)
