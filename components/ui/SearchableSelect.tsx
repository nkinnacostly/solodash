"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check, Plus, X } from "lucide-react";

interface SearchableSelectProps {
  options: { value: string; label: string; sublabel?: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: string;
  allowCustom?: boolean;
  onAddNew?: () => void;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  disabled = false,
  error,
  allowCustom = false,
  onAddNew,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      const filteredOptions = options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(search.toLowerCase()) ||
          opt.sublabel?.toLowerCase().includes(search.toLowerCase()),
      );

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (
            highlightedIndex >= 0 &&
            highlightedIndex < filteredOptions.length
          ) {
            onChange(filteredOptions[highlightedIndex].value);
            setIsOpen(false);
            setSearch("");
            setHighlightedIndex(-1);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSearch("");
          setHighlightedIndex(-1);
          break;
      }
    },
    [isOpen, search, highlightedIndex, options, onChange],
  );

  // Filter options based on search
  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      opt.sublabel?.toLowerCase().includes(search.toLowerCase()),
  );

  // Get selected option label
  const selectedOption = options.find((opt) => opt.value === value);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const highlightedElement = listRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch("");
    setHighlightedIndex(-1);
  };

  const handleAddNew = () => {
    onAddNew?.();
    setIsOpen(false);
    setSearch("");
    setHighlightedIndex(-1);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) setSearch("");
          }
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-[#111111] border rounded-lg text-left flex items-center justify-between transition-colors ${
          error
            ? "border-[#ef4444]"
            : isOpen
              ? "border-[#10b981] ring-1 ring-[#10b981]"
              : "border-[#27272a] hover:border-[#52525b]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className={selectedOption ? "text-white" : "text-[#52525b]"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={20}
          className={`text-[#a1a1aa] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Error Message */}
      {error && <p className="mt-1 text-sm text-[#ef4444]">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-2 bg-[#18181b] border border-[#27272a] rounded-lg shadow-2xl opacity-0 animate-in fade-in duration-200"
          style={{
            animation: "fadeIn 0.2s ease-out forwards",
          }}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-[#27272a]">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightedIndex(-1);
              }}
              placeholder={searchPlaceholder}
              className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#27272a] rounded-lg text-white text-sm placeholder-[#52525b] focus:outline-none focus:border-[#10b981] transition-colors"
            />
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            className="max-h-[240px] overflow-y-auto"
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-[#a1a1aa]">
                No clients found
              </li>
            ) : (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                    index === highlightedIndex
                      ? "bg-[#27272a]"
                      : "hover:bg-[#27272a]"
                  } ${option.value === value ? "text-[#10b981]" : "text-white"}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {option.label}
                    </p>
                    {option.sublabel && (
                      <p className="text-xs text-[#a1a1aa] mt-0.5 truncate">
                        {option.sublabel}
                      </p>
                    )}
                  </div>
                  {option.value === value && (
                    <Check
                      size={16}
                      className="text-[#10b981] flex-shrink-0 ml-2"
                    />
                  )}
                </li>
              ))
            )}

            {/* Add New Option */}
            {allowCustom && onAddNew && (
              <>
                <li className="border-t border-[#27272a]" />
                <li
                  onClick={handleAddNew}
                  className="px-3 py-2.5 cursor-pointer flex items-center gap-2 text-[#10b981] hover:bg-[#27272a] transition-colors"
                >
                  <Plus size={16} className="flex-shrink-0" />
                  <span className="text-sm font-medium">Add new client</span>
                </li>
              </>
            )}
          </ul>
        </div>
      )}

      {/* Fade-in animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
