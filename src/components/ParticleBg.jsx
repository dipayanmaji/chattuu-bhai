import React, { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
// import { loadAll } from "@tsparticles/all"; // if you are going to use `loadAll`, install the "@tsparticles/all" package too.
// import { loadFull } from "tsparticles"; // if you are going to use `loadFull`, install the "tsparticles" package too.
import { loadSlim } from "@tsparticles/slim"; // if you are going to use `loadSlim`, install the "@tsparticles/slim" package too.
// import { loadBasic } from "@tsparticles/basic"; // if you are going to use `loadBasic`, install the "@tsparticles/basic" package too.

const ParticleBg = () => {
    const [init, setInit] = useState(false);

    // this should be run only once per application lifetime
    useEffect(() => {
        initParticlesEngine(async (engine) => {
            // you can initiate the tsParticles instance (engine) here, adding custom shapes or presets
            // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
            // starting from v2 you can add only the features you need reducing the bundle size
            //await loadAll(engine);
            //await loadFull(engine);
            await loadSlim(engine);
            //await loadBasic(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = (container) => {
        console.log(container);
    };

    const options = useMemo(
        () => ({
            fpsLimit: 60,
            particles: {
                move: {
                    bounce: false,
                    direction: "bottom-right",
                    enable: true,
                    outModes: "out",
                    random: true,
                    speed: 1,
                    straight: true
                },
                number: { density: { enable: true, area: 800 }, value: 1500 },
                opacity: {
                    value: 1
                },
                shape: {
                    type: "circle"
                },
                size: {
                    value: { min: 0.2, max: 1 }
                }
            },
            themes: [
                {
                    name: "dark",
                    default: {
                        value: true,
                        mode: "dark"
                    },
                    options: {
                        background: {
                            color: "#000"
                        },
                        particles: {
                            color: {
                                value: "#000"
                            }
                        }
                    }
                },
                {
                    name: "dark",
                    default: {
                        value: true,
                        mode: "dark"
                    },
                    options: {
                        background: {
                            color: "#000"
                        },
                        particles: {
                            color: {
                                value: "#fff"
                            }
                        }
                    }
                }
            ]
        }),
        [],
    );

    if (init) {
        return (
            <Particles
                className="dark:block hidden"
                id="tsparticles"
                particlesLoaded={particlesLoaded}
                options={options}
            />
        );
    }

    return <></>;
};

export default ParticleBg;