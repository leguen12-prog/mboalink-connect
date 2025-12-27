import React from 'react';
import { useTranslation } from './LanguageContext';

export default function TranslatedText({ tKey, params, className, as: Component = 'span' }) {
  const { t } = useTranslation();
  
  return (
    <Component className={className}>
      {t(tKey, params)}
    </Component>
  );
}