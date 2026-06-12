import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RoutePoint } from '../../../model/shipments';
import { createCustomIcon, getPointColor, defaultMapCenter, defaultZoom } from '../shared/route-planner.utils';
import { LogisticsMapProps } from './map.types';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiMzQjgyRjYiLz4KPHBhdGggZD0iTTEyLjUgMTdDMTUuMjYxNCAxNyAxNy41IDE0Ljc2MTQgMTcuNSAxMkMxNy41IDkuMjM4NTggMTUuMjYxNCA3IDEyLjUgN0M5LjczODU4IDcgNy41IDkuMjM4NTggNy41IDEyQzcuNSAxNC43NjE0IDkuNzM4NTggMTcgMTIuNSAxN1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMi41IDQxTDcuNSAyNUwxNy41IDI1TDEyLjUgNDFaIiBmaWxsPSIjM0I4MkY2Ii8+Cjwvc3ZnPgo=',
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiMzQjgyRjYiLz4KPHBhdGggZD0iTTEyLjUgMTdDMTUuMjYxNCAxNyAxNy41IDE0Ljc2MTQgMTcuNSAxMkMxNy41IDkuMjM4NTggMTUuMjYxNCA3IDEyLjUgN0M5LjczODU4IDcgNy41IDkuMjM4NTggNy41IDEyQzcuNSAxNC43NjE0IDkuNzM4NTggMTcgMTIuNSAxN1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMi41IDQxTDcuNSAyNUwxNy41IDI1TDEyLjUgNDFaIiBmaWxsPSIjM0I4MkY2Ii8+Cjwvc3ZnPgo=',
  shadowUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDEiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCA0MSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGVsbGlwc2UgY3g9IjIwLjUiIGN5PSIyMC41IiByeD0iMjAuNSIgcnk9IjIwLjUiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuMyIvPgo8L3N2Zz4K'
});

export const useLogisticsMap = ({
  points,
  vehicle,
  onPointAdd,
  onPointRemove,
  onPointEdit,
  pendingPointType
}: LogisticsMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<RoutePoint | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pointToDelete, setPointToDelete] = useState<RoutePoint | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [defaultMapCenter.lat, defaultMapCenter.lng],
      zoom: defaultZoom,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (pendingPointType && onPointAdd) {
        onPointAdd({ lat: e.latlng.lat, lng: e.latlng.lng }, pendingPointType);
      }
      setSelectedPoint(null);
      setTooltipPosition(null);
    };

    mapInstanceRef.current.off('click');
    mapInstanceRef.current.on('click', handleMapClick);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off('click', handleMapClick);
      }
    };
  }, [pendingPointType, onPointAdd]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const container = mapInstanceRef.current.getContainer();
    container.style.cursor = pendingPointType ? 'crosshair' : '';
  }, [pendingPointType]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    points.forEach(point => {
      const icon = createCustomIcon(point.type, getPointColor(point.type));
      const marker = L.marker([point.coordinates.lat, point.coordinates.lng], { icon })
        .addTo(mapInstanceRef.current!);

      marker.on('click', (e) => {
        e.originalEvent.stopPropagation();
        setSelectedPoint(point);
        const pixelPosition = mapInstanceRef.current!.latLngToContainerPoint(e.latlng);
        setTooltipPosition({ x: pixelPosition.x, y: pixelPosition.y });
      });

      if (onPointEdit) {
        marker.dragging?.enable();
        marker.on('dragend', (e) => {
          const newPos = e.target.getLatLng();
          onPointEdit({ ...point, coordinates: { lat: newPos.lat, lng: newPos.lng } });
        });
      }

      markersRef.current.set(point.id, marker);
    });

    if (routeLineRef.current) {
      routeLineRef.current.remove();
    }

    if (points.length > 1) {
      const routeCoords = points.map(p => [p.coordinates.lat, p.coordinates.lng] as [number, number]);
      routeLineRef.current = L.polyline(routeCoords, {
        color: '#3B82F6',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 5'
      }).addTo(mapInstanceRef.current);
    }
  }, [points, onPointEdit]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (vehicleMarkerRef.current) vehicleMarkerRef.current.remove();

    const vehicleIcon = createCustomIcon('truck', '#F97316');
    vehicleMarkerRef.current = L.marker(
      [vehicle.coordinates.lat, vehicle.coordinates.lng],
      { icon: vehicleIcon, zIndexOffset: 1000 }
    ).addTo(mapInstanceRef.current);

    vehicleMarkerRef.current.setLatLng([vehicle.coordinates.lat, vehicle.coordinates.lng]);
  }, [vehicle]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (points.length > 0) {
      const group = new L.FeatureGroup();
      points.forEach(point => {
        L.marker([point.coordinates.lat, point.coordinates.lng]).addTo(group);
      });
      L.marker([vehicle.coordinates.lat, vehicle.coordinates.lng]).addTo(group);

      if (group.getLayers().length > 0) {
        mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
      }
    } else {
      mapInstanceRef.current.setView([vehicle.coordinates.lat, vehicle.coordinates.lng], 10);
    }
  }, [points.length, vehicle.coordinates]);

  const handleDeleteClick = (point: RoutePoint) => {
    setPointToDelete(point);
    setShowDeleteModal(true);
    setSelectedPoint(null);
    setTooltipPosition(null);
  };

  const handleDeleteConfirm = () => {
    if (pointToDelete && onPointRemove) {
      onPointRemove(pointToDelete.id);
    }
    setShowDeleteModal(false);
    setPointToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setPointToDelete(null);
  };

  const handleTooltipClose = () => {
    setSelectedPoint(null);
    setTooltipPosition(null);
  };

  return {
    mapRef,
    selectedPoint,
    tooltipPosition,
    showDeleteModal,
    pointToDelete,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleTooltipClose,
  };
};
