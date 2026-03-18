export type MissionData = {
    transferWindowDays: number;
    accelerateSeconds: number;
    cruiseSeconds: number;
    decelerateSeconds: number;
    totalTripSeconds: number;
    planetAngles: Record<string, number>;
};