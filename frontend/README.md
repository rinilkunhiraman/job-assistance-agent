# Job Application Agent - Frontend

An AI-powered dashboard for optimizing job applications. This tool performs semantic fit analysis, resume optimization, and bespoke outreach generation using a multi-agentic workflow.

## 🚀 Features

- **Semantic Fit Check**: Analyzes your resume against a job description to identify matched skills, missing skill gaps, and seniority alignment.
- **Resume Optimization**: Generates tailored professional summaries, ATS-friendly keywords, and improved experience bullets.
- **Bespoke Outreach**: Crafts personalized cold outreach messages and professional cover letters.
- **History Tracking**: Automatically saves every generation, including original inputs and optimized outputs, for easy tracking and re-use.
- **Streaming UI**: Real-time progress updates as the AI agents process your application.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Validation**: [Zod](https://zod.dev/) & [React Hook Form](https://react-hook-form.com/)

## 🏁 Getting Started

### 1. Prerequisites

- Node.js 18+
- The [Job Application Agent Backend](https://github.com/your-repo/backend) running locally or accessible via URL.

### 2. Installation

```bash
npm install
```

### 3. Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start optimizing your applications.

## 📄 License

MIT
