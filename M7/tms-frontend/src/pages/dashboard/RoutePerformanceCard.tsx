import React from 'react';
import { Activity, Target, Plus, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RingData {
  label: string;
  value: string;
  percent: number;
  strokeColor: string;
}

interface RouteItem {
  id: string;
  label: string;
  completed: boolean;
}

const RADIUS = 44;
const STROKE_WIDTH = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const rings: RingData[] = [
  { label: 'Deliveries', value: '48', percent: 85, strokeColor: '#FF375F' },
  { label: 'On-Time', value: '89%', percent: 70, strokeColor: '#A4F238' },
  { label: 'Fleet', value: '78%', percent: 83, strokeColor: '#0A84FF' },
];

const routes: RouteItem[] = [
  { id: '1', label: 'Warsaw → Berlin', completed: false },
  { id: '2', label: 'Prague → Vienna', completed: false },
  { id: '3', label: 'Munich → Lyon', completed: true },
  { id: '4', label: 'Hamburg → Amsterdam', completed: false },
];

function ActivityRing({ data }: { data: RingData }) {
  const dashOffset = CIRCUMFERENCE * (1 - data.percent / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[108px] h-[108px]">
        <svg
          width="108"
          height="108"
          viewBox="0 0 108 108"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx="54"
            cy="54"
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={STROKE_WIDTH}
          />
          <circle
            cx="54"
            cy="54"
            r={RADIUS}
            fill="none"
            stroke={data.strokeColor}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-white font-bold text-base leading-none">{data.value}</span>
          <span className="text-zinc-500 text-xs mt-1">{data.percent}%</span>
        </div>
      </div>
      <span className="text-zinc-400 text-[10px] font-semibold uppercase tracking-widest">
        {data.label}
      </span>
    </div>
  );
}

export function RoutePerformanceCard() {
  const navigate = useNavigate();

  return (
    <div className="relative rounded-[28px] bg-black p-6 h-full flex flex-col gap-4 overflow-hidden">
      {/* Gradient sliver peeking from right edge */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-16 rounded-l-full bg-gradient-to-b from-blue-500 to-purple-600 opacity-60" />

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
          <Activity className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg leading-tight">Today's Progress</h2>
          <p className="text-zinc-500 text-sm">Route Performance</p>
        </div>
      </div>

      {/* Activity Rings */}
      <div className="flex items-center justify-around py-1">
        {rings.map((ring) => (
          <ActivityRing key={ring.label} data={ring} />
        ))}
      </div>

      {/* Separator */}
      <div className="h-px bg-zinc-800" />

      {/* Routes section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-zinc-500" />
          <span className="text-white text-sm font-semibold">Active Routes</span>
        </div>
        <Plus className="w-4 h-4 text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors" />
      </div>

      {/* Route List */}
      <div className="flex flex-col gap-2 flex-1">
        {routes.map((route) => (
          <div
            key={route.id}
            className="flex items-center gap-3 bg-zinc-900 rounded-2xl px-4 py-3"
          >
            {route.completed ? (
              <div className="w-5 h-5 rounded-full bg-lime-400 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4l2.5 2.5L9 1"
                    stroke="black"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border border-zinc-600 flex-shrink-0" />
            )}
            <span
              className={
                route.completed
                  ? 'text-zinc-500 text-sm line-through'
                  : 'text-white text-sm'
              }
            >
              {route.label}
            </span>
          </div>
        ))}
      </div>

      {/* Footer link */}
      <button
        onClick={() => navigate('/route-planner')}
        className="flex items-center gap-1 mt-auto group w-fit"
      >
        <span className="text-zinc-500 text-xs group-hover:text-zinc-300 transition-colors">
          View Route Details
        </span>
        <ArrowUpRight className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
      </button>
    </div>
  );
}
