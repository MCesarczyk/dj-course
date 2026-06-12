import React from 'react';
import { MapPin, ArrowUpDown } from 'lucide-react';
import { DraggableRouteListProps } from './route-list.types';
import { DraggableRoutePoint } from './DraggableRoutePoint';
import { useDraggableList } from './useDraggableList';

export const DraggableRouteList: React.FC<DraggableRouteListProps> = ({ points, onReorderPoints }) => {
  const {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } = useDraggableList(points, onReorderPoints);

  if (points.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">No Route Points</h4>
        <p className="text-gray-500">Start adding points to your route using the controls on the left</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <ArrowUpDown className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">Drag and drop to reorder route points</span>
      </div>

      <div className="space-y-2">
        {points.map((point, index) => (
          <div
            key={point.id}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragLeave={handleDragLeave}
            className={`relative ${
              dragOverIndex === index && draggedIndex !== index ? 'border-t-2 border-blue-500 pt-2' : ''
            }`}
          >
            <DraggableRoutePoint
              point={point}
              index={index}
              isDragging={draggedIndex === index}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          </div>
        ))}
      </div>

      <div
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, points.length)}
        onDragEnter={(e) => handleDragEnter(e, points.length)}
        onDragLeave={handleDragLeave}
        className={`h-8 border-2 border-dashed rounded-lg transition-colors ${
          dragOverIndex === points.length && draggedIndex !== null
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300'
        }`}
      >
        {dragOverIndex === points.length && draggedIndex !== null && (
          <div className="flex items-center justify-center h-full text-sm text-blue-600 font-medium">
            Drop here to move to end
          </div>
        )}
      </div>
    </div>
  );
};
