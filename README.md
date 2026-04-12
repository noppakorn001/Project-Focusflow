# FocusFlow

![FocusFlow Cover](https://via.placeholder.com/1200x630/fafafa/171717?text=FocusFlow+Productivity+Suite)

FocusFlow is a next-generation productivity suite designed for modern knowledge workers and developers. Built with a pristine, Vercel-inspired minimal aesthetic, it seamlessly merges an advanced Pomodoro timer with intelligent task management and rich visual analytics.

## ✨ Features

- **Advanced Task Management**
  - **Smart Sort**: Automatically ranks tasks based on a custom algorithm weighing priority, approaching deadlines, and focus time already invested.
  - **Project Tracking**: Group tasks by project and track overall completion with visual progress bars.
  - **Rich Metadata**: Categorize tasks with custom colors, priorities (Low/Medium/High), tags, and deadlines.

- **Intelligent Focus Timer**
  - **Seamless Integration**: Link active focus sessions directly to specific tasks to automatically log time spent.
  - **Session Reflections**: Post-session prompts allow you to rate focus quality and log observations to improve future productivity.
  - **Standard Modes**: Configurable Focus, Short Break, and Long Break modes.

- **Visual Analytics**
  - **Focus Heatmap**: A GitHub-style 52-week activity heatmap showcasing your daily focus consistency.
  - **Smart Insights**: Automatically generated text insights based on your peak productive hours and completion rates.
  - **Rich Charts**: Visualize your task status, completion rates, and focus distribution by category and priority.

- **Cloud Sync**
  - Safely back up and sync your local data across devices using Google Drive integration.

## 🎨 Design System

FocusFlow completely embraces a **white-canvas, Vercel-inspired aesthetic**:
- **Typography-first**: Driven by the beautifully engineered **Geist** and **Geist Mono** fonts. Dynamic, negative letter-spacing for impactful display headings.
- **Shadow-as-Border**: Complete removal of traditional CSS borders in favor of precise, multi-layered box-shadows (`rgba(0,0,0,0.08) 0px 0px 0px 1px`).
- **Workflow Palette**: Strictly monochromatic base (`#ffffff` canvas, `#171717` primary text) allowing functional colors (Develop Blue `#0a72ef`, Ship Red `#ff5b4f`) to stand out for essential actions.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Custom Vercel Design Tokens
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Persistent local storage)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Forms**: React Hook Form + Zod

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js (v18.17+) installed.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/focusflow.git
   cd focusflow
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

- `/app`: Next.js App Router pages (`/tasks`, `/timer`, `/analytics`, `/settings`) and global layouts.
- `/components`: Reusable UI components including the Sidebar, Smart Sort Table, Heatmap, and Dialogs.
- `/lib`: Core utilities and the Zustand store (`store.ts`) for global state management.

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request if you'd like to improve FocusFlow.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
