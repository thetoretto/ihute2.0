import React from 'react';

interface PageHeaderProps {
  title: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export default function PageHeader({
  title,
  searchPlaceholder = 'Search bookings, users, routes',
  searchValue = '',
  onSearchChange,
}: PageHeaderProps) {
  return (
    <header className="content-header">
      <h1 className="content-header-title">{title}</h1>
      <div className="content-header-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          aria-label="Search"
        />
      </div>
    </header>
  );
}
