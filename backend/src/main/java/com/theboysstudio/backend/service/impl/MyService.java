package com.theboysstudio.backend.service.impl;


import com.theboysstudio.backend.domain.MyNumber;
import com.theboysstudio.backend.domain.Planet;
import com.theboysstudio.backend.repository.IRepository;
import com.theboysstudio.backend.service.IService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MyService implements IService {
    private final IRepository<Planet> repository;
    private MyNumber rocketAcc;

    public MyService(IRepository<Planet> repository) {
        this.repository = repository;
    }

    @Override
    public void readPlanetsFromFile(String path) throws Exception {
        this.repository.readData(path);
    }

    @Override
    public List<Planet> getAllPlanets() {
        return repository.getAll();
    }

    @Override
    public Planet getPlanetByName(String name) {
        return repository.getOneByName(name);
    }

    @Override
    public void initialize(String pathPlanets, String pathRocket) throws Exception {
        try {
            this.readPlanetsFromFile(pathPlanets);
        } catch (Exception e) {
            throw new Exception("Invalid planetary file!");
        }
        try {
            this.addRocketProps(pathRocket);
        } catch (Exception e) {
            throw new Exception("Invalid rocket file!");
        }
    }

    @Override
    public void initialize(String pathPlanets, String pathRocket, String pathSolar) throws Exception {
        try {
            this.readPlanetsFromFile(pathPlanets);
        } catch (Exception e) {
            throw new Exception("Invalid planetary file!");
        }
        try {
            this.addRocketProps(pathRocket);
        } catch (Exception e) {
            throw new Exception("Invalid rocket file!");
        }
        try {
            this.addSolarSystemProps(pathSolar);
        } catch (Exception e) {
            throw new Exception("Invalid solar file!");
        }
    }

    @Override
    public void validateFile(String path) throws Exception {
        repository.validateFile(path);
    }

    @Override
    public void validatePlanetName(String name) throws Exception {
        Planet planet = repository.getOneByName(name);
        if (planet == null)
            throw new Exception("Invalid planet name!");
    }

    @Override
    public String computeJourneyStage3(String start, String end) {
        Planet startPlanet = repository.getOneByName(start);
        Planet endPlanet = repository.getOneByName(end);

        double cruisingSpeed = Math.max(startPlanet.getEscapeV().evaluate(), endPlanet.getEscapeV().evaluate());
        double AU = 149597870.7;
        double distance = (Math.abs(startPlanet.getOrbitalRadius().evaluate() - endPlanet.getOrbitalRadius().evaluate())) * 1000 * AU;

        //la plecare
        double timeFromEVtoCV = (cruisingSpeed-startPlanet.getEscapeV().evaluate())/this.rocketAcc.evaluate();
        double timeToAchieveCV = startPlanet.getTimeToGo().evaluate() + timeFromEVtoCV;

        double distanceFromEVtoCV = (startPlanet.getEscapeV().evaluate()*timeFromEVtoCV + (this.rocketAcc.evaluate()*timeFromEVtoCV*timeFromEVtoCV)/2);
        double distanceToAchieveCV = startPlanet.getDistanceToGo().evaluate() + distanceFromEVtoCV;

        //la sosire
        double timeFromCVtoEV = (cruisingSpeed-endPlanet.getEscapeV().evaluate())/this.rocketAcc.evaluate();
        double distanceFromCVtoEV = Math.abs(cruisingSpeed*cruisingSpeed-endPlanet.getEscapeV().multiply(endPlanet.getEscapeV()).evaluate())
                / (2*this.rocketAcc.evaluate());

        double timeToLand = endPlanet.getTimeToGo().evaluate() + timeFromCVtoEV;
        double distToLand = endPlanet.getDistanceToGo().evaluate() + distanceFromCVtoEV;

        //la mijloc
        double cruisingDist = distance-startPlanet.getDiameter().evaluate()/2-endPlanet.getDiameter().evaluate()/2-
                distToLand - distanceToAchieveCV;
        double cruisingTime = cruisingDist/cruisingSpeed;

        double totaltime = timeToAchieveCV + cruisingTime + timeToLand;

        String str="";
        str+= timeToAchieveCV + "," + distanceToAchieveCV+","+cruisingTime+","+distToLand+","+timeToLand+","+totaltime;

        return str;
    }

    @Override
    public String simulateSolarSystem(int days) {
        List<Planet> planets = repository.getAll();
        StringBuilder str = new StringBuilder();
        for(Planet planet: planets){
            double position = ((360 / planet.getPeriod().evaluate())*days)%360;
            str.append(planet.getName()).append(";").append(position).append(",");
        }
        return str.toString();
    }

    private int findOptimalTransferWindow(String start, String end){
        Planet startPlanet = this.getPlanetByName(start);
        Planet endPlanet = this.getPlanetByName(end);

        double minDist=Double.MAX_VALUE;
        int minI=0;

        List<Planet> planets = repository.getAll();
        double AU = 149597870.7;

        for(int i=1;i<=3650;i++){
            int copyi=i;
            i=i+36500;

            double startPos = ((360 / startPlanet.getPeriod().evaluate())*i)%360;
            double endPos = ((360 / endPlanet.getPeriod().evaluate())*i)%360;

            //convert to radians
            double startRad = Math.toRadians(startPos);
            double endRad = Math.toRadians(endPos);

            //convert to a Cartesian system
            double startX = startPlanet.getOrbitalRadius().evaluate() * Math.cos(startRad);
            double startY = startPlanet.getOrbitalRadius().evaluate() * Math.sin(startRad);

            double endX = endPlanet.getOrbitalRadius().evaluate() * Math.cos(endRad);
            double endY = endPlanet.getOrbitalRadius().evaluate() * Math.sin(endRad);

            //compute the distance between the two planets
            double distance = Math.sqrt(Math.pow(startX-endX,2)+Math.pow(startY-endY,2))*AU*1000;

            if(distance<minDist){
                //check if this journey is possible (rocket wont crash into a planet)
                int cnt=0;
                for(Planet planet: planets){
                    if(planet.getName().equals(start) || planet.getName().equals(end))
                        continue;

                    double planetPos = ((360 / planet.getPeriod().evaluate())*i)%360;
                    double planetRad = Math.toRadians(planetPos);

                    double planetX = planet.getOrbitalRadius().evaluate()*Math.cos(planetRad);
                    double planetY = planet.getOrbitalRadius().evaluate()*Math.sin(planetRad);

                    //compute d = |(x2-x1)(y1-y0)-(x1-x0)(y2-y1)|/sqrt((x2-x1)^2+(y2-y1)^2)
                    double d = (Math.abs((endX-startX)*(startY-planetY)-(startX-planetX)*(endY-startY)))/
                            (Math.sqrt(Math.pow(endX-startX,2)+Math.pow(endY-startY,2)));
                    d=d*AU*1000;

                    if(d>planet.getDiameter().evaluate()/2){
                        cnt++;
                    }
                }
                if(cnt==planets.size()-2){
                    minDist=distance;
                    minI=i;
                }
            }
            i=copyi;
        }

        return minI;
    }

    @Override
    public String computeJourneyStage5(String start, String end) {
        int optimalTime = findOptimalTransferWindow(start,end);

        Planet startPlanet = this.getPlanetByName(start);
        Planet endPlanet = this.getPlanetByName(end);

        //distance between the two planets after optimalTime days
        double AU = 149597870.7;
        double startPos = ((360 / startPlanet.getPeriod().evaluate())*optimalTime)%360;
        double endPos = ((360 / endPlanet.getPeriod().evaluate())*optimalTime)%360;

        //convert to radians
        double startRad = Math.toRadians(startPos);
        double endRad = Math.toRadians(endPos);

        //convert to a Cartesian system
        double startX = startPlanet.getOrbitalRadius().evaluate() * Math.cos(startRad);
        double startY = startPlanet.getOrbitalRadius().evaluate() * Math.sin(startRad);

        double endX = endPlanet.getOrbitalRadius().evaluate() * Math.cos(endRad);
        double endY = endPlanet.getOrbitalRadius().evaluate() * Math.sin(endRad);

        //compute the distance between the two planets
        double distance = Math.sqrt(Math.pow(startX-endX,2)+Math.pow(startY-endY,2))*1000*AU;
        double cruisingSpeed = Math.max(startPlanet.getEscapeV().evaluate(), endPlanet.getEscapeV().evaluate());

        //la plecare
        double timeFromEVtoCV = (cruisingSpeed-startPlanet.getEscapeV().evaluate())/this.rocketAcc.evaluate();
        double timeToAchieveCV = startPlanet.getTimeToGo().evaluate() + timeFromEVtoCV;

        double distanceFromEVtoCV = (startPlanet.getEscapeV().evaluate()*timeFromEVtoCV + (this.rocketAcc.evaluate()*timeFromEVtoCV*timeFromEVtoCV)/2);
        double distanceToAchieveCV = startPlanet.getDistanceToGo().evaluate() + distanceFromEVtoCV;

        //la sosire
        double timeFromCVtoEV = (cruisingSpeed-endPlanet.getEscapeV().evaluate())/this.rocketAcc.evaluate();
        double distanceFromCVtoEV = Math.abs(cruisingSpeed*cruisingSpeed-endPlanet.getEscapeV().multiply(endPlanet.getEscapeV()).evaluate())
                / (2*this.rocketAcc.evaluate());

        double timeToLand = endPlanet.getTimeToGo().evaluate() + timeFromCVtoEV;
        double distToLand = endPlanet.getDistanceToGo().evaluate() + distanceFromCVtoEV;

        //
        double cruisingDist = distance-startPlanet.getDiameter().evaluate()/2-endPlanet.getDiameter().evaluate()/2-
                distToLand - distanceToAchieveCV;
        double cruisingTime = cruisingDist/cruisingSpeed;

        double totaltime = timeToAchieveCV + cruisingTime + timeToLand;

        String str="";

        str+= timeToAchieveCV + "," + distanceToAchieveCV+","+cruisingTime+","+distToLand+","+timeToLand+","+totaltime +","+ (optimalTime-36500);

        return str;

    }

    private int findOptimalTransferWindowAdvanced(String start, String end) {
        Planet startPlanet = this.getPlanetByName(start);
        Planet endPlanet = this.getPlanetByName(end);
        List<Planet> planets = repository.getAll();

        // transfer m/s in UA/zi
        double rocketSpeed = this.rocketAcc.evaluate()*86400/149597870.7;


        double minMetric = Double.MAX_VALUE; // Metoda noastră de optimizare: minimizarea distanței (traseul)
        int optimalDeparture = 0;

        // Căutăm în intervalul de candidate, de exemplu 10 ani (3650 zile)
        for (int departure = 0; departure <= 3650; departure++) {
            // Calculăm poziția planetei de plecare la momentul lansării (în grade)
            double startPeriod = startPlanet.getPeriod().evaluate(); // perioadă în zile
            double startAngleDeg = ((360.0 / startPeriod) * departure) % 360.0;
            double startAngleRad = Math.toRadians(startAngleDeg);
            double startOrbitRadius = startPlanet.getOrbitalRadius().evaluate(); // în UA

            // Aproximare inițială pentru timpul de transfer: diferența absolută între orbite, împărțită la viteza rachetei
            double T_transfer = Math.abs(endPlanet.getOrbitalRadius().evaluate() - startOrbitRadius) / rocketSpeed;

            // Iterăm de câteva ori pentru a rafina T_transfer pe baza distanței efective (chordul)
            for (int iter = 0; iter < 3; iter++) {
                double arrivalTime = departure + T_transfer;
                double endPeriod = endPlanet.getPeriod().evaluate();
                double endAngleDeg = ((360.0 / endPeriod) * arrivalTime) % 360.0;
                double endAngleRad = Math.toRadians(endAngleDeg);
                double endOrbitRadius = endPlanet.getOrbitalRadius().evaluate();

                // Coordonatele planetei de plecare și de sosire (în UA)
                double startX = startOrbitRadius * Math.cos(startAngleRad);
                double startY = startOrbitRadius * Math.sin(startAngleRad);
                double endX = endOrbitRadius * Math.cos(endAngleRad);
                double endY = endOrbitRadius * Math.sin(endAngleRad);

                // Calculăm distanța (cât de scurtă este traiectoria transferului)
                double chordDistance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                // Reevaluăm timpul de transfer în funcție de distanța calculată și viteza rachetei
                T_transfer = chordDistance / rocketSpeed;
            }

            // Se calculează pozițiile finale folosind T_transfer rafinat
            double arrivalTime = departure + T_transfer;
            double endPeriod = endPlanet.getPeriod().evaluate();
            double endAngleDeg = ((360.0 / endPeriod) * arrivalTime) % 360.0;
            double endAngleRad = Math.toRadians(endAngleDeg);
            double endOrbitRadius = endPlanet.getOrbitalRadius().evaluate();

            // Coordonatele finale pentru plecare și sosire (în UA)
            double startX = startOrbitRadius * Math.cos(startAngleRad);
            double startY = startOrbitRadius * Math.sin(startAngleRad);
            double endX = endOrbitRadius * Math.cos(endAngleRad);
            double endY = endOrbitRadius * Math.sin(endAngleRad);

            // Distanța totală parcursă de rachetă (măsurată ca și chord distance)
            double chordDistance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

            // Verificăm dacă traiectoria este collision-free, folosind interpolarea liniară
            boolean collisionFree = true;
            int steps = 100; // numărul de puncte de verificare pe traiectorie

            for (int step = 0; step <= steps; step++) {
                double fraction = (double) step / steps;
                // Interpolare liniară: poziția curentă a rachetei
                double rocketX = startX + fraction * (endX - startX);
                double rocketY = startY + fraction * (endY - startY);
                // Timpul asociat punctului curent (lin între lansare și sosire)
                double currentTime = departure + fraction * T_transfer;

                // Verificăm fiecare planetă (excepția celor de plecare și sosire)
                for (Planet planet : planets) {
                    if (planet.getName().equals(startPlanet.getName()) || planet.getName().equals(endPlanet.getName())) {
                        continue;
                    }
                    double planetPeriod = planet.getPeriod().evaluate();
                    double planetAngleDeg = ((360.0 / planetPeriod) * currentTime) % 360.0;
                    double planetAngleRad = Math.toRadians(planetAngleDeg);
                    double planetOrbitRadius = planet.getOrbitalRadius().evaluate();
                    double planetX = planetOrbitRadius * Math.cos(planetAngleRad);
                    double planetY = planetOrbitRadius * Math.sin(planetAngleRad);

                    double distance = Math.sqrt(Math.pow(rocketX - planetX, 2) + Math.pow(rocketY - planetY, 2));
                    // Pentru verificare, se compară cu raza planetei.
                    // Notă: se presupune că getDiameter().evaluate() returnează diametrul în UA sau se face conversia necesară.
                    double planetRadius = planet.getDiameter().evaluate() / 2.0;

                    if (distance * 149597870.7 * 1000 < planetRadius) {
                        collisionFree = false;
                        break;
                    }
                }
                if (!collisionFree) break;
            }

            // Dacă traiectoria este sigură, folosim distanța chord ca metric de optimizare
            if (collisionFree && chordDistance < minMetric) {
                minMetric = chordDistance;
                optimalDeparture = departure;
            }
        }
        return optimalDeparture;
    }



    @Override
    public String computeJourneyStage6(String start, String end) {
        int optimalTime = findOptimalTransferWindowAdvanced(start,end);

        Planet startPlanet = this.getPlanetByName(start);
        Planet endPlanet = this.getPlanetByName(end);

        //distance between the two planets after optimalTime days
        double AU = 149597870.7;
        double startPos = ((360 / startPlanet.getPeriod().evaluate())*optimalTime)%360;
        double endPos = ((360 / endPlanet.getPeriod().evaluate())*optimalTime)%360;

        //convert to radians
        double startRad = Math.toRadians(startPos);
        double endRad = Math.toRadians(endPos);

        //convert to a Cartesian system
        double startX = startPlanet.getOrbitalRadius().evaluate() * Math.cos(startRad);
        double startY = startPlanet.getOrbitalRadius().evaluate() * Math.sin(startRad);

        double endX = endPlanet.getOrbitalRadius().evaluate() * Math.cos(endRad);
        double endY = endPlanet.getOrbitalRadius().evaluate() * Math.sin(endRad);

        //compute the distance between the two planets
        double distance = Math.sqrt(Math.pow(startX-endX,2)+Math.pow(startY-endY,2))*1000*AU;
        double cruisingSpeed = Math.max(startPlanet.getEscapeV().evaluate(), endPlanet.getEscapeV().evaluate());

        //la plecare
        double timeFromEVtoCV = (cruisingSpeed-startPlanet.getEscapeV().evaluate())/this.rocketAcc.evaluate();
        double timeToAchieveCV = startPlanet.getTimeToGo().evaluate() + timeFromEVtoCV;

        double distanceFromEVtoCV = (startPlanet.getEscapeV().evaluate()*timeFromEVtoCV + (this.rocketAcc.evaluate()*timeFromEVtoCV*timeFromEVtoCV)/2);
        double distanceToAchieveCV = startPlanet.getDistanceToGo().evaluate() + distanceFromEVtoCV;

        //la sosire
        double timeFromCVtoEV = (cruisingSpeed-endPlanet.getEscapeV().evaluate())/this.rocketAcc.evaluate();
        double distanceFromCVtoEV = Math.abs(cruisingSpeed*cruisingSpeed-endPlanet.getEscapeV().multiply(endPlanet.getEscapeV()).evaluate())
                / (2*this.rocketAcc.evaluate());

        double timeToLand = endPlanet.getTimeToGo().evaluate() + timeFromCVtoEV;
        double distToLand = endPlanet.getDistanceToGo().evaluate() + distanceFromCVtoEV;

        //
        double cruisingDist = distance-startPlanet.getDiameter().evaluate()/2-endPlanet.getDiameter().evaluate()/2-
                distToLand - distanceToAchieveCV;
        double cruisingTime = cruisingDist/cruisingSpeed;

        double totaltime = timeToAchieveCV + cruisingTime + timeToLand;

        String str="";

        str+= timeToAchieveCV + "," + distanceToAchieveCV+","+cruisingTime+","+distToLand+","+timeToLand+","+totaltime +","+ (optimalTime);

        return str;
    }

    private void addRocketProps(String path) throws Exception {
        String line = repository.getRocketProps(path);
        String[] props = line.split(",");
        Double base = Integer.parseInt(props[0]) * Double.parseDouble(props[1]);
        MyNumber rocketSpeed = new MyNumber(base, 0);
        this.rocketAcc = rocketSpeed;

        List<Planet> planets = repository.getAll();

        for (Planet planet : planets) {
            MyNumber t = planet.getEscapeV().divide(rocketSpeed);
            MyNumber d = (rocketSpeed.multiply(t.multiply(t))).divide(2);
            planet.setTimeToGo(t);
            planet.setDistanceToGo(d);
        }
    }

    private void addSolarSystemProps(String path) throws Exception {
        List<String> lines = repository.getSolarSystemProps(path);
        for (String line : lines) {
            String[] props = line.split(",");
            Double base1 = (double) Integer.parseInt(props[1]);
            Double base2 = Double.parseDouble(props[2]);
            MyNumber period = new MyNumber(base1, 0);
            MyNumber orbit = new MyNumber(base2, 0);

            Planet planet = this.getPlanetByName(props[0]);
            planet.setPeriod(period);
            planet.setOrbitalRadius(orbit);
        }
    }
}
