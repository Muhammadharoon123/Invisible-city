"use client";

import dynamic from "next/dynamic";
import type { MapProps } from "./MapInner";

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[300px] w-full items-center justify-center bg-sunken text-sm text-muted">
      Loading map…
    </div>
  ),
});

export default function CityMap(props: MapProps) {
  return <MapInner {...props} />;
}
export type { MapLayer } from "./MapInner";
