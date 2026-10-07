import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Stage, PresentationControls } from "@react-three/drei";
import { useRef } from "react";

function Model(props) {
  const { scene } = useGLTF("/planet.glb");
  const ref = useRef();

  // rotate through a ref: no React re-render on every frame
  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.003;
  });
  return <primitive ref={ref} object={scene} {...props} />
}

function Globe() {
  return (
      <Canvas dpr={[1, 2]} shadows camera={{ fov: 45 }} style={{ "position": "absolute", "top": 0, "left": 0, "zIndex": 1 }} className="dark:block hidden">
        {/* <color attach="background" args={["#000"]} /> */}
        <PresentationControls speed={1.5} global zoom={.5} polar={[0, 0]}>
          <Stage environment={"sunset"}>
            <Model scale={0.006} />
          </Stage>
        </PresentationControls>
      </Canvas>
  );
}

export default Globe;