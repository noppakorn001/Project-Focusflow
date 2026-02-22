'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Briefcase, User, BookOpen, Star, Heart, Code, Music, Coffee } from 'lucide-react';
import { toast } from 'sonner';

const ICONS = {
  Briefcase,
  User,
  BookOpen,
  Star,
  Heart,
  Code,
  Music,
  Coffee,
};

const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

export function CategoryManager() {
  const { categories, addCategory, deleteCategory } = useStore();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof ICONS>('Star');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isOpen, setIsOpen] = useState(false);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    addCategory({
      name: newCategoryName,
      icon: selectedIcon,
      color: selectedColor,
    });
    
    setNewCategoryName('');
    setIsOpen(false);
    toast.success('Category added');
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Delete this category? Tasks will be unassigned.')) {
      deleteCategory(id);
      toast.success('Category deleted');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" /> Manage Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Existing Categories</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {categories.map((category) => {
                  const Icon = ICONS[category.icon as keyof typeof ICONS] || Star;
                  return (
                    <div key={category.id} className="flex items-center justify-between rounded-md border p-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <Icon className="h-4 w-4" style={{ color: category.color }} />
                        </div>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={categories.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <Label>Add New Category</Label>
              <div className="grid gap-2">
                <Input
                  placeholder="Category Name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Icon</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(ICONS).map((iconName) => {
                      const Icon = ICONS[iconName as keyof typeof ICONS];
                      return (
                        <Button
                          key={iconName}
                          variant={selectedIcon === iconName ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedIcon(iconName as keyof typeof ICONS)}
                        >
                          <Icon className="h-4 w-4" />
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        className={`h-6 w-6 rounded-full border-2 ${
                          selectedColor === color ? 'border-primary' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                </div>

                <Button onClick={handleAddCategory} className="mt-2">Add Category</Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
