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
import { ConfirmDialog, useConfirmDialog } from '@/components/confirm-dialog';

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
  const { confirm, dialogProps } = useConfirmDialog();

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
    confirm({
      title: 'Delete Category',
      description: 'Delete this category? Tasks in this category will be unassigned.',
      confirmLabel: 'Delete',
      variant: 'destructive',
      onConfirm: () => {
        deleteCategory(id);
        toast.success('Category deleted');
      },
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--card)',
              color: 'var(--foreground)',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 14px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: "'Geist', Arial, sans-serif",
              cursor: 'pointer',
              boxShadow: 'var(--shadow-border-light)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--accent)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--card)')}
          >
            <Plus style={{ width: '13px', height: '13px' }} /> Manage Categories
          </button>
        </DialogTrigger>
        <DialogContent
          style={{
            background: 'var(--card)',
            boxShadow: 'var(--shadow-card-hover)',
            borderRadius: '12px',
            border: 'none',
            maxWidth: '480px',
            maxHeight: '90vh',
          }}
        >
          <DialogHeader>
            <DialogTitle
              style={{
                fontFamily: "'Geist', Arial, sans-serif",
                fontSize: '20px',
                fontWeight: 600,
                letterSpacing: '-0.4px',
                color: 'var(--foreground)',
              }}
            >
              Manage Categories
            </DialogTitle>
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
                        <div
                          key={category.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--card)',
                            boxShadow: 'var(--shadow-border-light)',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            marginBottom: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: `${category.color}18`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Icon style={{ width: '15px', height: '15px', color: category.color }} />
                            </div>
                            <span style={{ fontFamily: "'Geist', Arial, sans-serif", fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>
                              {category.name}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={categories.length <= 1}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'transparent',
                              cursor: categories.length <= 1 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: categories.length <= 1 ? 0.3 : 1,
                              transition: 'background 0.15s ease',
                              color: 'var(--muted-foreground)',
                            }}
                            onMouseEnter={(e) => { if (categories.length > 1) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,91,79,0.12)'; (e.currentTarget as HTMLElement).style.color = '#ff5b4f'; } }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--muted-foreground)'; }}
                          >
                            <Trash2 style={{ width: '14px', height: '14px' }} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <Label>Add New Category</Label>
                  <div className="grid gap-3">
                    <input
                      placeholder="Category Name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--card)',
                        boxShadow: 'var(--shadow-border)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontFamily: "'Geist', Arial, sans-serif",
                        fontSize: '14px',
                        color: 'var(--foreground)',
                        outline: 'none',
                      }}
                      onFocus={(e) => { (e.target as HTMLElement).style.boxShadow = 'var(--shadow-border), 0 0 0 2px var(--focus-blue)'; }}
                      onBlur={(e) => { (e.target as HTMLElement).style.boxShadow = 'var(--shadow-border)'; }}
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

                    <button
                      onClick={handleAddCategory}
                      style={{
                        width: '100%',
                        marginTop: '4px',
                        background: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '10px 16px',
                        fontSize: '14px',
                        fontWeight: 500,
                        fontFamily: "'Geist', Arial, sans-serif",
                        cursor: 'pointer',
                        transition: 'opacity 0.15s ease',
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                    >
                      Add Category
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <ConfirmDialog {...dialogProps} />
    </>
  );
}
