import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Stage, PresentationControls } from "@react-three/drei";
import { useState } from "react";

function Model(props) {
  const { scene } = useGLTF("/planet.glb");
  const [rotationAngle, setRotationAngle] = useState(0);

  useFrame(() => {
    setRotationAngle(rotationAngle + 0.003);
  })
  return <primitive object={scene} rotation={[0, rotationAngle, 0]} {...props} />
}

function Globe() {
  return (
      <Canvas dpr={[1, 2]} shadows camera={{ fov: 45 }} style={{ "position": "absolute", "top": 0, "left": 0, "zIndex": 1 }} className="dark:visible invisible">
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