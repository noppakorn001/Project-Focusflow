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
import {
  Plus, Trash2, Briefcase, User, BookOpen, Star, Heart, Code, Music, Coffee,
  Gamepad2, Dumbbell, Palette, Camera, Globe, Rocket, Lightbulb, Headphones,
  Wrench, GraduationCap, ShoppingCart, Home, Film, Plane, Utensils, Leaf,
  Smartphone, PenTool, Folder, Zap, Target, MessageSquare, Shield, Database,
  Monitor, Terminal, Bug, GitBranch, FileCode, Layers, Cpu,
} from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const ICONS = {
  // Work & Productivity
  Briefcase,
  Target,
  Lightbulb,
  Rocket,
  Zap,
  Folder,
  Wrench,

  // People & Social
  User,
  MessageSquare,
  Heart,
  Star,

  // Education & Learning
  BookOpen,
  GraduationCap,

  // Development & Tech
  Code,
  Terminal,
  Bug,
  GitBranch,
  FileCode,
  Database,
  Monitor,
  Cpu,
  Layers,
  Globe,
  Smartphone,
  Shield,

  // Creative & Arts
  Palette,
  PenTool,
  Camera,
  Film,
  Music,
  Headphones,

  // Lifestyle
  Coffee,
  Utensils,
  Home,
  Leaf,
  Dumbbell,
  ShoppingCart,
  Plane,

  // Gaming
  Gamepad2,
};

const COLORS = [
  // Blues
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#0ea5e9', // Sky
  '#06b6d4', // Cyan

  // Greens
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#22c55e', // Green
  '#84cc16', // Lime

  // Warm
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow

  // Purples & Pinks
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#ec4899', // Pink

  // Neutral / Unique
  '#f43f5e', // Rose
  '#78716c', // Stone
  '#64748b', // Slate
  '#0891b2', // Dark Cyan
];

const ICON_NAMES = Object.keys(ICONS) as (keyof typeof ICONS)[];

// Friendly display names for icons
const ICON_LABELS: Record<string, string> = {
  Briefcase: 'Work',
  Target: 'Goals',
  Lightbulb: 'Ideas',
  Rocket: 'Launch',
  Zap: 'Quick',
  Folder: 'Files',
  Wrench: 'Tools',
  User: 'Personal',
  MessageSquare: 'Chat',
  Heart: 'Favorite',
  Star: 'Star',
  BookOpen: 'Reading',
  GraduationCap: 'Study',
  Code: 'Code',
  Terminal: 'Terminal',
  Bug: 'Bugs',
  GitBranch: 'Git',
  FileCode: 'Scripts',
  Database: 'Database',
  Monitor: 'Desktop',
  Cpu: 'Hardware',
  Layers: 'Layers',
  Globe: 'Web',
  Smartphone: 'Mobile',
  Shield: 'Security',
  Palette: 'Design',
  PenTool: 'Draw',
  Camera: 'Photo',
  Film: 'Video',
  Music: 'Music',
  Headphones: 'Audio',
  Coffee: 'Coffee',
  Utensils: 'Food',
  Home: 'Home',
  Leaf: 'Nature',
  Dumbbell: 'Fitness',
  ShoppingCart: 'Shopping',
  Plane: 'Travel',
  Gamepad2: 'Gaming',
};

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
      <DialogContent className="sm:max-w-[480px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)] pr-4">
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
                <div className="grid gap-3">
                  <Input
                    placeholder="Category Name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Icon</Label>
                    <div className="grid grid-cols-8 gap-1.5">
                      {ICON_NAMES.map((iconName) => {
                        const Icon = ICONS[iconName];
                        return (
                          <Tooltip key={iconName}>
                            <TooltipTrigger asChild>
                              <Button
                                variant={selectedIcon === iconName ? "default" : "outline"}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setSelectedIcon(iconName)}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              {ICON_LABELS[iconName] || iconName}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Color</Label>
                    <div className="grid grid-cols-10 gap-1.5">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === color ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'
                            }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedColor(color)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  {newCategoryName && (
                    <div className="flex items-center gap-2 rounded-md border border-dashed p-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        {(() => {
                          const PreviewIcon = ICONS[selectedIcon];
                          return <PreviewIcon className="h-4 w-4" style={{ color: selectedColor }} />;
                        })()}
                      </div>
                      <span className="text-sm font-medium">{newCategoryName}</span>
                      <span className="text-xs text-muted-foreground ml-auto">Preview</span>
                    </div>
                  )}

                  <Button onClick={handleAddCategory} className="mt-1">Add Category</Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
