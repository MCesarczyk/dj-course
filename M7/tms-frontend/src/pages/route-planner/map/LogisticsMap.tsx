import React from 'react';
import { useLogisticsMap } from './useLogisticsMap';
import { LogisticsMapProps } from './map.types';
import { PointTooltip } from './PointTooltip';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

export const LogisticsMap: React.FC<LogisticsMapProps> = (props) => {
  const {
    mapRef,
    selectedPoint,
    tooltipPosition,
    showDeleteModal,
    pointToDelete,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleTooltipClose,
  } = useLogisticsMap(props);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapRef}
        className="w-full h-full rounded-lg overflow-hidden shadow-lg"
        style={{ minHeight: '500px' }}
      />

      <style>{`
        .custom-marker {
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .marker-icon {
          transform: rotate(45deg);
          font-size: 14px;
        }
        .custom-div-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        .leaflet-control-zoom a {
          background: white !important;
          border: none !important;
          color: #374151 !important;
          font-weight: 600 !important;
          transition: all 0.2s ease !important;
        }
        .leaflet-control-zoom a:hover {
          background: #F3F4F6 !important;
          color: #1F2937 !important;
        }
      `}</style>

      {selectedPoint && tooltipPosition && (
        <div
          className="absolute z-[1000]"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <PointTooltip
            point={selectedPoint}
            onEdit={props.onPointEdit}
            onDelete={handleDeleteClick}
            onClose={handleTooltipClose}
          />
        </div>
      )}

      {props.pendingPointType && (
        <div className="absolute top-4 left-4 z-[1000] bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            <span className="text-sm font-medium">
              Click on the map to add a {props.pendingPointType.replace('-', ' ')} point
            </span>
          </div>
        </div>
      )}

      {showDeleteModal && pointToDelete && (
        <DeleteConfirmationModal
          pointName={pointToDelete.name}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
};
