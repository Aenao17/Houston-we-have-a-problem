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
import { useEffect, useState } from 'react';
import PathsSettingsModal from '../components/PathsSettingsModal';
import SolarSystem from '../components/SolarSystem';
import { PlanetDto } from '../types/planet';
import './Home.css';

const STORAGE_KEYS = {
    path1: 'houston_path1',
    path2: 'houston_path2',
    path3: 'houston_path3'
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
    const [isComputingMission, setIsComputingMission] = useState(false);

    const [showMissingPathsAlert, setShowMissingPathsAlert] = useState(false);
    const [showBackendErrorAlert, setShowBackendErrorAlert] = useState(false);
    const [backendErrorMessage, setBackendErrorMessage] = useState('');

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
            setMissionSummary('');
            setMissionStarted(false);
            setMissionCompleted(false);

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
                throw new Error(errorText || 'Backend returned an error.');
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
        setMissionSummary('');
        setMissionStarted(false);
        setMissionCompleted(false);
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
            setMissionSummary('');
            setMissionStarted(false);
            setMissionCompleted(false);

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
            setMissionSummary(summary);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Could not compute mission.';

            setBackendErrorMessage(message);
            setShowBackendErrorAlert(true);
        } finally {
            setIsComputingMission(false);
        }
    };

    const handleStartMission = () => {
        if (!missionSummary) {
            setBackendErrorMessage('Please compute the mission first.');
            setShowBackendErrorAlert(true);
            return;
        }

        setMissionCompleted(false);
        setMissionStarted(true);

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
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

            <IonContent fullscreen className="space-content">
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
                                        Configure the required input files from settings, then start the journey.
                                    </p>
                                </IonText>

                                <div className="config-box">
                                    <p><span>Planet file</span>{path1 || 'Not set'}</p>
                                    <p><span>Rocket file</span>{path2 || 'Not set'}</p>
                                    <p><span>Solar system file</span>{path3 || 'Not set'}</p>
                                </div>

                                <IonButton expand="block" className="launch-button" onClick={handleStartJourney}>
                                    Start the journey!
                                </IonButton>
                            </IonCardContent>
                        </IonCard>
                    </div>
                ) : (
                    <div className="solar-system-page">
                        <div className="solar-system-topbar">
                            <IonButton className="back-button" fill="outline" onClick={handleBackToMissionControl}>
                                Back to Mission Control
                            </IonButton>
                        </div>

                        <SolarSystem
                            planets={planets}
                            missionStarted={missionStarted}
                            startPlanet={startPlanet}
                            destinationPlanet={destinationPlanet}
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
                                            setMissionSummary('');
                                            setMissionStarted(false);
                                            setMissionCompleted(false);
                                        }}
                                    >
                                        {planets.map((planet) => (
                                            <IonSelectOption key={`start-${planet.name}`} value={planet.name}>
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
                                            setMissionSummary('');
                                            setMissionStarted(false);
                                            setMissionCompleted(false);
                                        }}
                                    >
                                        {planets.map((planet) => (
                                            <IonSelectOption key={`destination-${planet.name}`} value={planet.name}>
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
                                            The rocket has reached {destinationPlanet}. You can now compute a new mission.
                                        </p>
                                    </div>
                                )}

                                {missionSummary && (
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
                    header="Mission warning"
                    message={backendErrorMessage}
                    buttons={['OK']}
                />
            </IonContent>
        </IonPage>
    );
};

export default Home;