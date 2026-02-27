"use client";

import dynamic from "next/dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
      Loading chart...
    </div>
  ),
}) as any;

const darkLayout: Record<string, any> = {
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  font: { color: "#a1a1aa", family: "ui-monospace, monospace", size: 11 },
  xaxis: {
    gridcolor: "#27272a",
    zerolinecolor: "#3f3f46",
    tickfont: { color: "#71717a" },
  },
  yaxis: {
    gridcolor: "#27272a",
    zerolinecolor: "#3f3f46",
    tickfont: { color: "#71717a" },
  },
  margin: { t: 40, r: 20, b: 50, l: 60 },
  hoverlabel: {
    bgcolor: "#18181b",
    bordercolor: "#3f3f46",
    font: { color: "#e4e4e7", family: "ui-monospace, monospace" },
  },
};

interface PlotlyChartProps {
  data: any[];
  layout?: Record<string, any>;
  config?: Record<string, any>;
  style?: React.CSSProperties;
}

export default function PlotlyChart({ data, layout = {}, config = {}, style }: PlotlyChartProps) {
  const mergedLayout = {
    ...darkLayout,
    ...layout,
    xaxis: { ...darkLayout.xaxis, ...(layout.xaxis || {}) },
    yaxis: { ...darkLayout.yaxis, ...(layout.yaxis || {}) },
  };

  return (
    <Plot
      data={data}
      layout={mergedLayout}
      config={{
        displayModeBar: false,
        responsive: true,
        ...config,
      }}
      useResizeHandler
      style={{ width: "100%", height: "100%", ...style }}
    />
  );
}
