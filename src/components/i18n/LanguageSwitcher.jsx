import React from 'react';
import { useTranslation } from './LanguageContext';
import { Button } from "@/components/ui/button";
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LanguageSwitcher({ variant = 'default' }) {
  const { language, changeLanguage, t } = useTranslation();

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1 text-sm">
        <button
          onClick={() => changeLanguage('en')}
          className={`px-2 py-1 rounded transition-colors ${
            language === 'en' 
              ? 'text-amber-400 font-semibold' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          EN
        </button>
        <span className="text-slate-600">|</span>
        <button
          onClick={() => changeLanguage('fr')}
          className={`px-2 py-1 rounded transition-colors ${
            language === 'fr' 
              ? 'text-amber-400 font-semibold' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          FR
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
          <Globe className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
        <DropdownMenuItem 
          onClick={() => changeLanguage('en')}
          className={language === 'en' ? 'bg-slate-800 text-amber-400' : ''}
        >
          <span className="mr-2">🇬🇧</span> English
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLanguage('fr')}
          className={language === 'fr' ? 'bg-slate-800 text-amber-400' : ''}
        >
          <span className="mr-2">🇫🇷</span> Français
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}