import { PropsWithChildren, ReactNode } from 'react';

interface CardProps {
  icon?: ReactNode;
  title: string;
  footer?: ReactNode;
}

export function Card({
  icon,
  title,
  footer,
  children,
}: PropsWithChildren<CardProps>) {
  return (
    <div className='rounded-xl border border-gray-100 bg-white shadow-sm'>
      <div className='p-8'>
        <div className='mb-6 flex items-center gap-3'>
          {icon}
          <h2 className='text-xl font-medium'>{title}</h2>
        </div>
        <div className='py-4'>{children}</div>
      </div>
      {footer && (
        <div className='flex justify-end rounded-b-xl border-t border-gray-100 bg-gray-50 p-6'>
          {footer}
        </div>
      )}
    </div>
  );
}
