package com.theboysstudio.backend.controller;

import com.theboysstudio.backend.dto.MissionRequest;
import com.theboysstudio.backend.dto.PathsRequest;
import com.theboysstudio.backend.dto.PlanetDto;
import com.theboysstudio.backend.dto.PlanetMapper;
import com.theboysstudio.backend.service.IService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MyController {
    private final IService service;

    @PostMapping("/planets/load")
    public ResponseEntity<List<PlanetDto>> paths(@RequestBody PathsRequest request) {
        try {
            service.validateFile(request.getPath1());
        } catch (Exception e) {
            return null;
        }

        try {
            service.validateFile(request.getPath2());
        } catch (Exception e) {
            return null;
        }

        try {
            service.validateFile(request.getPath3());
        } catch (Exception e) {
            return null;
        }
        try {
            service.initialize(request.getPath1(), request.getPath2(), request.getPath3());
        } catch (Exception e) {
            return null;
        }

        List<PlanetDto> planets = service.getAllPlanets().stream().map(PlanetMapper::toDto).toList();
        return ResponseEntity.ok().body(planets);
    }

    @PostMapping("/mission/compute")
    ResponseEntity<String> computeMission(@RequestBody MissionRequest missionRequest) {
        String raw = service.computeJourneyStage6(missionRequest.getStartPlanet(), missionRequest.getDestinationPlanet());
        String[] props = raw.split(",");
        String summary = missionRequest.getStartPlanet() + " to " + missionRequest.getDestinationPlanet() + " journey summary:\n"+
        "Rocket will reach its cruising velocity in " + convertDoubleTo2Decimals(props[0]) + " s\n" +
        "Rocket will be at " + convertDoubleTo2Decimals(props[1]) + " m above " + missionRequest.getStartPlanet() + " when it will be reaching that velocity\n" +
        "Rocket will travel at nominal speed for " + convertSecondsToDays(Double.parseDouble(props[2])) + " or " + convertDoubleTo2Decimals(props[2]) + " s\n" +
        "Rocket will begin deceleration burn at " + convertDoubleTo2Decimals(props[3]) + " m above " + missionRequest.getDestinationPlanet() + "\n" +
        "Rocket will decelerate to zero in " + convertDoubleTo2Decimals(props[4]) + " s\n" +
        "Total trip time: " + convertSecondsToDays(Double.parseDouble(props[5])) + " or " + convertDoubleTo2Decimals(props[5]) + " s\n" +
        "Optimal transfer window in " + convertDoubleTo2Decimals(props[6]) + " days\n";
        String str = service.simulateSolarSystem(Integer.parseInt(raw.split(",")[6]));
        String[] planets = str.split(",");
        summary+="\n";
        for (String planet : planets) {
            String[] prop = planet.split(";");
            summary= summary + prop[0] + " will be at: " + convertDoubleTo2Decimals(prop[1]) + " degrees\n";
        }
        return  ResponseEntity.ok(summary);
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

}
