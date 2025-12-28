import { Injectable, Logger } from '@nestjs/common';
import { GithubService } from '../github/github.service';

/**
 * Template definitions for each tech stack
 * These files will be automatically created when a user creates a new repository
 */
export interface TemplateFile {
    path: string;
    content: string;
}

export type TechStackTemplate = 'nodejs' | 'react' | 'nextjs' | 'python' | 'static' | 'empty';

@Injectable()
export class TemplateService {
    private readonly logger = new Logger(TemplateService.name);

    constructor(private readonly githubService: GithubService) { }

    /**
     * Get template files for a specific tech stack
     */
    getTemplateFiles(techStack: TechStackTemplate, repoName: string): TemplateFile[] {
        switch (techStack) {
            case 'nodejs':
                return this.getNodeJsTemplate(repoName);
            case 'react':
                return this.getReactTemplate(repoName);
            case 'nextjs':
                return this.getNextJsTemplate(repoName);
            case 'python':
                return this.getPythonTemplate(repoName);
            case 'static':
                return this.getStaticTemplate(repoName);
            case 'empty':
            default:
                return []; // Empty template - no files to create
        }
    }

    /**
     * Initialize a repository with template files
     */
    async initializeTemplate(
        repoFullName: string,
        techStack: TechStackTemplate,
        userId: string,
    ): Promise<void> {
        const repoName = repoFullName.split('/')[1] || repoFullName;
        const files = this.getTemplateFiles(techStack, repoName);

        if (files.length === 0) {
            this.logger.log(`No template files to create for ${techStack} stack`);
            return;
        }

        this.logger.log(`Initializing ${techStack} template for ${repoFullName} with ${files.length} files`);

        await this.githubService.pushTemplateFiles(repoFullName, files, userId);

        this.logger.log(`Successfully initialized ${techStack} template for ${repoFullName}`);
    }

    // ============================================
    // Template Definitions
    // ============================================

    private getNodeJsTemplate(repoName: string): TemplateFile[] {
        return [
            {
                path: 'package.json',
                content: JSON.stringify(
                    {
                        name: repoName.toLowerCase(),
                        version: '1.0.0',
                        description: `${repoName} - Created with Project Operation Hub`,
                        main: 'src/index.js',
                        scripts: {
                            start: 'node src/index.js',
                            dev: 'node --watch src/index.js',
                            build: "echo 'No build step required'",
                            test: "echo 'No tests configured' && exit 0",
                        },
                        keywords: [],
                        author: '',
                        license: 'ISC',
                    },
                    null,
                    2,
                ),
            },
            {
                path: 'src/index.js',
                content: `// ${repoName} - Entry Point
// Created with Project Operation Hub

console.log('Hello from ${repoName}!');

// TODO: Add your application logic here
`,
            },
            {
                path: '.gitignore',
                content: `# Dependencies
node_modules/

# Build output
dist/
build/

# Environment files
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`,
            },
        ];
    }

    private getReactTemplate(repoName: string): TemplateFile[] {
        return [
            {
                path: 'package.json',
                content: JSON.stringify(
                    {
                        name: repoName.toLowerCase(),
                        version: '0.1.0',
                        private: true,
                        type: 'module',
                        scripts: {
                            dev: 'vite',
                            build: 'vite build',
                            preview: 'vite preview',
                            lint: "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0 || echo 'No eslint configured'",
                            test: "echo 'No tests configured' && exit 0",
                        },
                        dependencies: {
                            react: '^18.2.0',
                            'react-dom': '^18.2.0',
                        },
                        devDependencies: {
                            '@vitejs/plugin-react': '^4.0.0',
                            vite: '^5.0.0',
                        },
                    },
                    null,
                    2,
                ),
            },
            {
                path: 'index.html',
                content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${repoName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,
            },
            {
                path: 'src/main.jsx',
                content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`,
            },
            {
                path: 'src/App.jsx',
                content: `import './App.css'

function App() {
  return (
    <div className="App">
      <h1>Welcome to ${repoName}</h1>
      <p>Created with Project Operation Hub</p>
    </div>
  )
}

export default App
`,
            },
            {
                path: 'src/App.css',
                content: `.App {
  text-align: center;
  padding: 2rem;
}

h1 {
  color: #333;
}
`,
            },
            {
                path: 'src/index.css',
                content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}
`,
            },
            {
                path: 'vite.config.js',
                content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`,
            },
            {
                path: '.gitignore',
                content: `# Dependencies
node_modules/

# Build
dist/
build/

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*

# IDE
.idea/
.vscode/

# OS
.DS_Store
`,
            },
        ];
    }

    private getNextJsTemplate(repoName: string): TemplateFile[] {
        return [
            {
                path: 'package.json',
                content: JSON.stringify(
                    {
                        name: repoName.toLowerCase(),
                        version: '0.1.0',
                        private: true,
                        scripts: {
                            dev: 'next dev',
                            build: 'next build',
                            start: 'next start',
                            lint: 'next lint || echo "No lint configured"',
                            test: "echo 'No tests configured' && exit 0",
                        },
                        dependencies: {
                            next: '^14.0.0',
                            react: '^18.2.0',
                            'react-dom': '^18.2.0',
                        },
                    },
                    null,
                    2,
                ),
            },
            {
                path: 'app/page.tsx',
                content: `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Welcome to ${repoName}</h1>
      <p className="mt-4 text-gray-600">Created with Project Operation Hub</p>
    </main>
  )
}
`,
            },
            {
                path: 'app/layout.tsx',
                content: `import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '${repoName}',
  description: 'Created with Project Operation Hub',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`,
            },
            {
                path: 'next.config.js',
                content: `/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig
`,
            },
            {
                path: 'tsconfig.json',
                content: JSON.stringify(
                    {
                        compilerOptions: {
                            target: 'es5',
                            lib: ['dom', 'dom.iterable', 'esnext'],
                            allowJs: true,
                            skipLibCheck: true,
                            strict: true,
                            noEmit: true,
                            esModuleInterop: true,
                            module: 'esnext',
                            moduleResolution: 'bundler',
                            resolveJsonModule: true,
                            isolatedModules: true,
                            jsx: 'preserve',
                            incremental: true,
                            plugins: [{ name: 'next' }],
                            paths: { '@/*': ['./*'] },
                        },
                        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
                        exclude: ['node_modules'],
                    },
                    null,
                    2,
                ),
            },
            {
                path: '.gitignore',
                content: `# Dependencies
node_modules/

# Next.js
.next/
out/

# Production
build/

# Environment
.env
.env.local
.env.*.local

# Debug
npm-debug.log*

# IDE
.idea/
.vscode/

# OS
.DS_Store
`,
            },
        ];
    }

    private getPythonTemplate(repoName: string): TemplateFile[] {
        return [
            {
                path: 'requirements.txt',
                content: `# ${repoName} - Python Dependencies
# Add your dependencies here, e.g.:
# flask==2.3.0
# requests==2.31.0
`,
            },
            {
                path: 'main.py',
                content: `"""
${repoName} - Main Entry Point
Created with Project Operation Hub
"""

def main():
    print(f"Hello from ${repoName}!")
    # TODO: Add your application logic here

if __name__ == "__main__":
    main()
`,
            },
            {
                path: '.gitignore',
                content: `# Byte-compiled / optimized files
__pycache__/
*.py[cod]
*$py.class

# Virtual environment
venv/
env/
.venv/

# Environment files
.env
.env.local

# IDE
.idea/
.vscode/
*.swp

# Distribution
dist/
build/
*.egg-info/

# Logs
*.log

# OS
.DS_Store
Thumbs.db
`,
            },
        ];
    }

    private getStaticTemplate(repoName: string): TemplateFile[] {
        return [
            {
                path: 'index.html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${repoName}</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <main>
        <h1>Welcome to ${repoName}</h1>
        <p>Created with Project Operation Hub</p>
    </main>
    <script src="js/main.js"></script>
</body>
</html>
`,
            },
            {
                path: 'css/style.css',
                content: `/* ${repoName} - Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
}

main {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
}

h1 {
    margin-bottom: 1rem;
    color: #2563eb;
}
`,
            },
            {
                path: 'js/main.js',
                content: `// ${repoName} - JavaScript
// Created with Project Operation Hub

console.log('${repoName} loaded successfully!');

// TODO: Add your JavaScript logic here
`,
            },
            {
                path: '.gitignore',
                content: `# IDE
.idea/
.vscode/

# OS
.DS_Store
Thumbs.db

# Build (if any)
dist/
build/
`,
            },
        ];
    }
}
