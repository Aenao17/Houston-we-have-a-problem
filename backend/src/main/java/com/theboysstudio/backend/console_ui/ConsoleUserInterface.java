package com.theboysstudio.backend.console_ui;

import com.theboysstudio.backend.domain.Planet;
import com.theboysstudio.backend.service.IService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.List;
import java.util.Scanner;

@Component
public class ConsoleUserInterface {
    private final IService service;

    public ConsoleUserInterface(IService service) {
        this.service = service;
    }

    private void stage1(Scanner scanner) {
        System.out.println("From which file do you want to read data? Enter 0 to exit.");
        while (true) {
            try {
                String path = scanner.nextLine();
                if (path.equals("0")) {
                    break;
                }
                service.readPlanetsFromFile(path);
                displayPlanets();
                System.out.println("\nFrom which file do you want to read data? Enter 0 to exit.");
            } catch (Exception e) {
                System.err.println("Oups..., this file doesn't exist!\n");
                System.out.println("From which file do you want to read data? Enter 0 to exit.");
            }
        }
    }

    private void stage2(Scanner scanner) {
        boolean path1Valid = false;
        boolean path2Valid = false;
        String path1 = "";
        String path2 = "";
        while (true) {
            try {
                if (!path1Valid) {
                    path1 = getPlanetaryData(scanner);
                    if (path1.equals("0"))
                        break;
                    service.validateFile(path1);
                    path1Valid = true;
                }
                if (!path2Valid) {
                    path2 = getRocketData(scanner);
                    if (path2.equals("0"))
                        break;
                    service.validateFile(path2);
                    path2Valid = true;
                }
                service.initialize(path1, path2);
                displayPlanetsWithRocket();
                path1Valid = false;
                path2Valid = false;
            } catch (Exception e) {
                System.err.println(e.getMessage());
                if (e.getMessage().contains("Invalid rocket file!"))
                    path2Valid = false;
                if (e.getMessage().contains("Invalid planetary file!"))
                    path1Valid = false;
            }
        }
    }

    private void stage3(Scanner scanner) {
        boolean path1Valid = false;
        boolean path2Valid = false;
        boolean path3Valid = false;
        boolean initialized = false;
        String path1 = "";
        String path2 = "";
        String path3 = "";
        while (true) {
            try {
                if (!path1Valid) {
                    path1 = getPlanetaryData(scanner);
                    if (path1.equals("0"))
                        break;
                    service.validateFile(path1);
                    path1Valid = true;
                }
                if (!path2Valid) {
                    path2 = getRocketData(scanner);
                    if (path2.equals("0"))
                        break;
                    service.validateFile(path2);
                    path2Valid = true;
                }
                if (!path3Valid) {
                    path3 = getSolarSystemData(scanner);
                    if (path3.equals("0"))
                        break;
                    service.validateFile(path3);
                    path3Valid = true;
                }
                service.initialize(path1, path2, path3);
                initialized = true;
            } catch (Exception e) {
                System.err.println(e.getMessage());
                if (e.getMessage().contains("Invalid rocket file!"))
                    path2Valid = false;
                if (e.getMessage().contains("Invalid planetary file!"))
                    path1Valid = false;
                if (e.getMessage().contains("Invalid solar file!"))
                    path3Valid = false;
            }

            if (initialized) {
                displayPlanetsName();
                String planet1 = getPlanet1(scanner);
                if (planet1.equals("0"))
                    break;

                try {
                    service.validatePlanetName(planet1);
                } catch (Exception e) {
                    System.err.println("Invalid starting planet name!");
                    continue;
                }

                String planet2 = getPlanet2(scanner);
                if (planet2.equals("0"))
                    break;

                try {
                    service.validatePlanetName(planet2);
                } catch (Exception e) {
                    System.err.println("Invalid destination planet name!");
                }

                String result = service.computeJourneyStage3(planet1, planet2);
                displayStage3(result, planet1, planet2);
            }
        }
    }

    private void stage4(Scanner scanner) throws IOException {
        boolean path1Valid = false;
        boolean path2Valid = false;
        boolean path3Valid = false;
        boolean initialized = false;
        String path1 = "";
        String path2 = "";
        String path3 = "";
        while (true) {
            try {
                if (!path1Valid) {
                    path1 = getPlanetaryData(scanner);
                    if (path1.equals("0"))
                        break;
                    service.validateFile(path1);
                    path1Valid = true;
                }
                if (!path2Valid) {
                    path2 = getRocketData(scanner);
                    if (path2.equals("0"))
                        break;
                    service.validateFile(path2);
                    path2Valid = true;
                }
                if (!path3Valid) {
                    path3 = getSolarSystemData(scanner);
                    if (path3.equals("0"))
                        break;
                    service.validateFile(path3);
                    path3Valid = true;
                }
                service.initialize(path1, path2, path3);
                initialized = true;
            } catch (Exception e) {
                System.err.println(e.getMessage());
                if (e.getMessage().contains("Invalid rocket file!"))
                    path2Valid = false;
                if (e.getMessage().contains("Invalid planetary file!"))
                    path1Valid = false;
                if (e.getMessage().contains("Invalid solar file!"))
                    path3Valid = false;
            }
            if (initialized) {
                int days = getStage4();
                if (days == -1) {
                    System.err.println("Invalid number of days!");
                } else if (days == 0) {
                    break;
                } else {
                    String result = service.simulateSolarSystem(days);
                    String[] planets = result.split(",");
                    for (String planet : planets) {
                        String[] props = planet.split(";");
                        System.out.println(props[0] + " will be at: " + convertDoubleTo2Decimals(props[1]) + " degrees");
                    }
                }
            }
        }
    }

    private int getStage4() throws IOException {
        System.out.println("Let's go into the future, how many days do you want to go? (Enter 0 to exit)");
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String str = reader.readLine();
        int nr;
        try {
            nr = Integer.parseInt(str);
        } catch (Exception e) {
            nr = -1;
        }
        return nr;
    }

    private void displayStage3(String str, String planet1, String planet2) {
        String[] props = str.split(",");
        System.out.println(planet1 + " to " + planet2 + " journey summary:");
        System.out.println("Rocket will reach its cruising velocity in " + convertDoubleTo2Decimals(props[0]) + " s");
        System.out.println("Rocket will be at " + convertDoubleTo2Decimals(props[1]) + " m above " + planet1 + " when it will be reaching that velocity");
        System.out.println("Rocket will travel at nominal speed for " + convertSecondsToDays(Double.parseDouble(props[2])) + " or " + convertDoubleTo2Decimals(props[2]) + " s");
        System.out.println("Rocket will begin deceleration burn at " + convertDoubleTo2Decimals(props[3]) + " m above " + planet2);
        System.out.println("Rocket will decelerate to zero in " + convertDoubleTo2Decimals(props[4]) + " s");
        System.out.println("Total trip time: " + convertSecondsToDays(Double.parseDouble(props[5])) + " or " + convertDoubleTo2Decimals(props[5]) + " s");
    }

    private String convertSecondsToDays(double seconds) {
        //return a string with days, hous, minutes and seconds
        int days = (int) (seconds / 86400);
        int hours = (int) ((seconds % 86400) / 3600);
        int minutes = (int) ((seconds % 3600) / 60);
        int sec = (int) (seconds % 60);
        return days + " days, " + hours + " hours, " + minutes + " minutes, " + sec + " seconds";
    }

    private String convertDoubleTo2Decimals(String number) {
        return String.format("%.2f", Double.parseDouble(number));
    }

    private String getPlanet1(Scanner scanner) {
        System.out.println("Enter the name of the starting planet (or 0 to exit): ");
        return scanner.nextLine();
    }

    private String getPlanet2(Scanner scanner) {
        System.out.println("Enter the name of the destination planet (or 0 to exit): ");
        return scanner.nextLine();
    }

    private void displayPlanetsName() {
        List<Planet> planets = service.getAllPlanets();
        System.out.println("Planets available:");
        for (Planet planet : planets) {
            System.out.println(planet.getName());
        }
    }

    private void displayPlanetsWithRocket() {
        List<Planet> planets = service.getAllPlanets();
        for (Planet planet : planets) {
            System.out.println(planet.getName() + ": escape velocity = " + planet.getEscapeV().evaluate() + " m/s, it takes " +
                    planet.getTimeToGo().evaluate() + " s and " + planet.getDistanceToGo().evaluate() + " m to achieve that speed");
        }
    }

    private String getPlanetaryData(Scanner scanner) throws IOException {
        System.out.println("From which file do you want to read Planetary Data? Enter 0 to exit.");
        return scanner.nextLine();
    }

    private String getRocketData(Scanner scanner) throws IOException {
        System.out.println("From which file do you want to read Rocket Data? Enter 0 to exit.");
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        return scanner.nextLine();
    }

    private String getSolarSystemData(Scanner scanner) throws IOException {
        System.out.println("From which file do you want to read Solar System Data? Enter 0 to exit.");
        return scanner.nextLine();
    }

    private void displayPlanets() {
        List<Planet> planets = service.getAllPlanets();
        for (Planet planet : planets) {
            System.out.println(planet.getName() + " has an escape velocity of " + planet.getEscapeV().evaluate() + " m/s");
        }
    }

    private void stage5(Scanner scanner, boolean advanced){
        boolean path1Valid = false;
        boolean path2Valid = false;
        boolean path3Valid = false;
        boolean initialized = false;
        String path1 = "";
        String path2 = "";
        String path3 = "";
        while (true) {
            try {
                if (!path1Valid) {
                    path1 = getPlanetaryData(scanner);
                    if (path1.equals("0"))
                        break;
                    service.validateFile(path1);
                    path1Valid = true;
                }
                if (!path2Valid) {
                    path2 = getRocketData(scanner);
                    if (path2.equals("0"))
                        break;
                    service.validateFile(path2);
                    path2Valid = true;
                }
                if (!path3Valid) {
                    path3 = getSolarSystemData(scanner);
                    if (path3.equals("0"))
                        break;
                    service.validateFile(path3);
                    path3Valid = true;
                }
                service.initialize(path1, path2, path3);
                initialized = true;
            } catch (Exception e) {
                System.err.println(e.getMessage());
                if (e.getMessage().contains("Invalid rocket file!"))
                    path2Valid = false;
                if (e.getMessage().contains("Invalid planetary file!"))
                    path1Valid = false;
                if (e.getMessage().contains("Invalid solar file!"))
                    path3Valid = false;
            }

            if (initialized) {
                displayPlanetsName();
                String planet1 = getPlanet1(scanner);
                if (planet1.equals("0"))
                    break;

                try {
                    service.validatePlanetName(planet1);
                } catch (Exception e) {
                    System.err.println("Invalid starting planet name!");
                    continue;
                }

                String planet2 = getPlanet2(scanner);
                if (planet2.equals("0"))
                    break;

                try {
                    service.validatePlanetName(planet2);
                } catch (Exception e) {
                    System.err.println("Invalid destination planet name!");
                }

                String result;
                if (advanced) {
                    result = service.computeJourneyStage6(planet1, planet2);
                } else {
                    result = service.computeJourneyStage5(planet1, planet2);
                }
                displayStage5(result, planet1, planet2);
                String str = service.simulateSolarSystem(Integer.parseInt(result.split(",")[6]));
                String[] planets = str.split(",");
                System.out.println();
                for (String planet : planets) {
                    String[] props = planet.split(";");
                    System.out.println(props[0] + " will be at: " + convertDoubleTo2Decimals(props[1]) + " degrees");
                }
                System.out.println();
            }
        }
    }

    private void displayStage5(String str, String planet1, String planet2) {
        String[] props = str.split(",");
        System.out.println(planet1 + " to " + planet2 + " journey summary:");
        System.out.println("Rocket will reach its cruising velocity in " + convertDoubleTo2Decimals(props[0]) + " s");
        System.out.println("Rocket will be at " + convertDoubleTo2Decimals(props[1]) + " m above " + planet1 + " when it will be reaching that velocity");
        System.out.println("Rocket will travel at nominal speed for " + convertSecondsToDays(Double.parseDouble(props[2])) + " or " + convertDoubleTo2Decimals(props[2]) + " s");
        System.out.println("Rocket will begin deceleration burn at " + convertDoubleTo2Decimals(props[3]) + " m above " + planet2);
        System.out.println("Rocket will decelerate to zero in " + convertDoubleTo2Decimals(props[4]) + " s");
        System.out.println("Total trip time: " + convertSecondsToDays(Double.parseDouble(props[5])) + " or " + convertDoubleTo2Decimals(props[5]) + " s");
        System.out.println("Optimal transfer window in " + convertDoubleTo2Decimals(props[6]) + " days");
    }

    private void stage6(Scanner scanner){
        stage5(scanner, true);
    }

    private void stage7(){
        System.out.print("Go to frontend folder in terminal, run ionic serve and view the web app at http://locahost:8100\n");
    }

    public void display() throws IOException {
        while (true) {
            System.out.println("Please enter the number of the stage (1-7) to start or 0 to exit");
            String buff;
            Scanner scanner = new Scanner(System.in);
            buff = scanner.nextLine();

            if (buff == null || buff.equals("0")) {
                break;
            }
            int stage;
            try {
                stage = Integer.parseInt(buff);
            } catch (Exception e) {
                System.err.println("Please enter a valid number! (1-7)\n");
                continue;
            }

            if (stage < 0 || stage > 7) {
                System.err.println("Please enter a valid number! (1-7)\n");
                continue;
            }
            switch (stage) {
                case 1:
                    stage1(scanner);
                    break;
                case 2:
                    stage2(scanner);
                    break;
                case 3:
                    stage3(scanner);
                    break;
                case 4:
                    stage4(scanner);
                    break;
                case 5:
                    stage5(scanner,false);
                    break;
                case 6:
                    stage6(scanner);
                    break;
                case 7:
                    stage7();
            }
        }
        System.exit(0);
    }
}