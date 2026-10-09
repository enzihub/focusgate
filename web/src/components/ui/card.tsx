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
    <div className='rounded-xl'>
      <div className='p-8'>
        <div className='mb-6 flex items-center gap-3'>
          {icon}
          <h2 className='text-lg font-medium text-white/90'>{title}</h2>
        </div>
        <div className='py-4'>{children}</div>
      </div>
      {footer && <div className='flex justify-end rounded-b-xl'>{footer}</div>}
    </div>
  );
}
