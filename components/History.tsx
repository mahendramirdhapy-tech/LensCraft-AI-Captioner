import React from 'react';
import { HistoryItem } from '../types';

interface HistoryProps {
  items: HistoryItem[];
}

const History: React.FC<HistoryProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Captions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="aspect-video w-full bg-slate-100 relative">
              <img 
                src={item.imageUrl} 
                alt="Historical upload" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                {item.modelUsed}
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm text-slate-700 line-clamp-3 leading-relaxed">
                {item.caption}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {new Date(item.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;