import React, { useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

// Using a lightweight TopoJSON for the world map
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface WorldMapProps {
    data: { id: string; value: number }[];
}

export function WorldMap({ data }: WorldMapProps) {
    // Generate color scale based on data extremes
    const colorScale = useMemo(() => {
        const maxValue = Math.max(...data.map(d => d.value), 1);
        return scaleLinear<string>()
            .domain([0, maxValue])
            .range(["#1a1a1a", "#ef4444"]); // From dark grey surface to brand red
    }, [data]);

    return (
        <div className="w-full h-full min-h-[300px] flex items-center justify-center -ml-[5%]">
            <ComposableMap
                projectionConfig={{ scale: 140 }}
                width={800}
                height={400}
                style={{ width: "100%", height: "100%" }}
            >
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map((geo) => {
                            // Find matching data row. We assume backend returns ISO-A2 or ISO-A3 codes.
                            // The countries-110m topojson uses ISO-A3 in properties.iso_a3
                            const d = data.find(s => s.id === geo.id || (geo.properties && s.id === geo.properties.iso_a3));
                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill={d ? colorScale(d.value) : "#1a1a1a"}
                                    stroke="#ffffff"
                                    strokeWidth={0.2}
                                    strokeOpacity={0.2}
                                    style={{
                                        default: { outline: "none" },
                                        hover: { outline: "none", fill: d ? "#ef4444" : "#ffffff", opacity: 0.8 },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>
        </div>
    );
}
