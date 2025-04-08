
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Copy, CheckCircle, Container, FileCode, Terminal } from "lucide-react";

export default function DockerInstructions() {
  const [copied, setCopied] = useState({
    dockerfile: false,
    dockerignore: false,
    dockercommands: false
  });

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied({ ...copied, [field]: true });
        setTimeout(() => {
          setCopied({ ...copied, [field]: false });
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  const dockerfileContent = `# Use Node.js as the base image
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies with clean npm install and no audit
RUN npm install --no-audit

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine as production

# Copy the build output
COPY --from=build /app/dist /usr/share/nginx/html

# Configure nginx for SPA
RUN echo 'server { \\
    listen 80; \\
    location / { \\
        root /usr/share/nginx/html; \\
        index index.html; \\
        try_files $uri $uri/ /index.html; \\
    } \\
    # Cache static assets \\
    location /assets/ { \\
        root /usr/share/nginx/html; \\
        expires 1y; \\
        add_header Cache-Control "public, no-transform"; \\
    } \\
    # Security headers \\
    add_header X-Frame-Options "SAMEORIGIN"; \\
    add_header X-XSS-Protection "1; mode=block"; \\
    add_header X-Content-Type-Options "nosniff"; \\
    add_header Referrer-Policy "strict-origin-when-cross-origin"; \\
    add_header Content-Security-Policy "default-src *; style-src * *;"; \\
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]`;

  const dockerignoreContent = `# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Version control
.git
.gitignore
.github

# IDE
.idea
.vscode
*.swp
*.swo

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# OS
.DS_Store
Thumbs.db

# Build
dist
build
coverage

# Logs
logs
*.log

# Tests
__tests__
*.test.js
*.spec.js`;

  const dockerCommands = `# Build the Docker image
docker build -t gvtools:latest .

# Run the container
docker run -d -p 8080:80 --name gvtools gvtools:latest

# Access the application at http://localhost:8080`;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2 flex items-center">
        <Container className="inline-block mr-2 mb-1" />
        Docker Setup Instructions
      </h1>
      <p className="text-gray-600 mb-8">
        Follow these instructions to containerize your GVTools application using Docker
      </p>

      <div className="grid grid-cols-1 gap-8">
        {/* Dockerfile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileCode className="mr-2" />
              Dockerfile
            </CardTitle>
            <CardDescription>
              Create a file named <code>Dockerfile</code> in your project root with the following content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto">
              <pre className="whitespace-pre">{dockerfileContent}</pre>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard(dockerfileContent, 'dockerfile')}
              className="flex items-center"
            >
              {copied.dockerfile ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Dockerfile
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* .dockerignore */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileCode className="mr-2" />
              .dockerignore
            </CardTitle>
            <CardDescription>
              Create a file named <code>.dockerignore</code> in your project root to exclude unnecessary files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto">
              <pre className="whitespace-pre">{dockerignoreContent}</pre>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard(dockerignoreContent, 'dockerignore')}
              className="flex items-center"
            >
              {copied.dockerignore ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy .dockerignore
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Docker Commands */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Terminal className="mr-2" />
              Build and Run Commands
            </CardTitle>
            <CardDescription>
              Run these commands to build and start your Docker container
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto">
              <pre className="whitespace-pre">{dockerCommands}</pre>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard(dockerCommands, 'dockercommands')}
              className="flex items-center"
            >
              {copied.dockercommands ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Commands
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Additional Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Environment Variables</h3>
              <p className="text-gray-600">
                If your application uses environment variables, you can pass them when running the container:
              </p>
              <div className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto mt-2">
                <code>docker run -d -p 8080:80 -e API_URL=http://api.example.com --name gvtools gvtools:latest</code>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Volume Mounts</h3>
              <p className="text-gray-600">
                For persistent data, you can use Docker volumes:
              </p>
              <div className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto mt-2">
                <code>docker run -d -p 8080:80 -v gvtools_data:/app/data --name gvtools gvtools:latest</code>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Docker Compose</h3>
              <p className="text-gray-600">
                For more complex setups, consider using Docker Compose to manage your containers.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
