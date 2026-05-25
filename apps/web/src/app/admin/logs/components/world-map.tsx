'use client'

import React, { useState, useEffect } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from 'react-simple-maps'
import { Badge } from '@/components/ui/badge'

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

interface MapData {
  ip: string
  lat: number
  lon: number
  country: string
  city: string
  count: number
}

interface WorldMapProps {
  data: MapData[]
}

export function WorldMap({ data }: WorldMapProps) {
  const [tooltipContent, setTooltipContent] = useState<MapData | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  return (
    <div className="relative w-full h-[500px] bg-[#0B0F14] rounded-lg overflow-hidden border border-white/10">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 140,
        }}
        width={800}
        height={500}
      >
        <ZoomableGroup center={[0, 20]} zoom={1} maxZoom={5}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#334155" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {data.map((marker, idx) => (
            <Marker 
                key={`${marker.ip}-${idx}`} 
                coordinates={[marker.lon, marker.lat]}
                onMouseEnter={(evt) => {
                  const { clientX, clientY } = evt;
                  // For a simple map, we can just use the screen coords relative to the container
                  // But since react-simple-maps handles zooming, we'll track the mouse position for a floating tooltip
                  setTooltipContent(marker)
                }}
                onMouseMove={(evt) => {
                    // Update tooltip position to follow mouse
                    const rect = evt.currentTarget.closest('.relative')?.getBoundingClientRect();
                    if (rect) {
                        setTooltipPos({
                            x: evt.clientX - rect.left,
                            y: evt.clientY - rect.top
                        })
                    }
                }}
                onMouseLeave={() => {
                  setTooltipContent(null)
                }}
            >
              <circle 
                r={Math.min(10, Math.max(3, Math.log10(marker.count) * 3 + 3))} 
                fill="#22C55E" 
                fillOpacity={0.7} 
                stroke="#fff" 
                strokeWidth={1}
                className="cursor-pointer hover:fill-[#4ADE80] transition-colors duration-200"
              />
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Floating Tooltip */}
      {tooltipContent && (
        <div 
          className="absolute z-50 pointer-events-none bg-[#1E293B] border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-sm transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 15,
            minWidth: '200px'
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-sm font-bold text-white font-mono">{tooltipContent.ip}</h4>
            <Badge variant="outline" className="bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30 text-xs py-0 h-5">
              {tooltipContent.count} reqs
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-300">
              <span className="text-slate-500 mr-1">City:</span> {tooltipContent.city || 'Unknown'}
            </p>
            <p className="text-xs text-slate-300">
              <span className="text-slate-500 mr-1">Country:</span> {tooltipContent.country || 'Unknown'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
