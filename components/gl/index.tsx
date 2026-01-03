"use client";

import { Suspense } from "react";
import { Effects } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Particles } from "./particles";
import { VignetteShader } from "./shaders/vignetteShader";

export const GL = ({ hovering = false }: { hovering?: boolean }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    >
      <Canvas
        camera={{
          position: [1.2629783123314589, 2.664606471394044, -1.8178993743288914],
          fov: 50,
          near: 0.01,
          far: 300,
        }}
      >
        <color attach="background" args={["#000"]} />
        <Suspense fallback={null}>
          <Particles
            speed={1.0}
            aperture={1.79}
            focus={3.8}
            size={512}
            noiseScale={0.6}
            noiseIntensity={0.52}
            timeScale={1}
            pointSize={10.0}
            opacity={0.8}
            planeScale={10.0}
            useManualTime={false}
            manualTime={0}
            introspect={hovering}
          />
        </Suspense>
        <Effects multisamping={0} disableGamma>
          <shaderPass
            args={[VignetteShader]}
            uniforms-darkness-value={1.5}
            uniforms-offset-value={0.4}
          />
        </Effects>
      </Canvas>
    </div>
  );
};
