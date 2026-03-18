import {
    IonAlert,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonModal,
    IonTitle,
    IonToolbar,
    IonIcon
} from '@ionic/react';
import { closeOutline, saveOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import './PathsSettingsModal.css';

type PathsSettingsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (paths: { path1: string; path2: string; path3: string }) => void;
    initialPath1: string;
    initialPath2: string;
    initialPath3: string;
};

const PathsSettingsModal: React.FC<PathsSettingsModalProps> = ({
                                                                   isOpen,
                                                                   onClose,
                                                                   onSave,
                                                                   initialPath1,
                                                                   initialPath2,
                                                                   initialPath3
                                                               }) => {
    const [path1, setPath1] = useState('');
    const [path2, setPath2] = useState('');
    const [path3, setPath3] = useState('');
    const [showAlert, setShowAlert] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setPath1(initialPath1);
            setPath2(initialPath2);
            setPath3(initialPath3);
        }
    }, [isOpen, initialPath1, initialPath2, initialPath3]);

    const handleSave = () => {
        if (!path1.trim() || !path2.trim() || !path3.trim()) {
            setShowAlert(true);
            return;
        }

        onSave({
            path1: path1.trim(),
            path2: path2.trim(),
            path3: path3.trim()
        });

        onClose();
    };

    return (
        <>
            <IonModal isOpen={isOpen} onDidDismiss={onClose} className="paths-modal">
                <IonHeader className="paths-modal-header">
                    <IonToolbar className="paths-modal-toolbar">
                        <IonTitle className="paths-modal-title">Mission Settings</IonTitle>
                        <IonButtons slot="end">
                            <IonButton fill="clear" className="modal-close-btn" onClick={onClose}>
                                <IonIcon icon={closeOutline} />
                            </IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>

                <IonContent className="paths-modal-content ion-padding">
                    <div className="paths-modal-bg"></div>

                    <div className="paths-modal-wrapper">
                        <div className="paths-modal-badge">CONFIGURATION</div>
                        <h2 className="paths-modal-heading">Input File Paths</h2>
                        <p className="paths-modal-subtext">
                            Set the required files for the mission control system.
                        </p>

                        <IonItem className="space-input-item">
                            <IonLabel position="stacked">Planet file path</IonLabel>
                            <IonInput
                                value={path1}
                                placeholder="C:\\data\\planets.txt"
                                onIonInput={(e) => setPath1(e.detail.value || '')}
                            />
                        </IonItem>

                        <IonItem className="space-input-item">
                            <IonLabel position="stacked">Rocket file path</IonLabel>
                            <IonInput
                                value={path2}
                                placeholder="C:\\data\\rocket.txt"
                                onIonInput={(e) => setPath2(e.detail.value || '')}
                            />
                        </IonItem>

                        <IonItem className="space-input-item">
                            <IonLabel position="stacked">Solar system file path</IonLabel>
                            <IonInput
                                value={path3}
                                placeholder="C:\\data\\solar.txt"
                                onIonInput={(e) => setPath3(e.detail.value || '')}
                            />
                        </IonItem>

                        <div className="paths-modal-actions">
                            <IonButton expand="block" className="save-paths-button" onClick={handleSave}>
                                <IonIcon icon={saveOutline} slot="start" />
                                Save Settings
                            </IonButton>
                        </div>
                    </div>
                </IonContent>
            </IonModal>

            <IonAlert
                isOpen={showAlert}
                onDidDismiss={() => setShowAlert(false)}
                header="Missing paths"
                message="Please complete all 3 file paths before saving."
                buttons={['OK']}
            />
        </>
    );
};

export default PathsSettingsModal;