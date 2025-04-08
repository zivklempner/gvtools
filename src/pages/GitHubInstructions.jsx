
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  Copy, 
  Github, 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  Terminal,
  CheckCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GitHubInstructions() {
  const [copied, setCopied] = useState({
    dockerfile: false,
    dockerignore: false,
    gitCommands: false
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

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

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

  const gitCommands = `# Clone your repository (replace with your repository URL)
git clone https://github.com/yourusername/your-repo.git
cd your-repo

# Create the Dockerfile
cat > Dockerfile << 'EOL'
${dockerfileContent}
EOL

# Create .dockerignore
cat > .dockerignore << 'EOL'
${dockerignoreContent}
EOL

# Commit and push the changes
git add Dockerfile .dockerignore
git commit -m "Add Docker configuration"
git push origin main`;

  const uiCommands = `# Steps to add Docker files using the GitHub web interface:

1. Go to your repository
2. Click "Add file" > "Create new file"
3. Name the file "Dockerfile" (no extension)
4. Paste the Dockerfile content
5. Click "Commit new file"
6. Repeat steps 2-5 for ".dockerignore"`;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        <Github className="inline-block mr-2 mb-1" />
        Adding Docker Files to GitHub
      </h1>
      <p className="text-gray-600 mb-8">
        Follow these instructions to add Docker configuration files to your GitHub repository.
      </p>
      
      <Tabs defaultValue="command-line">
        <TabsList className="mb-6">
          <TabsTrigger value="command-line">Command Line</TabsTrigger>
          <TabsTrigger value="github-ui">GitHub UI</TabsTrigger>
        </TabsList>
        
        <TabsContent value="command-line">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Terminal className="mr-2" />
                Command Line Instructions
              </CardTitle>
              <CardDescription>
                Use these commands in your terminal to add Docker files to your repository
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto">
                <pre className="whitespace-pre-wrap">{gitCommands}</pre>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(gitCommands, 'gitCommands')}
                className="flex items-center"
              >
                {copied.gitCommands ? (
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
        </TabsContent>
        
        <TabsContent value="github-ui">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Github className="mr-2" />
                GitHub Web Interface Instructions
              </CardTitle>
              <CardDescription>
                Add Docker files directly through GitHub's web interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto mb-6">
                <pre className="whitespace-pre-wrap">{uiCommands}</pre>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Dockerfile Content</h3>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-x-auto relative">
                    <pre className="whitespace-pre-wrap">{dockerfileContent}</pre>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(dockerfileContent, 'dockerfile')}
                    >
                      {copied.dockerfile ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">.dockerignore Content</h3>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-x-auto relative">
                    <pre className="whitespace-pre-wrap">{dockerignoreContent}</pre>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(dockerignoreContent, 'dockerignore')}
                    >
                      {copied.dockerignore ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              After adding the Docker files to your repository, you can build and run the container using the instructions from the Docker Setup page.
            </li>
            <li>
              Consider setting up GitHub Actions to automatically build and push your Docker image to a registry when changes are pushed to the repository.
            </li>
            <li>
              Update your README.md with Docker usage instructions for other developers.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
