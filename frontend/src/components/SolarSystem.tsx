import { useEffect, useMemo, useState } from 'react';
import { PlanetDto } from '../types/planet';
import './SolarSystem.css';

type SolarSystemProps = {
    planets: PlanetDto[];
    missionStarted?: boolean;
    startPlanet?: string;
    destinationPlanet?: string;
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
    period: number;
};

type PlanetState = {
    angle: number;
    position: Point;
};

type MissionPhase = 'idle' | 'intro' | 'ready' | 'flight' | 'landed';

const INITIAL_ALIGNMENT_ANGLE = 90;

const INTRO_DURATION_MS = 4000;
const READY_DURATION_MS = 1200;
const ROCKET_TRAVEL_MS = 4000;

const YEAR_IN_SECONDS = 365.25 * 24 * 60 * 60;
const INTRO_SPEED_SECONDS_PER_REAL_SECOND = 0.0001 * YEAR_IN_SECONDS;

const getPlanetColor = (name: string): string => {
    const colors: Record<string, string> = {
        Mercury: '#a6a6a6',
        Venus: '#d9b36c',
        Earth: '#4ea5ff',
        Mars: '#d96b4a',
        Jupiter: '#d2b48c',
        Saturn: '#e7d28d',
        Uranus: '#8fe0e8',
        Neptune: '#4b70dd',
        Pluto: '#9bc9f5'
    };

    return colors[name] || '#9fd4ff';
};

const normalizeOrbit = (value: number, min: number, max: number) => {
    if (max === min) return 220;
    const normalized = (value - min) / (max - min);
    return 220 + normalized * 520;
};

const normalizeSize = (value: number, min: number, max: number) => {
    if (max === min) return 18;
    return 12 + ((value - min) / (max - min)) * 28;
};

const getSafePeriod = (planet: PlanetDto, index: number) => {
    if (planet.period && planet.period > 0) return planet.period;
    return (index + 1) * 10000000;
};

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const getCartesianPosition = (orbitSize: number, angleDegrees: number): Point => {
    const radius = orbitSize / 2;
    const radians = toRadians(angleDegrees);

    return {
        x: radius * Math.cos(radians),
        y: radius * Math.sin(radians)
    };
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const getLinearPoint = (p0: Point, p1: Point, t: number): Point => ({
    x: lerp(p0.x, p1.x, t),
    y: lerp(p0.y, p1.y, t)
});

const easeInOutCubic = (t: number) => {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const getMissionPhase = (missionStarted: boolean, elapsedMs: number): MissionPhase => {
    if (!missionStarted) return 'idle';
    if (elapsedMs < INTRO_DURATION_MS) return 'intro';
    if (elapsedMs < INTRO_DURATION_MS + READY_DURATION_MS) return 'ready';
    if (elapsedMs < INTRO_DURATION_MS + READY_DURATION_MS + ROCKET_TRAVEL_MS) return 'flight';
    return 'landed';
};

const SolarSystem: React.FC<SolarSystemProps> = ({
                                                     planets,
                                                     missionStarted = false,
                                                     startPlanet = '',
                                                     destinationPlanet = '',
                                                     onMissionComplete
                                                 }) => {
    const [elapsedMs, setElapsedMs] = useState(0);
    const [completionSent, setCompletionSent] = useState(false);

    const orbitalRadii = useMemo(() => planets.map((p) => p.orbitalRadius), [planets]);
    const diameters = useMemo(() => planets.map((p) => p.diameter), [planets]);

    const minOrbit = orbitalRadii.length ? Math.min(...orbitalRadii) : 0;
    const maxOrbit = orbitalRadii.length ? Math.max(...orbitalRadii) : 0;
    const minDiameter = diameters.length ? Math.min(...diameters) : 0;
    const maxDiameter = diameters.length ? Math.max(...diameters) : 0;

    const planetVisualData: PlanetRenderData[] = useMemo(() => {
        return planets.map((planet, index) => ({
            planet,
            orbitSize: normalizeOrbit(planet.orbitalRadius, minOrbit, maxOrbit),
            planetSize: normalizeSize(planet.diameter, minDiameter, maxDiameter),
            period: getSafePeriod(planet, index)
        }));
    }, [planets, minOrbit, maxOrbit, minDiameter, maxDiameter]);

    const flightStartMs = INTRO_DURATION_MS + READY_DURATION_MS;

    useEffect(() => {
        if (!missionStarted) {
            setElapsedMs(0);
            setCompletionSent(false);
            return;
        }

        let frameId = 0;
        const startTime = performance.now();

        const tick = (now: number) => {
            setElapsedMs(now - startTime);
            frameId = requestAnimationFrame(tick);
        };

        frameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameId);
    }, [missionStarted, startPlanet, destinationPlanet]);

    const phase = useMemo(
        () => getMissionPhase(missionStarted, elapsedMs),
        [missionStarted, elapsedMs]
    );

    const getSimulatedSecondsAt = (timeMs: number) => {
        if (!missionStarted) return 0;

        const cappedTimeMs = Math.min(timeMs, INTRO_DURATION_MS);
        return (cappedTimeMs / 1000) * INTRO_SPEED_SECONDS_PER_REAL_SECOND;
    };

    const introSimulatedSeconds = useMemo(
        () => getSimulatedSecondsAt(elapsedMs),
        [elapsedMs, missionStarted]
    );

    const frozenSimulatedSeconds = useMemo(
        () => getSimulatedSecondsAt(INTRO_DURATION_MS),
        [missionStarted]
    );

    const displayedSimulatedSeconds =
        phase === 'intro' ? introSimulatedSeconds : frozenSimulatedSeconds;

    const getPlanetAngle = (period: number, simulatedSeconds: number) => {
        const completedRotations = simulatedSeconds / period;
        return INITIAL_ALIGNMENT_ANGLE + completedRotations * 360;
    };

    const displayedPlanetStates = useMemo(() => {
        const result = new Map<string, PlanetState>();

        for (const entry of planetVisualData) {
            const angle = getPlanetAngle(entry.period, displayedSimulatedSeconds);
            const position = getCartesianPosition(entry.orbitSize, angle);
            result.set(entry.planet.name, { angle, position });
        }

        return result;
    }, [planetVisualData, displayedSimulatedSeconds]);

    const startPosition = displayedPlanetStates.get(startPlanet)?.position ?? null;
    const destinationPosition = displayedPlanetStates.get(destinationPlanet)?.position ?? null;

    const rocketFlightPosition = useMemo(() => {
        if (!missionStarted || !startPlanet || !destinationPlanet) return null;
        if (!startPosition || !destinationPosition) return null;
        if (phase !== 'flight') return null;

        const rawProgress = (elapsedMs - flightStartMs) / ROCKET_TRAVEL_MS;
        const clampedProgress = Math.min(Math.max(rawProgress, 0), 1);
        const easedProgress = easeInOutCubic(clampedProgress);

        return getLinearPoint(startPosition, destinationPosition, easedProgress);
    }, [
        missionStarted,
        startPlanet,
        destinationPlanet,
        startPosition,
        destinationPosition,
        phase,
        elapsedMs,
        flightStartMs
    ]);

    const showRocketOnStartPlanet = phase === 'ready';
    const showRocketFlying = phase === 'flight' && !!rocketFlightPosition;
    const showRocketOnDestinationPlanet = phase === 'landed';

    useEffect(() => {
        if (!missionStarted) {
            setCompletionSent(false);
            return;
        }

        if (phase === 'landed' && !completionSent) {
            setCompletionSent(true);
            onMissionComplete?.();
        }
    }, [phase, completionSent, missionStarted, onMissionComplete]);

    if (planets.length === 0) return null;

    return (
        <div className="solar-system-wrapper">
            <h2 className="solar-system-title">
                {missionStarted ? 'Mission Simulation' : 'Solar System View'}
            </h2>

            <div className="solar-system">
                <div className={`sun ${missionStarted ? 'sun-animated' : ''}`}>Sun</div>

                {planetVisualData.map(({ planet, orbitSize, planetSize, period }) => {
                    const displayedState = displayedPlanetStates.get(planet.name);
                    const angle =
                        displayedState?.angle ??
                        getPlanetAngle(period, displayedSimulatedSeconds);

                    const isStartPlanet = planet.name === startPlanet;
                    const isDestinationPlanet = planet.name === destinationPlanet;

                    return (
                        <div
                            key={planet.name}
                            className="orbit"
                            style={{
                                width: `${orbitSize}px`,
                                height: `${orbitSize}px`
                            }}
                        >
                            <div
                                className="planet-anchor"
                                style={{
                                    transform: `rotate(${angle}deg)`
                                }}
                            >
                                <div
                                    className="planet"
                                    style={{
                                        width: `${planetSize}px`,
                                        height: `${planetSize}px`,
                                        background: getPlanetColor(planet.name)
                                    }}
                                    title={planet.name}
                                >
                                    <span className="planet-label">{planet.name}</span>

                                    {showRocketOnStartPlanet && isStartPlanet && (
                                        <span className="rocket-marker" title="Rocket ready">
                                            🚀
                                        </span>
                                    )}

                                    {showRocketOnDestinationPlanet && isDestinationPlanet && (
                                        <span className="rocket-marker" title="Rocket landed">
                                            🚀
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {showRocketFlying && rocketFlightPosition && (
                    <div
                        className="flying-rocket"
                        style={{
                            transform: `translate(${rocketFlightPosition.x}px, ${rocketFlightPosition.y}px)`
                        }}
                        title="Rocket in flight"
                    >
                        🚀
                    </div>
                )}
            </div>

            <div className="planet-legend">
                {planets.map((planet) => (
                    <div key={planet.name} className="planet-legend-item">
                        <span
                            className="planet-legend-dot"
                            style={{ background: getPlanetColor(planet.name) }}
                        />
                        <div>
                            <strong>{planet.name}</strong>
                            <p>Diameter: {planet.diameter}</p>
                            <p>Orbital radius: {planet.orbitalRadius}</p>
                            <p>Period: {planet.period}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SolarSystem;