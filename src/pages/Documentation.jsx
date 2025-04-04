import React, { useState, useEffect } from 'react';
import { Documentation } from '@/api/entities';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import ReactMarkdown from 'react-markdown';
import { Search, Book, Code, Settings, AlertTriangle, Users, History, FileText } from 'lucide-react';

export default function DocumentationPage() {
  const [docs, setDocs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('technical');

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    const data = await Documentation.list('order');
    setDocs(data);
  };

  const filteredDocs = docs.filter(doc => 
    doc.category === activeCategory &&
    (doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     doc.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getIcon = (type) => {
    switch (type) {
      case 'installation':
        return <Code className="w-5 h-5" />;
      case 'api':
        return <Code className="w-5 h-5" />;
      case 'config':
        return <Settings className="w-5 h-5" />;
      case 'troubleshooting':
        return <AlertTriangle className="w-5 h-5" />;
      case 'manual':
        return <Book className="w-5 h-5" />;
      case 'release_notes':
        return <History className="w-5 h-5" />;
      case 'best_practices':
        return <FileText className="w-5 h-5" />;
      default:
        return <Book className="w-5 h-5" />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Documentation</h1>
          <p className="text-gray-500">Technical and user guides for GVTools</p>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        <Card className="md:col-span-3">
          <CardContent className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search documentation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Tabs defaultValue="technical" onValueChange={setActiveCategory}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="technical">
                  <Code className="w-4 h-4 mr-2" />
                  Technical
                </TabsTrigger>
                <TabsTrigger value="user">
                  <Users className="w-4 h-4 mr-2" />
                  User
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <ScrollArea className="h-[600px] mt-4">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-lg hover:bg-gray-100 cursor-pointer mb-2"
                >
                  <div className="flex items-center gap-2">
                    {getIcon(doc.type)}
                    <div>
                      <h3 className="font-medium">{doc.title}</h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {doc.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="md:col-span-9">
          <CardContent className="p-6">
            <ScrollArea className="h-[700px]">
              {filteredDocs.map((doc) => (
                <div key={doc.id} className="prose max-w-none mb-8">
                  <ReactMarkdown>{doc.content}</ReactMarkdown>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}