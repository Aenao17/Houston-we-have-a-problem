package com.theboysstudio.backend.service;

import com.theboysstudio.backend.domain.Planet;
import org.springframework.stereotype.Service;

import java.util.List;

public interface IService {
    void readPlanetsFromFile(String path) throws Exception;
    List<Planet> getAllPlanets();
    Planet getPlanetByName(String name);
    void initialize(String pathPlanets, String pathRocket) throws Exception;
    void initialize(String pathPlanets, String pathRocket, String pathSolar) throws Exception;
    void validateFile(String path) throws Exception;
    void validatePlanetName(String name) throws Exception;
    String computeJourneyStage3(String start, String end);
    String simulateSolarSystem(int days);
    String computeJourneyStage5(String start, String end);
    String computeJourneyStage6(String start, String end);
}
