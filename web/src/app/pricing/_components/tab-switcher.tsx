'use client';
import { useState, useEffect, useRef } from 'react';

type Tab = 'monthly' | 'annual';

interface TabSwitcherProps {
  onTabChange: (tab: Tab) => void;
}

const TabSwitcher: React.FC<TabSwitcherProps> = ({ onTabChange }) => {
  const [activeTab, setActiveTab] = useState<Tab>('monthly');
  const [highlightStyle, setHighlightStyle] = useState({});
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'monthly', label: 'Monthly Billing' },
    { id: 'annual', label: 'Annual Billing' },
  ];

  useEffect(() => {
    const activeElement =
      tabsRef.current[tabs.findIndex((tab) => tab.id === activeTab)];
    if (activeElement) {
      setHighlightStyle({
        transform: `translateX(${activeElement.offsetLeft}px)`,
        width: `${activeElement.offsetWidth}px`,
      });
    }
  }, [activeTab]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    onTabChange(tab);
  };

  return (
    <div className='mx-auto flex max-w-xl flex-col items-center justify-center'>
      <div className='relative right-0'>
        <ul
          className='relative flex list-none flex-wrap rounded-xl border-[rgba(255,255,255,0.03)] bg-white px-1.5 py-1.5 backdrop-blur-md'
          role='list'
        >
          <li
            className='absolute left-1.5 top-1.5 z-20 h-[calc(100%-12px)] rounded-xl bg-blue-600 transition-all duration-200 ease-in-out'
            style={highlightStyle}
          />

          {tabs.map((tab, index) => (
            <li key={tab.id} className='z-30 flex-auto text-center'>
              <button
                ref={(el) => {
                  tabsRef.current[index] = el;
                }}
                className={`z-30 mb-0 flex w-full cursor-pointer items-center justify-center rounded-xl border-0 px-5 py-2 font-inter text-[14px] transition-all ease-in-out ${activeTab === tab.id ? 'font-medium text-white/90' : 'text-black'}`}
                role='tab'
                aria-selected={activeTab === tab.id}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TabSwitcher;
