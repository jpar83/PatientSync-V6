import React from 'react';
import { Plus } from 'lucide-react';

interface Props {
  onClick: () => void;
}

const QuickAddButton: React.FC<Props> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed bottom-20 right-5 z-40 shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-4 transition-transform hover:scale-110 active:scale-95"
      aria-label="Add new item"
    >
      <Plus className="h-5 w-5" />
    </button>
  );
};

export default QuickAddButton;
