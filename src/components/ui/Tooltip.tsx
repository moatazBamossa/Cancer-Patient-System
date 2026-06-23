interface TooltipProps {
  text: string;
  children: React.ReactNode;
  show: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({
  text,
  children,
  show,
  position = 'top'
}: TooltipProps) {
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return {
          tooltip: 'top-full left-1/2 -translate-x-1/2 mt-2',
          arrow: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-t-transparent top-0'
        };
      case 'left':
        return {
          tooltip: 'right-full top-1/2 -translate-y-1/2 mr-2',
          arrow: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-r-transparent'
        };
      case 'right':
        return {
          tooltip: 'left-full top-1/2 -translate-y-1/2 ml-2',
          arrow: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-l-transparent'
        };
      default: // top
        return {
          tooltip: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
          arrow: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-b-transparent'
        };
    }
  };

  const { tooltip, arrow } = getPositionClasses();

  return (
    <div className="relative group inline-flex">
      {children}
      {show && (
        <div className={`absolute ${tooltip} px-3 py-1.5 text-xs font-medium text-white bg-gray-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg`}>
          {text}
          <div className={`absolute ${arrow} border-4 border-transparent`} />
        </div>
      )}
    </div>
  );
}
