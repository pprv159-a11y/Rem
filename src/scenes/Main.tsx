import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 20, 150, 180], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 30], [45, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #101827 0%, #263b66 55%, #101827 100%)", justifyContent: "center", alignItems: "center", color: "white", fontFamily: "Arial, sans-serif" }}>
      <div style={{ opacity, transform: `translateY(${y}px)`, textAlign: "center" }}>
        <div style={{ fontSize: 34, letterSpacing: 12, color: "#9db8ff", marginBottom: 28 }}>REMOTION STUDIO</div>
        <div style={{ fontSize: 104, fontWeight: 800 }}>Your video starts here</div>
        <div style={{ fontSize: 30, marginTop: 30, color: "#d3dcf2" }}>Automated video creation · {Math.round(frame / fps)}s</div>
      </div>
    </AbsoluteFill>
  );
};
