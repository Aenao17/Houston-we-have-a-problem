import {
    IonAlert,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonLoading,
    IonPage,
    IonSelect,
    IonSelectOption,
    IonText,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import { settingsOutline, rocketOutline, calculatorOutline } from 'ionicons/icons';
import { useEffect, useRef, useState } from 'react';
import PathsSettingsModal from '../components/PathsSettingsModal';
import SolarSystem from '../components/SolarSystem';
import { PlanetDto } from '../types/planet';
import { MissionData } from '../types/mission';
import './Home.css';

const STORAGE_KEYS = {
    path1: 'houston_path1',
    path2: 'houston_path2',
    path3: 'houston_path3'
};

const parseMissionSummary = (summary: string): MissionData | null => {
    try {
        const transferMatch = summary.match(/Optimal transfer window in ([\d.]+) days/i);
        const accelMatch = summary.match(/cruising velocity in ([\d.]+) s/i);
        const cruiseMatch = summary.match(/nominal speed for .*? or ([\d.]+) s/i);
        const decelMatch = summary.match(/decelerate to zero in ([\d.]+) s/i);
        const totalMatch = summary.match(/Total trip time: .*? or ([\d.]+) s/i);

        const angleRegex = /([A-Za-z]+) will be at: ([\d.]+) degrees/gi;
        const planetAngles: Record<string, number> = {};

        let angleMatch: RegExpExecArray | null;
        while ((angleMatch = angleRegex.exec(summary)) !== null) {
            const planetName = angleMatch[1];
            const angle = Number(angleMatch[2]);
            planetAngles[planetName] = angle;
        }

        if (!transferMatch || !accelMatch || !cruiseMatch || !decelMatch || !totalMatch) {
            return null;
        }

        return {
            transferWindowDays: Number(transferMatch[1]),
            accelerateSeconds: Number(accelMatch[1]),
            cruiseSeconds: Number(cruiseMatch[1]),
            decelerateSeconds: Number(decelMatch[1]),
            totalTripSeconds: Number(totalMatch[1]),
            planetAngles
        };
    } catch {
        return null;
    }
};

const Home: React.FC = () => {
    const [path1, setPath1] = useState('');
    const [path2, setPath2] = useState('');
    const [path3, setPath3] = useState('');
    const [showSettings, setShowSettings] = useState(false);

    const [planets, setPlanets] = useState<PlanetDto[]>([]);
    const [loading, setLoading] = useState(false);

    const [startPlanet, setStartPlanet] = useState<string>('');
    const [destinationPlanet, setDestinationPlanet] = useState<string>('');

    const [missionStarted, setMissionStarted] = useState(false);
    const [missionCompleted, setMissionCompleted] = useState(false);
    const [missionSummary, setMissionSummary] = useState('');
    const [missionData, setMissionData] = useState<MissionData | null>(null);
    const [isComputingMission, setIsComputingMission] = useState(false);

    const [showMissingPathsAlert, setShowMissingPathsAlert] = useState(false);
    const [showBackendErrorAlert, setShowBackendErrorAlert] = useState(false);
    const [backendErrorMessage, setBackendErrorMessage] = useState('');

    const contentRef = useRef<HTMLIonContentElement | null>(null);

    const [missionRunId, setMissionRunId] = useState(0);

    useEffect(() => {
        setPath1(localStorage.getItem(STORAGE_KEYS.path1) || '');
        setPath2(localStorage.getItem(STORAGE_KEYS.path2) || '');
        setPath3(localStorage.getItem(STORAGE_KEYS.path3) || '');
    }, []);

    const handleSavePaths = (paths: { path1: string; path2: string; path3: string }) => {
        localStorage.setItem(STORAGE_KEYS.path1, paths.path1);
        localStorage.setItem(STORAGE_KEYS.path2, paths.path2);
        localStorage.setItem(STORAGE_KEYS.path3, paths.path3);

        setPath1(paths.path1);
        setPath2(paths.path2);
        setPath3(paths.path3);
    };

    const resetMissionState = () => {
        setMissionSummary('');
        setMissionData(null);
        setMissionStarted(false);
        setMissionCompleted(false);
        setMissionRunId((prev) => prev + 1);
    };

    const handleStartJourney = async () => {
        if (!path1.trim() || !path2.trim() || !path3.trim()) {
            setShowMissingPathsAlert(true);
            return;
        }

        try {
            setLoading(true);
            setPlanets([]);
            setStartPlanet('');
            setDestinationPlanet('');
            resetMissionState();

            const response = await fetch('http://localhost:8080/api/planets/load', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path1,
                    path2,
                    path3
                })
            });

            if (!response.ok) {
                const errorText = await response.text();

                if (response.status === 400) {
                    throw new Error(
                        errorText ||
                        'One or more file paths are invalid. Please check that all files exist and try again.'
                    );
                }

                if (response.status === 500) {
                    throw new Error(
                        errorText ||
                        'One or more files have an invalid format. Please verify the file contents and try again.'
                    );
                }

                throw new Error(errorText || 'Backend returned an unexpected error.');
            }

            const data: PlanetDto[] = await response.json();
            setPlanets(data);

            if (data.length > 0) {
                setStartPlanet(data[0].name);
            }

            if (data.length > 1) {
                setDestinationPlanet(data[1].name);
            } else if (data.length > 0) {
                setDestinationPlanet(data[0].name);
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Could not load planets from backend.';

            setBackendErrorMessage(message);
            setShowBackendErrorAlert(true);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToMissionControl = () => {
        setPlanets([]);
        setStartPlanet('');
        setDestinationPlanet('');
        resetMissionState();
    };

    const handleComputeMission = async () => {
        if (!startPlanet || !destinationPlanet) {
            setBackendErrorMessage('Please choose both a start planet and a destination planet.');
            setShowBackendErrorAlert(true);
            return;
        }

        if (startPlanet === destinationPlanet) {
            setBackendErrorMessage('Start planet and destination planet must be different.');
            setShowBackendErrorAlert(true);
            return;
        }

        try {
            setIsComputingMission(true);
            resetMissionState();

            const response = await fetch('http://localhost:8080/api/mission/compute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    startPlanet,
                    destinationPlanet
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Could not compute mission.');
            }

            const summary = await response.text();
            const parsedMissionData = parseMissionSummary(summary);

            if (!parsedMissionData) {
                throw new Error('Mission summary could not be parsed.');
            }

            setMissionSummary(summary);
            setMissionData(parsedMissionData);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Could not compute mission.';

            setBackendErrorMessage(message);
            setShowBackendErrorAlert(true);
        } finally {
            setIsComputingMission(false);
        }
    };

    const handleStartMission = async () => {
        if (!missionSummary || !missionData) {
            setBackendErrorMessage('Please compute the mission first.');
            setShowBackendErrorAlert(true);
            return;
        }

        setMissionCompleted(false);
        setMissionStarted(false);
        setMissionRunId((prev) => prev + 1);

        requestAnimationFrame(() => {
            setMissionStarted(true);
        });

        await contentRef.current?.scrollToTop(500);
    };

    return (
        <IonPage>
            <IonHeader className="space-header">
                <IonToolbar className="space-toolbar">
                    <IonTitle className="space-title">Houston, we have a problem</IonTitle>

                    <IonButtons slot="end">
                        <IonButton
                            className="settings-button"
                            fill="clear"
                            onClick={() => setShowSettings(true)}
                        >
                            <IonIcon icon={settingsOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent ref={contentRef} fullscreen className="space-content">
                <div className="stars"></div>
                <div className="stars stars-2"></div>
                <div className="glow-orb glow-orb-1"></div>
                <div className="glow-orb glow-orb-2"></div>

                {planets.length === 0 ? (
                    <div className="home-wrapper">
                        <IonCard className="mission-card">
                            <IonCardContent>
                                <div className="mission-badge">MISSION CONTROL</div>

                                <h1 className="mission-heading">Ready for Launch</h1>

                                <IonText className="mission-subtext">
                                    <p>
                                        Configure the required input files from settings, then start the
                                        journey.
                                    </p>
                                </IonText>

                                <div className="config-box">
                                    <p>
                                        <span>Planet file</span>
                                        {path1 || 'Not set'}
                                    </p>
                                    <p>
                                        <span>Rocket file</span>
                                        {path2 || 'Not set'}
                                    </p>
                                    <p>
                                        <span>Solar system file</span>
                                        {path3 || 'Not set'}
                                    </p>
                                </div>

                                <IonButton
                                    expand="block"
                                    className="launch-button"
                                    onClick={handleStartJourney}
                                >
                                    Start the journey!
                                </IonButton>
                            </IonCardContent>
                        </IonCard>
                    </div>
                ) : (
                    <div className="solar-system-page">
                        <div className="solar-system-topbar">
                            <IonButton
                                className="back-button"
                                fill="outline"
                                onClick={handleBackToMissionControl}
                            >
                                Back to Mission Control
                            </IonButton>
                        </div>

                        <SolarSystem
                            key={`${startPlanet}-${destinationPlanet}-${missionRunId}`}
                            planets={planets}
                            missionStarted={missionStarted}
                            startPlanet={startPlanet}
                            destinationPlanet={destinationPlanet}
                            missionData={missionData}
                            onMissionComplete={() => {
                                setMissionStarted(false);
                                setMissionCompleted(true);
                            }}
                        />

                        <div className="journey-selectors-wrapper">
                            <div className="journey-selectors-card">
                                <h2 className="journey-selectors-title">Plan Your Route</h2>

                                <IonItem className="journey-select-item">
                                    <IonLabel position="stacked">Start planet</IonLabel>
                                    <IonSelect
                                        value={startPlanet}
                                        placeholder="Select start planet"
                                        interface="popover"
                                        onIonChange={(e) => {
                                            setStartPlanet(e.detail.value);
                                            resetMissionState();
                                        }}
                                    >
                                        {planets.map((planet) => (
                                            <IonSelectOption
                                                key={`start-${planet.name}`}
                                                value={planet.name}
                                            >
                                                {planet.name}
                                            </IonSelectOption>
                                        ))}
                                    </IonSelect>
                                </IonItem>

                                <IonItem className="journey-select-item">
                                    <IonLabel position="stacked">Destination planet</IonLabel>
                                    <IonSelect
                                        value={destinationPlanet}
                                        placeholder="Select destination planet"
                                        interface="popover"
                                        onIonChange={(e) => {
                                            setDestinationPlanet(e.detail.value);
                                            resetMissionState();
                                        }}
                                    >
                                        {planets.map((planet) => (
                                            <IonSelectOption
                                                key={`destination-${planet.name}`}
                                                value={planet.name}
                                            >
                                                {planet.name}
                                            </IonSelectOption>
                                        ))}
                                    </IonSelect>
                                </IonItem>

                                <IonButton
                                    expand="block"
                                    className="compute-button"
                                    onClick={handleComputeMission}
                                    disabled={isComputingMission || missionStarted}
                                >
                                    <IonIcon icon={calculatorOutline} slot="start" />
                                    {isComputingMission ? 'Computing...' : 'Compute Mission'}
                                </IonButton>

                                {missionSummary && (
                                    <div className="mission-summary-box">
                                        <h3 className="mission-summary-title">Mission Summary</h3>
                                        <p className="mission-summary-text">{missionSummary}</p>
                                    </div>
                                )}

                                {missionCompleted && (
                                    <div className="mission-summary-box">
                                        <h3 className="mission-summary-title">Mission completed</h3>
                                        <p className="mission-summary-text">
                                            The rocket has reached {destinationPlanet}. You can now
                                            compute a new mission or start the same one again.
                                        </p>
                                    </div>
                                )}

                                {missionSummary && missionData && (
                                    <IonButton
                                        expand="block"
                                        className="mission-start-button"
                                        onClick={handleStartMission}
                                        disabled={missionStarted}
                                    >
                                        <IonIcon icon={rocketOutline} slot="start" />
                                        {missionStarted ? 'Mission Running...' : 'Start Mission!'}
                                    </IonButton>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <PathsSettingsModal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    onSave={handleSavePaths}
                    initialPath1={path1}
                    initialPath2={path2}
                    initialPath3={path3}
                />

                <IonLoading isOpen={loading} message="Loading solar system..." />

                <IonAlert
                    isOpen={showMissingPathsAlert}
                    onDidDismiss={() => setShowMissingPathsAlert(false)}
                    header="Missing configuration"
                    message="Please set all 3 file paths from Settings first."
                    buttons={['OK']}
                />

                <IonAlert
                    isOpen={showBackendErrorAlert}
                    onDidDismiss={() => setShowBackendErrorAlert(false)}
                    header="Loading error"
                    message={backendErrorMessage}
                    buttons={['OK']}
                />
            </IonContent>
        </IonPage>
    );
};

export default Home;