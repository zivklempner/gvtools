
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '@/api/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Folder, 
  FolderOpen, 
  Tag, 
  Check, 
  X,
  LayoutDashboard,
  LayoutGrid, 
  List,
  MoreVertical
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client: '',
    environment: 'production',
    tags: [],
    status: 'active'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await Project.list();
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setFormData({
      name: '',
      description: '',
      client: '',
      environment: 'production',
      tags: [],
      status: 'active'
    });
    setIsEditing(false);
    setShowCreateForm(true);
  };

  const handleEdit = (project) => {
    setFormData({ ...project });
    setIsEditing(true);
    setEditingId(project.id);
    setShowCreateForm(true);
  };

  const handleSelectProject = (projectId) => {
    sessionStorage.setItem('currentProjectId', projectId);
    navigate("/Dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        await Project.update(editingId, formData);
      } else {
        await Project.create(formData);
      }
      
      setShowCreateForm(false);
      loadProjects();
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const handleCancel = () => {
    setShowCreateForm(false);
  };

  const confirmDeleteProject = (project) => {
    setProjectToDelete(project);
    setDialogOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      await Project.delete(projectToDelete.id);
      loadProjects();
      setDialogOpen(false);
      
      // Clear from sessionStorage if it's the current project
      const currentProjectId = sessionStorage.getItem('currentProjectId');
      if (currentProjectId === projectToDelete.id) {
        sessionStorage.removeItem('currentProjectId');
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-gray-500">Manage your Graviton analysis projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            title={`Switch to ${viewMode === 'list' ? 'grid' : 'list'} view`}
          >
            {viewMode === 'list' ? (
              <LayoutGrid className="h-4 w-4" />
            ) : (
              <List className="h-4 w-4" />
            )}
          </Button>
          <Button 
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {showCreateForm ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit Project' : 'Create New Project'}</CardTitle>
            <CardDescription>
              {isEditing ? 'Update project details' : 'Enter details for your new project'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Client/Organization</Label>
                  <Input 
                    id="client" 
                    value={formData.client}
                    onChange={(e) => setFormData({...formData, client: e.target.value})}
                    placeholder="Client or organization name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Project description"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="environment">Environment</Label>
                  <Select 
                    value={formData.environment}
                    onValueChange={(value) => setFormData({...formData, environment: value})}
                  >
                    <SelectTrigger id="environment">
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status}
                    onValueChange={(value) => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input 
                    id="tags" 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag"
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleAddTag}
                  >
                    Add
                  </Button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button 
                          type="button"
                          className="ml-1 text-gray-500 hover:text-gray-700"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isEditing ? 'Update Project' : 'Create Project'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : (
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <Card className="text-center p-8">
              <CardContent className="pt-8">
                <Folder className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold mb-2">No Projects Yet</h2>
                <p className="text-gray-500 mb-6">Create your first project to get started with AWS Graviton compatibility analysis</p>
                <Button 
                  onClick={handleCreateNew}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create First Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Your Projects</CardTitle>
                <CardDescription>Select a project to view its dashboard and analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {viewMode === 'list' ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Project Name</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Environment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">
                            <div 
                              className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
                              onClick={() => handleSelectProject(project.id)}
                            >
                              <FolderOpen className="h-4 w-4 text-blue-500" />
                              {project.name}
                            </div>
                          </TableCell>
                          <TableCell>{project.client || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {project.environment}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                project.status === 'active' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }
                            >
                              {project.status === 'active' ? (
                                <Check className="h-3 w-3 mr-1" />
                              ) : (
                                <X className="h-3 w-3 mr-1" />
                              )}
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(project.created_date), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex items-center gap-1 h-8 hover-highlight"
                                onClick={() => handleSelectProject(project.id)}
                              >
                                <LayoutDashboard className="h-3.5 w-3.5" />
                                Open
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="flex items-center gap-1 h-8 hover-highlight"
                                onClick={() => handleEdit(project)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="flex items-center gap-1 h-8 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover-highlight"
                                onClick={() => confirmDeleteProject(project)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                      <Card key={project.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FolderOpen className="h-5 w-5 text-blue-500" />
                            <span className="truncate">{project.name}</span>
                          </CardTitle>
                          {project.client && (
                            <CardDescription>{project.client}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {project.description && (
                            <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="capitalize">
                              {project.environment}
                            </Badge>
                            <Badge 
                              className={
                                project.status === 'active' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }
                            >
                              {project.status === 'active' ? (
                                <Check className="h-3 w-3 mr-1" />
                              ) : (
                                <X className="h-3 w-3 mr-1" />
                              )}
                              {project.status}
                            </Badge>
                          </div>
                          {project.tags && project.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {project.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-gray-500"
                          >
                            {format(new Date(project.created_date), "MMM d, yyyy")}
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center gap-1 h-8"
                              onClick={() => handleSelectProject(project.id)}
                            >
                              <LayoutDashboard className="h-3.5 w-3.5" />
                              Open
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(project)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => confirmDeleteProject(project)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
