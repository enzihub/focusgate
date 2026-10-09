'use client';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import SocialMediaLinks from './social-media-links';

const Footer = () => {
  return (
    <footer className='z-10 mt-8 w-full gap-2.5 bg-white px-6 pb-8 pt-4 text-base font-medium shadow-md md:px-16'>
      <div className='flex flex-col items-start justify-between pb-8 pt-5 text-center lg:flex-row'>
        <div className='flex max-w-lg flex-col justify-start gap-3 text-start'>
          <h1 className='text-2xl font-semibold tracking-[-0.04em]'>
            Need help with anything? We&apos;re here!
          </h1>
          <p className='text-lg tracking-[-0.5px]'>
            {process.env.NEXT_PUBLIC_SUPPORT_EMAIL
              ? `Email ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL} and we will get back to you.`
              : 'Reply to any FocusGate email and it reaches the team.'}
          </p>
        </div>
        <div className='mt-4 flex flex-col marker:text-start lg:mt-0'>
          <div className='flex gap-2 text-sm font-normal md:text-base'>
            <Link
              href='/tos'
              className='border-2-white/70 border-r pr-3 font-semibold transition-colors'
            >
              Terms of Service
            </Link>
            <Link
              href='/privacy-policy'
              className='border-2-white/70 border-r pr-3 font-semibold'
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
      <div className='mt-8 border-t border-dashed border-white/20 pt-4'>
        {/* mobile view */}
        <div className='flex flex-col gap-6 md:hidden'>
          <div className='mx-auto flex max-w-64 justify-center'>
            <img
              src='/images/focusgate_logo.png'
              alt='logo'
              className='w-full'
            />
          </div>
          {/* social media */}
          <div className='mt-6 flex justify-center'>
            <SocialMediaLinks />
          </div>
          <div>
            <p className='mt-6 text-center text-sm font-semibold tracking-[-0.4px] text-white/60'>
              Built by Enzi Studio
            </p>
          </div>
        </div>
        {/* desktop view */}
        <div className='max-w-screen mx-auto mb-8 mt-6 hidden grid-cols-3 items-center md:grid'>
          <div>
            <p className='flex justify-start text-center text-base font-semibold tracking-[-0.4px]'>
              Built by Enzi Studio
            </p>
          </div>
          <div>
            <img
              src='/images/focusgate_logo.png'
              alt='logo'
              className='mx-auto flex w-[220px] justify-center'
            />
          </div>
          {/* social media */}
          <div>
            <div className='flex justify-end'>
              <SocialMediaLinks />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
