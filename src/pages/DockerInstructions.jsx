import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileDown, Copy, ChevronRight } from "lucide-react";

export default function DockerInstructions() {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  const dockerfileContent = `# Use Node.js as the base image
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine as production

# Copy the build output
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]`;

  const dockerignoreContent = `node_modules
npm-debug.log
.git
.github
.vscode
README.md
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local`;

  const buildCommands = `# Build the image
docker build -t gvtools-app .

# Run the container
docker run -p 8080:80 gvtools-app`;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Docker Instructions</h1>
      <p className="text-gray-600 mb-8">
        Follow these steps to containerize your GVTools application.
      </p>
      
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="mr-2">Step 1:</span> Create a Dockerfile
            </CardTitle>
            <CardDescription>
              Create a file named "Dockerfile" (no extension) in the root of your project with the following content:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto">
              <pre className="whitespace-pre-wrap">{dockerfileContent}</pre>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => copyToClipboard(dockerfileContent)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Dockerfile
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="mr-2">Step 2:</span> Create a .dockerignore file
            </CardTitle>
            <CardDescription>
              Create a file named ".dockerignore" in the root of your project to exclude unnecessary files:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto">
              <pre className="whitespace-pre-wrap">{dockerignoreContent}</pre>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => copyToClipboard(dockerignoreContent)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy .dockerignore
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="mr-2">Step 3:</span> Build and Run the Container
            </CardTitle>
            <CardDescription>
              Open a terminal in your project's root directory and run these commands:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto">
              <pre className="whitespace-pre-wrap">{buildCommands}</pre>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => copyToClipboard(buildCommands)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Commands
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Additional Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              For a production deployment, you might want to consider:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Adding environment variables for configuration</li>
              <li>Setting up a custom Nginx configuration for routing</li>
              <li>Implementing health checks</li>
              <li>Using Docker Compose for multi-container setups</li>
              <li>Setting up a CI/CD pipeline for automated builds</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}