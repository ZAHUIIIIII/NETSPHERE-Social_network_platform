import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * PortalDropdown - A dropdown menu that renders in a portal to avoid overflow issues
 * 
 * @param {boolean} isOpen - Whether the dropdown is open
 * @param {function} onClose - Function to close the dropdown
 * @param {React.ReactNode} trigger - The button/element that triggers the dropdown
 * @param {React.ReactNode} children - The dropdown menu content
 * @param {string} className - Additional classes for the dropdown menu
 * @param {string} align - Alignment of dropdown ('left' or 'right'), default 'right'
 * @param {number} offsetY - Vertical offset from trigger in pixels, default 4
 */
const PortalDropdown = ({ 
  isOpen, 
  onClose, 
  trigger, 
  children, 
  className = '',
  align = 'right',
  offsetY = 4,
  width = 'w-36'
}) => {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState(null);

  // Calculate menu position with smart positioning (flip if not enough space)
  const calculatePosition = () => {
    if (!triggerRef.current || !menuRef.current) return null;

    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = menuRef.current.offsetWidth;
    const menuHeight = menuRef.current.offsetHeight;
    const viewportHeight = window.innerHeight;
    
    // Check if there's enough space below
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldFlipVertical = spaceBelow < menuHeight + offsetY && spaceAbove > spaceBelow;
    
    return {
      top: shouldFlipVertical 
        ? rect.top - menuHeight - offsetY
        : rect.bottom + offsetY,
      left: align === 'right' 
        ? rect.right - menuWidth
        : rect.left
    };
  };

  // Calculate menu position synchronously before paint - ONCE when opened
  useLayoutEffect(() => {
    if (isOpen) {
      const position = calculatePosition();
      if (position) setMenuPosition(position);
    }
  }, [isOpen, align, offsetY]);

  // Close dropdown on scroll or resize (better UX than repositioning)
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      onClose();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, onClose]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target) &&
        triggerRef.current && 
        !triggerRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  return (
    <>
      <div ref={triggerRef} className="inline-block">
        {trigger}
      </div>
      
      {isOpen && createPortal(
        <div 
          ref={menuRef}
          className={`fixed ${width} bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] ${className}`}
          style={{
            top: menuPosition ? `${menuPosition.top}px` : '0px',
            left: menuPosition ? `${menuPosition.left}px` : '0px',
            visibility: menuPosition ? 'visible' : 'hidden',
          }}
        >
          {children}
        </div>,
        document.body
      )}
    </>
  );
};

export default PortalDropdown;
