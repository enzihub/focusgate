'use client';

import CheckmarkIcon from './check-icon';

interface PriceCardProps {
  title: string;
  subtitle: string;
  price: string;
  buttonText: string;
  conditionsArray: string[];
  plan?: string;
  onButtonClick?: () => void;
}

export default function PriceCard({
  title,
  subtitle,
  price,
  buttonText,
  conditionsArray,
  plan,
  onButtonClick,
}: PriceCardProps) {
  return (
    <div className='flex flex-col gap-3 overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.03)] bg-white px-4 py-6 font-inter shadow-lg backdrop-blur-md md:max-w-sm md:px-8'>
      <h1 className='font-inter text-2xl font-semibold text-black'>{title}</h1>
      <p className='text-sm font-normal text-black'>{subtitle}</p>
      <h2 className='traching-[-0.02em] text-[25px] font-medium text-black'>
        {price}
        <span className='pl-1.5 text-[14px] font-normal text-white/60'>
          {plan}
        </span>
      </h2>
      <button
        className='mx-auto w-full rounded-xl bg-blue-600 py-3 text-[14px] font-medium text-white transition duration-300 hover:bg-blue-700'
        onClick={onButtonClick}
      >
        {buttonText}
      </button>
      <div className='mt-4 space-y-2.5 border-t border-white/10 pt-4 text-sm text-gray-700'>
        {conditionsArray.map((condition, index) => (
          <p
            key={index}
            className='flex items-center gap-2 px-2 text-[14px] font-normal text-black'
          >
            <span>
              <CheckmarkIcon
                size={20}
                strokeWidth={1.0}
                className='inline-block text-black'
              />
            </span>{' '}
            {condition}
          </p>
        ))}
      </div>
    </div>
  );
}
