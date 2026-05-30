import React from 'react';
import { Plus, Route, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { RouteControlsProps } from './route-controls.types';
import { useRouteControls } from './useRouteControls';

export const RouteControls: React.FC<RouteControlsProps> = (props) => {
  const {
    showAddOptions,
    setShowAddOptions,
    pointTypes,
    requiresRestStops,
    getRestStopWarning,
    handleAddPoint,
  } = useRouteControls(props);

  const { route, onOptimizeRoute, onAddRestStops } = props;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Route className="w-5 h-5 text-blue-600" />
          Route Planning
        </h2>

        {!showAddOptions ? (
          <button
            onClick={() => setShowAddOptions(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Route Point
            <ChevronDown className="w-4 h-4" />
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Select point type:</span>
              <button onClick={() => setShowAddOptions(false)} className="text-gray-400 hover:text-gray-600">
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {pointTypes.map(({ type, label, icon, color }) => (
                <button
                  key={type}
                  onClick={() => handleAddPoint(type)}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors border ${color}`}
                >
                  <span className="text-lg">{icon}</span>
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <button
            onClick={onOptimizeRoute}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Route className="w-4 h-4" />
            Optimize Route
          </button>
        </div>

        {route.points.length > 0 && requiresRestStops() && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-800 text-sm mb-1">Mandatory Rest Stops Required</h4>
                <p className="text-red-700 text-xs">{getRestStopWarning()}</p>
                <button
                  onClick={onAddRestStops}
                  className="mt-2 text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                >
                  Add Required Rest Stops
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
