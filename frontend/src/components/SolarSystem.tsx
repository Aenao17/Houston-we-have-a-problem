import { useEffect, useMemo, useRef, useState } from 'react';
import { PlanetDto } from '../types/planet';
import { MissionData } from '../types/mission';
import './SolarSystem.css';

type SolarSystemProps = {
    planets: PlanetDto[];
    missionStarted?: boolean;
    startPlanet?: string;
    destinationPlanet?: string;
    missionData?: MissionData | null;
    onMissionComplete?: () => void;
};

type Point = {
    x: number;
    y: number;
};

type PlanetRenderData = {
    planet: PlanetDto;
    orbitSize: number;
    planetSize: number;
    angleDeg: number;
    x: number;
    y: number;
};

type MissionPhase =
    | 'idle'
    | 'fast-forward'
    | 'rocket-ready'
    | 'rocket-flight'
    | 'completed';

const SYSTEM_SIZE = 720;
const CENTER = SYSTEM_SIZE / 2;

const MIN_ORBIT_SIZE = 140;
const MAX_ORBIT_SIZE = 620;

const MIN_PLANET_SIZE = 18;
const MAX_PLANET_SIZE = 44;

const DAYS_IN_100_YEARS = 100 * 365.25;
const FAST_FORWARD_DURATION_MS = 3000;
const ROCKET_READY_DELAY_MS = 700;
const ROCKET_FLIGHT_TOTAL_MS = 5200;
const ROCKET_SIZE = 26;
const POST_ALIGNMENT_VISUAL_DAYS = 40;

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const quadraticBezier = (p0: Point, p1: Point, p2: Point, t: number): Point => {
    const oneMinusT = 1 - t;
    return {
        x: oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x,
        y: oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y
    };
};

const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
const easeInQuad = (t: number) => t * t;

const SolarSystem: React.FC<SolarSystemProps> = ({
                                                     planets,
                                                     missionStarted = false,
                                                     startPlanet,
                                                     destinationPlanet,
                                                     missionData,
                                                     onMissionComplete
                                                 }) => {
    const [simulationDays, setSimulationDays] = useState(0);
    const [postAlignmentDays, setPostAlignmentDays] = useState(0);
    const [useMissionAngles, setUseMissionAngles] = useState(false);
    const [missionPhase, setMissionPhase] = useState<MissionPhase>('idle');
    const [rocketVisible, setRocketVisible] = useState(false);
    const [rocketProgress, setRocketProgress] = useState(0);

    const animationFrameRef = useRef<number | null>(null);
    const readyTimeoutRef = useRef<number | null>(null);
    const animationStartedRef = useRef(false);

    const totalSimulationDays = useMemo(() => {
        return DAYS_IN_100_YEARS + (missionData?.transferWindowDays ?? 0);
    }, [missionData]);

    useEffect(() => {
        setSimulationDays(0);
        setPostAlignmentDays(0);
        setUseMissionAngles(false);
        setMissionPhase('idle');
        setRocketVisible(false);
        setRocketProgress(0);
        animationStartedRef.current = false;

        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (readyTimeoutRef.current !== null) {
            window.clearTimeout(readyTimeoutRef.current);
            readyTimeoutRef.current = null;
        }
    }, [planets, startPlanet, destinationPlanet, missionData]);

    const renderPlanets = useMemo<PlanetRenderData[]>(() => {
        if (!planets.length) {
            return [];
        }

        const minOrbitalRadius = Math.min(...planets.map((p) => p.orbitalRadius));
        const maxOrbitalRadius = Math.max(...planets.map((p) => p.orbitalRadius));

        const minDiameter = Math.min(...planets.map((p) => p.diameter));
        const maxDiameter = Math.max(...planets.map((p) => p.diameter));

        const scaleValue = (
            value: number,
            minValue: number,
            maxValue: number,
            minScale: number,
            maxScale: number
        ) => {
            if (minValue === maxValue) {
                return (minScale + maxScale) / 2;
            }

            return (
                minScale +
                ((value - minValue) / (maxValue - minValue)) * (maxScale - minScale)
            );
        };

        return planets.map((planet) => {
            const orbitSize = scaleValue(
                planet.orbitalRadius,
                minOrbitalRadius,
                maxOrbitalRadius,
                MIN_ORBIT_SIZE,
                MAX_ORBIT_SIZE
            );

            const planetSize = scaleValue(
                planet.diameter,
                minDiameter,
                maxDiameter,
                MIN_PLANET_SIZE,
                MAX_PLANET_SIZE
            );

            let angleDeg: number;

            if (useMissionAngles && missionData?.planetAngles[planet.name] !== undefined) {
                const baseAngle = missionData.planetAngles[planet.name];
                const extraAngle = (postAlignmentDays / planet.period) * 360;
                angleDeg = baseAngle + extraAngle;
            } else {
                const normalizedDays = simulationDays % planet.period;
                angleDeg = (normalizedDays / planet.period) * 360;
            }

            const angleRad = (angleDeg * Math.PI) / 180;
            const orbitRadius = orbitSize / 2;

            const x = CENTER + orbitRadius * Math.cos(angleRad);
            const y = CENTER + orbitRadius * Math.sin(angleRad);

            return {
                planet,
                orbitSize,
                planetSize,
                angleDeg,
                x,
                y
            };
        });
    }, [planets, simulationDays, useMissionAngles, missionData, postAlignmentDays]);

    const startPlanetData = useMemo(
        () => renderPlanets.find((item) => item.planet.name === startPlanet),
        [renderPlanets, startPlanet]
    );

    const destinationPlanetData = useMemo(
        () => renderPlanets.find((item) => item.planet.name === destinationPlanet),
        [renderPlanets, destinationPlanet]
    );

    const rocketFlightRatios = useMemo(() => {
        const accelerate = missionData?.accelerateSeconds ?? 1;
        const cruise = missionData?.cruiseSeconds ?? 1;
        const decelerate = missionData?.decelerateSeconds ?? 1;

        const total = accelerate + cruise + decelerate;

        return {
            accelRatio: accelerate / total,
            cruiseRatio: cruise / total,
            decelRatio: decelerate / total
        };
    }, [missionData]);

    const mappedRocketProgress = useMemo(() => {
        const { accelRatio, cruiseRatio, decelRatio } = rocketFlightRatios;
        const p = clamp(rocketProgress, 0, 1);

        if (p <= accelRatio) {
            const localT = accelRatio === 0 ? 1 : p / accelRatio;
            return 0.18 * easeOutQuad(localT);
        }

        if (p <= accelRatio + cruiseRatio) {
            const localT = cruiseRatio === 0 ? 1 : (p - accelRatio) / cruiseRatio;
            return lerp(0.18, 0.82, localT);
        }

        const localT =
            decelRatio === 0 ? 1 : (p - accelRatio - cruiseRatio) / decelRatio;
        return lerp(0.82, 1, easeInQuad(localT));
    }, [rocketProgress, rocketFlightRatios]);

    const rocketPathPoints = useMemo(() => {
        if (!startPlanetData || !destinationPlanetData) {
            return null;
        }

        const startPoint: Point = {
            x: startPlanetData.x,
            y: startPlanetData.y
        };

        const endPoint: Point = {
            x: destinationPlanetData.x,
            y: destinationPlanetData.y
        };

        const midX = (startPoint.x + endPoint.x) / 2;
        const midY = (startPoint.y + endPoint.y) / 2;

        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const normalX = distance === 0 ? 0 : -dy / distance;
        const normalY = distance === 0 ? -1 : dx / distance;

        const arcHeight = clamp(distance * 0.22, 50, 140);

        const controlPoint: Point = {
            x: midX + normalX * arcHeight,
            y: midY + normalY * arcHeight
        };

        return {
            startPoint,
            controlPoint,
            endPoint
        };
    }, [startPlanetData, destinationPlanetData]);

    const rocketPosition = useMemo(() => {
        if (!rocketPathPoints) {
            return null;
        }

        return quadraticBezier(
            rocketPathPoints.startPoint,
            rocketPathPoints.controlPoint,
            rocketPathPoints.endPoint,
            mappedRocketProgress
        );
    }, [rocketPathPoints, mappedRocketProgress]);

    const rocketAngleDeg = useMemo(() => {
        if (!rocketPathPoints) {
            return 0;
        }

        const currentT = mappedRocketProgress;
        const nextT = clamp(currentT + 0.01, 0, 1);

        const currentPoint = quadraticBezier(
            rocketPathPoints.startPoint,
            rocketPathPoints.controlPoint,
            rocketPathPoints.endPoint,
            currentT
        );

        const nextPoint = quadraticBezier(
            rocketPathPoints.startPoint,
            rocketPathPoints.controlPoint,
            rocketPathPoints.endPoint,
            nextT
        );

        return (
            (Math.atan2(nextPoint.y - currentPoint.y, nextPoint.x - currentPoint.x) * 180) /
            Math.PI
        );
    }, [rocketPathPoints, mappedRocketProgress]);

    useEffect(() => {
        if (!missionStarted || planets.length === 0 || !missionData) {
            return;
        }

        if (animationStartedRef.current) {
            return;
        }

        animationStartedRef.current = true;
        setMissionPhase('fast-forward');
        setUseMissionAngles(false);
        setSimulationDays(0);
        setPostAlignmentDays(0);
        setRocketVisible(false);
        setRocketProgress(0);

        const fastForwardStartTime = performance.now();

        const animateFastForward = (currentTime: number) => {
            const elapsed = currentTime - fastForwardStartTime;
            const progress = Math.min(elapsed / FAST_FORWARD_DURATION_MS, 1);

            setSimulationDays(progress * totalSimulationDays);

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animateFastForward);
                return;
            }

            setSimulationDays(totalSimulationDays);
            setUseMissionAngles(true);
            setPostAlignmentDays(0);
            setMissionPhase('rocket-ready');
            setRocketVisible(true);
            setRocketProgress(0);
            animationFrameRef.current = null;

            readyTimeoutRef.current = window.setTimeout(() => {
                setMissionPhase('rocket-flight');

                const rocketFlightStartTime = performance.now();

                const animateRocketFlight = (rocketTime: number) => {
                    const rocketElapsed = rocketTime - rocketFlightStartTime;
                    const rocketLinearProgress = Math.min(
                        rocketElapsed / ROCKET_FLIGHT_TOTAL_MS,
                        1
                    );

                    setRocketProgress(rocketLinearProgress);
                    setPostAlignmentDays(rocketLinearProgress * POST_ALIGNMENT_VISUAL_DAYS);

                    if (rocketLinearProgress < 1) {
                        animationFrameRef.current = requestAnimationFrame(animateRocketFlight);
                    } else {
                        animationFrameRef.current = null;
                        setRocketProgress(1);
                        setPostAlignmentDays(POST_ALIGNMENT_VISUAL_DAYS);
                        setMissionPhase('completed');
                        onMissionComplete?.();
                    }
                };

                animationFrameRef.current = requestAnimationFrame(animateRocketFlight);
            }, ROCKET_READY_DELAY_MS);
        };

        animationFrameRef.current = requestAnimationFrame(animateFastForward);

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }

            if (readyTimeoutRef.current !== null) {
                window.clearTimeout(readyTimeoutRef.current);
                readyTimeoutRef.current = null;
            }
        };
    }, [missionStarted, planets, missionData, totalSimulationDays, onMissionComplete]);

    return (
        <div className="solar-system-shell">
            <div
                className="solar-system-stage"
                style={{ width: SYSTEM_SIZE, height: SYSTEM_SIZE }}
            >
                <div className="sun"></div>

                {renderPlanets.map((item) => {
                    const isStart = item.planet.name === startPlanet;
                    const isDestination = item.planet.name === destinationPlanet;

                    return (
                        <div key={item.planet.name}>
                            <div
                                className="orbit-ring"
                                style={{
                                    width: item.orbitSize,
                                    height: item.orbitSize,
                                    left: CENTER - item.orbitSize / 2,
                                    top: CENTER - item.orbitSize / 2
                                }}
                            />

                            <div
                                className={[
                                    'planet',
                                    isStart ? 'planet-start' : '',
                                    isDestination ? 'planet-destination' : ''
                                ].join(' ')}
                                style={{
                                    width: item.planetSize,
                                    height: item.planetSize,
                                    left: item.x - item.planetSize / 2,
                                    top: item.y - item.planetSize / 2
                                }}
                                title={`${item.planet.name} • ${item.angleDeg.toFixed(2)}°`}
                            >
                                <span className="planet-tooltip">{item.planet.name}</span>
                            </div>
                        </div>
                    );
                })}

                {rocketVisible && rocketPosition && (
                    <div
                        className={[
                            'rocket',
                            missionPhase === 'rocket-ready' ? 'rocket-ready' : '',
                            missionPhase === 'rocket-flight' ? 'rocket-flight' : '',
                            missionPhase === 'completed' ? 'rocket-landed' : ''
                        ].join(' ')}
                        style={{
                            width: ROCKET_SIZE,
                            height: ROCKET_SIZE,
                            left: rocketPosition.x - ROCKET_SIZE / 2,
                            top: rocketPosition.y - ROCKET_SIZE / 2,
                            transform: `rotate(${rocketAngleDeg}deg)`
                        }}
                        title="Rocket"
                    >
                        🚀
                    </div>
                )}
            </div>
        </div>
    );
};

export default SolarSystem;