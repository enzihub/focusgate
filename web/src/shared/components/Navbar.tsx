'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
  UserButton,
  useClerk,
} from '@clerk/nextjs';

const Navbar = () => {
  const pathname = usePathname();
  const { isLoaded, userId, sessionId, getToken } = useAuth();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      // You can add additional cleanup here if needed
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Common navigation items
  const navItems = [
    ...(isLoaded && userId
      ? [
          {
            label: 'Profile',
            href: '/profile',
          },
          {
            label: 'Log out',
            isButton: true,
            onClick: handleLogout,
          },
        ]
      : [
          { href: '/login', label: 'Login' },
          { href: '/signup', label: 'Sign Up', isSpecial: false },
        ]),
  ];

  // Common link styles with active state
  const getLinkStyles = (href: string) => {
    const isActive = pathname === href;
    return `transition-colors duration-500 ${
      isActive ? 'text-black' : 'text-gray-800 hover:text-black'
    }`;
  };

  const mobileItemStyles = 'block px-3 py-2';

  const NavLink = ({ item, isMobile = false }: any) => {
    if (item.isButton) {
      return (
        <button
          onClick={() => {
            item.onClick();
            isMobile && setIsOpen(false);
          }}
          className={`${getLinkStyles('')} ${isMobile ? `${mobileItemStyles} w-full text-left` : ''}`}
        >
          {item.label}
        </button>
      );
    }

    return (
      <Link
        href={item.href}
        onClick={() => isMobile && setIsOpen(false)}
        className={` ${getLinkStyles(item.href)} ${item.isSpecial ? 'mainButton px-6 py-2' : ''} ${isMobile ? mobileItemStyles : ''} `}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <nav className='z-10 w-full gap-2.5 bg-[#E8FAFF] px-8 py-2 font-medium shadow-md transition-all duration-500 md:px-40'>
      <div className='mx-auto'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo */}
          <Link href='/' className='flex items-center'>
            <img
              src='/images/focusgate_logo.png'
              alt='FocusGate Logo'
              className='h-auto w-40'
            />
          </Link>

          {/* Desktop Navigation */}
          <div className='hidden items-center space-x-6 md:flex'>
            {navItems.map((item) => (
              <NavLink key={item.label} item={item} />
            ))}
          </div>

          {/* Mobile menu button */}
          <div className='md:hidden'>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className='text-gray-700 transition-colors duration-500 hover:text-blue-500 focus:outline-none'
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out md:hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className='space-y-1 px-2 pb-3 pt-2'>
            {navItems.map((item) => (
              <NavLink key={item.label} item={item} isMobile={true} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
