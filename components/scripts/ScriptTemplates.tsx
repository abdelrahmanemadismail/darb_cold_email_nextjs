'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Play, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface ScriptTemplate {
  id: string;
  name: string;
  description?: string;
  scriptType: string; // 'apollo', 'linkedin', etc.
  parameters: Record<string, unknown>;
}

interface ScriptTemplatesProps {
  onRunTemplate?: (template: ScriptTemplate) => void;
}

export function ScriptTemplates({ onRunTemplate }: ScriptTemplatesProps) {
  const [templates, setTemplates] = useState<ScriptTemplate[]>(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scriptTemplates');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const saveTemplates = (newTemplates: ScriptTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('scriptTemplates', JSON.stringify(newTemplates));
  };

  const getScriptTypeName = (type: string) => {
    switch (type) {
      case 'apollo':
        return 'Apollo.io';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    // This would normally come from the dialog form
    const newTemplate: ScriptTemplate = {
      id: Date.now().toString(),
      name: templateName,
      description: templateDescription,
      scriptType: 'apollo',
      parameters: {}, // Would be filled from form
    };

    saveTemplates([...templates, newTemplate]);
    toast.success('Template saved');
    setSaveDialogOpen(false);
    setTemplateName('');
    setTemplateDescription('');
  };

  const handleDeleteTemplate = (id: string) => {
    saveTemplates(templates.filter(t => t.id !== id));
    toast.success('Template deleted');
  };

  const handleRunTemplate = (template: ScriptTemplate) => {
    onRunTemplate?.(template);
    toast.info(`Running template: ${template.name}`);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Script Templates</CardTitle>
              <CardDescription>
                Save and reuse common script configurations
              </CardDescription>
            </div>
            <Button onClick={() => setSaveDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">No templates saved yet</p>
              <Button variant="outline" onClick={() => setSaveDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Template
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {getScriptTypeName(template.scriptType)}
                      </Badge>
                    </div>
                    {template.description && (
                      <CardDescription className="text-xs">
                        {template.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Parameters Preview */}
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(template.parameters.personTitles) &&
                        (template.parameters.personTitles as unknown[]).slice(0, 3).map((title: unknown) => (
                          <Badge key={String(title)} variant="outline" className="text-xs">
                            {String(title)}
                          </Badge>
                        ))}
                      {Array.isArray(template.parameters.personTitles) &&
                        (template.parameters.personTitles as unknown[]).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(template.parameters.personTitles as unknown[]).length - 3} more
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleRunTemplate(template)}
                      >
                        <Play className="mr-1 h-3 w-3" />
                        Run
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Template Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Script Template</DialogTitle>
            <DialogDescription>
              Save your current script configuration as a reusable template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                placeholder="e.g., US Tech CEOs"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input
                placeholder="Brief description of this template"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              <Save className="mr-2 h-4 w-4" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
