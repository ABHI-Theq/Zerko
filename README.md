# Zerko - AI-Powered Interview Platform

<div align="center">

<img src="public/logo.png" alt="Zerko Logo" width="200" />

**Intelligent Interview Platform with Voice AI**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Documentation](#-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

## 🎯 Overview

Zerko is a cutting-edge AI-powered interview platform that revolutionizes the hiring process through intelligent automation. Built with Next.js 15, React 19, and powered by Google Gemini 2.5 Pro, Zerko provides:

- **🎙️ Production-Ready Voice Interviews**: Real-time speech recognition with cross-browser support
- **🤖 AI-Driven Question Generation**: Context-aware questions tailored to resumes and job roles
- **📊 Intelligent Feedback**: Comprehensive performance analysis and actionable insights
- **🛡️ Brave Browser Optimized**: Specialized support for privacy-focused browsers
- **🔄 Automatic Fallback**: Seamless transition to text input when voice fails

### Why Zerko?


Traditional interviews are time-consuming, inconsistent, and often biased. Zerko solves these problems by:

1. **Automating Initial Screening**: AI conducts first-round interviews 24/7
2. **Ensuring Consistency**: Every candidate gets the same quality of evaluation
3. **Saving Time**: Recruiters focus on top candidates, not screening hundreds
4. **Providing Insights**: Detailed analytics help make better hiring decisions
5. **Improving Accessibility**: Voice and text options accommodate all candidates

## ✨ Key Features

### 🎙️ Advanced Voice Interview System

- **Cross-Browser Compatibility**: Works on Chrome, Firefox, Safari, Edge, and Brave
- **Intelligent Speech Recognition**: Real-time transcription with Web Speech API
- **Browser-Specific Optimizations**: Tailored configurations for each browser
- **Robust Error Handling**: Network retry with exponential backoff (3 attempts)
- **Automatic Fallback**: Seamless switch to text input when voice fails
- **Silence Detection**: Smart detection of speech end (8-10 seconds)
- **Session Transcript**: Accumulates complete answers across recognition restarts

### 🛡️ Brave Browser Support

> **Note**: Due to limitations with the Web Speech Recognition API in Brave browser, voice interviews currently use text input as the primary method. We are actively working on resolving this issue. Voice interviews work perfectly on Chrome, Firefox, Safari, and Edge browsers.

- **Async Detection**: Multiple fallback methods for reliable identification
- **Shield Warnings**: Proactive notifications about Brave-specific setup
- **Text Input Fallback**: Seamless text-based interview experience on Brave
- **Network Retry Logic**: Optimized for Brave's privacy features
- **Visual Indicators**: Clear feedback about browser-specific behavior
- **Future Enhancement**: Full voice support for Brave browser coming soon

### 🤖 AI-Powered Intelligence

- **Question Generation**: LangChain + Google Gemini 2.5 Pro creates tailored questions
- **Resume Analysis**: PyMuPDF extracts and analyzes resume content
- **Context-Aware Flow**: Maintains conversation context throughout interview
- **Time-Based Logic**: Intelligent question pacing based on remaining time
- **Performance Feedback**: Detailed analysis with strengths and improvements

### 📊 Comprehensive Analytics

- **Real-Time Transcription**: Complete interview transcripts saved automatically
- **Performance Ratings**: AI-generated scores and detailed feedback
- **Interview History**: Track all past interviews and progress
- **Dashboard Analytics**: Visual insights into interview performance

### 🎨 Modern User Experience

- **Responsive Design**: Mobile-first, works on all devices
- **Dark/Light Mode**: Theme switching with system preference detection
- **Smooth Animations**: Framer Motion for polished interactions
- **Accessibility**: WCAG 2.1 compliant with Radix UI primitives
- **Toast Notifications**: Real-time feedback with react-hot-toast

### 🔐 Security & Authentication

- **NextAuth 5.0**: Secure multi-provider authentication
- **OAuth Support**: GitHub and Google sign-in
- **Password Hashing**: bcryptjs for secure credential storage
- **Route Protection**: Middleware-based access control
- **Session Management**: Secure JWT-based sessions

## 🚀 Quick Start

Get Zerko running in 5 minutes:

```bash
# 1. Clone and install
git clone https://github.com/ABHI-Theq/zerko.git
cd zerko
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your database URL and API keys

# 3. Set up database
pnpm prisma generate
pnpm prisma migrate dev

# 4. Start development server
pnpm dev

# 5. Start AI backend (in separate terminal)
cd zerko-interview-agent
pip install -r requirements.txt
python app.py
```

Visit **http://localhost:3000** to start interviewing!

## 🏗️ Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Browser)                             │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Next.js 15 Frontend (React 19 + TypeScript)                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │  │
│  │  │   UI Layer   │  │ Voice System │  │   State Management       │ │  │
│  │  │ - TailwindCSS│  │ - Speech API │  │ - React Context          │ │  │
│  │  │ - Radix UI   │  │ - TTS Engine │  │ - Interview State        │ │  │
│  │  │ - Framer     │  │ - Mic Access │  │ - Message History        │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↕ HTTPS
┌──────────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION LAYER                              │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  API Routes (Next.js API Routes)                                   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │  │
│  │  │ Auth Routes  │  │Interview APIs│  │   Middleware             │ │  │
│  │  │ - Sign In    │  │ - Transcript │  │ - Route Protection       │ │  │
│  │  │ - Sign Up    │  │ - Feedback   │  │ - Session Validation     │ │  │
│  │  │ - OAuth      │  │ - Questions  │  │ - CORS Handling          │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘ │  │
│  │                                                                     │  │
│  │  ┌────────────────────────────────────────────────────────────┐   │  │
│  │  │  NextAuth 5.0 (Authentication & Session Management)        │   │  │
│  │  │  - GitHub OAuth  - Google OAuth  - Credentials Auth        │   │  │
│  │  └────────────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
                    ↕ HTTP/REST                    ↕ Database Queries
┌──────────────────────────────────┐    ┌──────────────────────────────────┐
│   AI BACKEND (Python/FastAPI)    │    │   DATA LAYER (PostgreSQL)        │
│  ┌────────────────────────────┐  │    │  ┌────────────────────────────┐  │
│  │  FastAPI Server (Port 8000)│  │    │  │  Prisma ORM                │  │
│  │  ┌──────────────────────┐  │  │    │  │  ┌──────────────────────┐  │  │
│  │  │ Interview Agent      │  │  │    │  │  │ User Model           │  │  │
│  │  │ - Question Flow      │  │  │    │  │  │ Interview Model      │  │  │
│  │  │ - Answer Processing  │  │  │    │  │  │ Transcript Storage   │  │  │
│  │  │ - Context Management │  │  │    │  │  │ Feedback Storage     │  │  │
│  │  └──────────────────────┘  │  │    │  │  └──────────────────────┘  │  │
│  │  ┌──────────────────────┐  │  │    │  │                            │  │
│  │  │ Question Generator   │  │  │    │  │  Database: Neon PostgreSQL │  │
│  │  │ - Resume Parsing     │  │  │    │  │  - Connection Pooling      │  │
│  │  │ - Question Creation  │  │  │    │  │  - Migrations              │  │
│  │  │ - PyMuPDF Integration│  │  │    │  │  - Type Safety             │  │
│  │  └──────────────────────┘  │  │    │  └────────────────────────────┘  │
│  │  ┌──────────────────────┐  │  │    └──────────────────────────────────┘
│  │  │ Feedback Agent       │  │  │
│  │  │ - Performance Review │  │  │    ┌──────────────────────────────────┐
│  │  │ - Rating Generation  │  │  │    │   MEDIA STORAGE (Cloudinary)     │
│  │  │ - Report Creation    │  │  │    │  ┌────────────────────────────┐  │
│  │  └──────────────────────┘  │  │    │  │  Resume Storage            │  │
│  └────────────────────────────┘  │    │  │  - PDF Upload              │  │
│                                   │    │  │  - URL Generation          │  │
│  ┌────────────────────────────┐  │    │  │  - CDN Delivery            │  │
│  │  LangChain Framework       │  │    │  └────────────────────────────┘  │
│  │  ┌──────────────────────┐  │  │    └──────────────────────────────────┘
│  │  │ Google Gemini 2.5    │  │  │
│  │  │ - Question Gen       │  │  │
│  │  │ - Interview Logic    │  │  │
│  │  │ - Feedback Gen       │  │  │
│  │  └──────────────────────┘  │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### Voice Interview Flow

```
User Starts Interview
        ↓
Browser Detection (Async)
        ↓
Microphone Permission Request
        ↓
Speech Recognition Initialization
        ↓
AI Asks First Question
        ↓
TTS Speaks Question
        ↓
[INTERVIEW LOOP]
        ↓
User Speaks Answer
        ↓
Speech Recognition Captures
        ↓
Silence Detection (8-10s)
        ↓
Submit Answer to Backend
        ↓
LangChain + Gemini Processes
        ↓
Generate Next Question
        ↓
[Repeat until time expires]
        ↓
Save Transcript to Database
        ↓
Generate AI Feedback
        ↓
Save Feedback to Database
        ↓
Cleanup Resources
        ↓
Redirect to Dashboard
```

## 🛠️ Tech Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5.3 | React framework with SSR, routing, and API routes |
| **React** | 19.1.0 | UI component library with latest features |
| **TypeScript** | 5.x | Type-safe JavaScript with enhanced IDE support |
| **TailwindCSS** | 4.x | Utility-first CSS framework for rapid styling |
| **Radix UI** | Latest | Accessible, unstyled component primitives |
| **Framer Motion** | 12.23.13 | Animation library for smooth transitions |
| **Lucide React** | 0.544.0 | Beautiful, consistent icon set |
| **next-themes** | 0.4.6 | Theme management (dark/light mode) |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | Latest | High-performance Python web framework |
| **Prisma** | 6.16.1 | Next-generation ORM with type safety |
| **NextAuth** | 5.0.0-beta.29 | Authentication solution for Next.js |
| **bcryptjs** | 3.0.2 | Password hashing and security |
| **Zod** | 4.1.8 | TypeScript-first schema validation |

### AI & Machine Learning

| Technology | Version | Purpose |
|------------|---------|---------|
| **LangChain** | Latest | Framework for LLM application development |
| **Google Gemini** | 2.5 Pro | Advanced language model for interviews |
| **React Speech Recognition** | 4.0.1 | Browser speech-to-text API wrapper |
| **PyMuPDF** | Latest | PDF processing and text extraction |

### Infrastructure & DevOps

| Technology | Version | Purpose |
|------------|---------|---------|
| **Cloudinary** | 2.7.0 | Cloud-based media management |
| **Vercel Analytics** | 1.5.0 | Performance and usage analytics |
| **Docker** | - | Containerization (Dockerfile included) |
| **PostgreSQL** | Latest | Primary database (Neon hosted) |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **Jest** | 29.7.0 | JavaScript testing framework |
| **Testing Library** | 14.3.1 | React component testing utilities |
| **ESLint** | 9.x | Code linting and quality enforcement |
| **Husky** | 9.1.7 | Git hooks for pre-commit validation |
| **pnpm** | Latest | Fast, disk-efficient package manager |

## 📦 Installation

### Prerequisites

Before you begin, ensure you have:

- **Node.js**: >= 18.x (Required by Next.js 15)
- **pnpm**: Latest version
- **Python**: >= 3.8 (For FastAPI backend)
- **PostgreSQL**: Database (or use Neon)
- **Git**: For version control

### Step-by-Step Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/ABHI-Theq/zerko.git
cd zerko
```

#### 2. Install Node.js Dependencies

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install project dependencies
pnpm install
```

#### 3. Install Python Dependencies

```bash
# Navigate to AI backend
cd zerko-interview-agent

# Install dependencies
pip install -r requirements.txt

# Or using uv (recommended)
uv pip install -r requirements.txt

# Return to root
cd ..
```

#### 4. Set Up Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Required Environment Variables:**

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/zerko"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google AI (for LangChain)
GOOGLE_API_KEY="your-google-ai-api-key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# FastAPI Backend URL
NEXT_PUBLIC_AGENT_API_URL="http://localhost:8000"

# Optional: Sentry
SENTRY_DSN="your-sentry-dsn"

# Optional: Vercel Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID="your-analytics-id"
```

#### 5. Set Up Database

```bash
# Generate Prisma Client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# Optional: Seed the database
pnpm prisma db seed
```

#### 6. Verify Installation

```bash
# Run tests
pnpm test

# Check for linting issues
pnpm lint

# Validate Prisma schema
pnpm prisma validate
```

## 🎮 Usage

### Development Mode

#### Start Frontend Server

```bash
# In root directory
pnpm dev
```

Visit **http://localhost:3000**

#### Start AI Backend

```bash
# In separate terminal
cd zerko-interview-agent
python app.py
```

Backend runs on **http://localhost:8000**

### Production Build

```bash
# Create optimized production build
pnpm build

# Start production server
pnpm start
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Database Management

```bash
# Open Prisma Studio (Database GUI)
pnpm prisma studio

# Create a new migration
pnpm prisma migrate dev --name your_migration_name

# Reset database (WARNING: Deletes all data)
pnpm prisma migrate reset

# Deploy migrations to production
pnpm prisma migrate deploy
```

### Docker Deployment

```bash
# Build Docker image
docker build -t zerko .

# Run container
docker run -p 3000:3000 zerko

# Or use Docker Compose
docker-compose up
```

## 📚 Documentation

### Core Documentation

- **[TESTING_GUIDE.md](docs/TESTING_GUIDE.md)** - Comprehensive testing guide with best practices
- **[INTERVIEW_FLOW.md](docs/INTERVIEW_FLOW.md)** - Complete interview flow from start to finish
- **[VOICE_AGENT.md](docs/VOICE_AGENT.md)** - Voice agent system architecture and implementation
- **[VOICE_INTERVIEW_TROUBLESHOOTING.md](docs/VOICE_INTERVIEW_TROUBLESHOOTING.md)** - Troubleshooting guide for voice issues

### Quick References

- **[TESTING_QUICK_REFERENCE.md](docs/TESTING_QUICK_REFERENCE.md)** - Quick testing commands and patterns
- **[TESTING_SUMMARY.md](docs/TESTING_SUMMARY.md)** - Testing implementation summary

### Additional Documentation

- **[TESTING.md](TESTING.md)** - Detailed testing documentation
- **[INTERVIEW_SYSTEM_COMPLETE.md](INTERVIEW_SYSTEM_COMPLETE.md)** - Complete interview system documentation
- **[VOICE_INTERVIEW_FIXES.md](VOICE_INTERVIEW_FIXES.md)** - Voice interview fixes and improvements

## 🧪 Testing

### Test Coverage

- **Total Test Files**: 7
- **Total Test Cases**: 137+
- **Lines of Test Code**: 1,390+
- **Coverage Target**: 70%+

### Test Categories

| Category | Files | Test Cases | Coverage |
|----------|-------|------------|----------|
| Components | 3 | 45+ | 80% |
| API Routes | 1 | 15+ | 30% |
| Utilities | 2 | 42+ | 80% |
| Hooks | 1 | 35+ | 40% |

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test Button

# Run tests matching pattern
pnpm test components

# Watch mode for development
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# Update snapshots
pnpm test -- -u

# Verbose output
pnpm test -- --verbose
```

### Test Structure

```
src/__tests__/
├── api/
│   └── sign-up.test.ts          # API route tests
├── components/
│   ├── Button.test.tsx          # UI component tests
│   ├── Navbar.test.tsx          # Navigation tests
│   └── Signin.test.tsx          # Form component tests
├── hooks/
│   └── useLocalStorage.test.ts  # Custom hook tests
├── lib/
│   └── utils.test.ts            # Utility function tests
└── util/
    └── password.test.ts         # Password utility tests
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

### Environment Variables on Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_AGENT_API_URL`

### Docker Deployment

```bash
# Build image
docker build -t zerko:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name zerko \
  zerko:latest

# Or use Docker Compose
docker-compose up -d
```

### Manual Deployment

```bash
# Build application
pnpm build

# Start production server
pnpm start

# Or use PM2 for process management
pm2 start npm --name "zerko" -- start
```

## 📁 Project Structure

```
zerko/
├── .github/                    # GitHub Actions and workflows
├── .husky/                     # Git hooks configuration
├── docs/                       # Documentation files
│   ├── TESTING_GUIDE.md
│   ├── INTERVIEW_FLOW.md
│   ├── VOICE_AGENT.md
│   └── VOICE_INTERVIEW_TROUBLESHOOTING.md
├── prisma/
│   ├── migrations/             # Database migration files
│   └── schema.prisma           # Prisma schema definition
├── public/                     # Static assets
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Authentication pages
│   │   ├── (root)/             # Public pages
│   │   ├── api/                # API routes
│   │   ├── dashboard/          # Dashboard page
│   │   ├── interview/          # Interview pages
│   │   └── ...
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI components
│   │   └── ...
│   ├── context/                # React Context providers
│   ├── features/               # Feature-specific modules
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions
│   ├── types/                  # TypeScript type definitions
│   ├── __tests__/              # Test files
│   └── ...
├── zerko-interview-agent/      # Python FastAPI backend
│   ├── AI_interview_agent.py   # Interview agent logic
│   ├── Question_generator_agent.py  # Question generation
│   ├── FeedBackReportAgent.py  # Feedback generation
│   ├── app.py                  # FastAPI application
│   └── requirements.txt        # Python dependencies
├── .env.example                # Example environment variables
├── docker-compose.yml          # Docker Compose configuration
├── Dockerfile                  # Docker build instructions
├── jest.config.js              # Jest configuration
├── next.config.ts              # Next.js configuration
├── package.json                # Node.js dependencies
├── README.md                   # This file
└── tsconfig.json               # TypeScript configuration
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/zerko.git
   ```
3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes**
5. **Run tests**
   ```bash
   pnpm test
   ```
6. **Commit your changes**
   ```bash
   git commit -m "Add: your feature description"
   ```
7. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Create a Pull Request**

### Contribution Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Keep commits atomic and well-described
- Ensure all tests pass before submitting PR

### Code Style

- **TypeScript**: Use strict type checking
- **React**: Functional components with hooks
- **CSS**: TailwindCSS utility classes
- **Naming**: camelCase for variables, PascalCase for components

### Testing Requirements

- All new features must have tests
- Maintain minimum 70% code coverage
- Tests must pass before merging

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

### Get Help

- **Email**: abhi03085e@gmail.com
- **GitHub Issues**: [Create an issue](https://github.com/ABHI-Theq/zerko/issues)
- **Documentation**: Check the [docs](docs/) folder

### Reporting Bugs

When reporting bugs, please include:

1. Browser name and version (Note: Voice interviews on Brave browser currently use text input)
2. Operating system
3. Steps to reproduce
4. Expected vs actual behavior
5. Screenshots (if applicable)
6. Console errors (F12 → Console)

**Known Issues:**
- Brave Browser: Voice recognition currently defaults to text input due to Speech Recognition API limitations. This is being actively worked on.

### Feature Requests

We love feature requests! Please:

1. Check existing issues first
2. Describe the feature clearly
3. Explain the use case
4. Provide examples if possible

## 🙏 Acknowledgments

- **Next.js Team** - Amazing React framework
- **Vercel** - Hosting and deployment platform
- **Google** - Gemini AI API
- **LangChain** - LLM orchestration framework
- **Radix UI** - Accessible component primitives
- **All Contributors** - Thank you for your contributions!

## 📊 Project Stats

- **Stars**: ⭐ Star this repo if you find it useful!
- **Forks**: 🍴 Fork and contribute
- **Issues**: 🐛 Report bugs and request features
- **Pull Requests**: 🔀 Submit your improvements

## 🗺️ Roadmap

### Current Version (v1.0)
- ✅ Voice interview system (Chrome, Firefox, Safari, Edge)
- ✅ Text input fallback for Brave browser
- ✅ AI question generation
- ✅ Feedback system
- ✅ Cross-browser support
- ✅ Brave browser optimization

### Upcoming Features (v1.1)
- 🔄 Full voice support for Brave browser (in progress)
- 🔄 WebRTC integration for better audio
- 🔄 Mobile app (iOS and Android)
- 🔄 Multi-language support
- 🔄 Video interview capability
- 🔄 Advanced analytics dashboard

### Future Plans (v2.0)
- 📅 Scheduling system
- 📅 Team collaboration features
- 📅 Custom branding options
- 📅 API for third-party integrations
- 📅 Offline mode support

---

<div align="center">

**Made with ❤️ by the Zerko Team**

[Website](https://zerko.vercel.app) • [Documentation](docs/) • [GitHub](https://github.com/ABHI-Theq/zerko)

</div>
