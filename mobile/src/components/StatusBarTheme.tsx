import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useThemeContext } from '../context/ThemeContext';

/** Renders StatusBar with style that matches the current theme (light content on dark, dark content on light). */
export default function StatusBarTheme() {
  const theme = useThemeContext();
  const style = theme?.colorScheme === 'dark' ? 'light' : 'dark';
  return <StatusBar style={style} />;
}
