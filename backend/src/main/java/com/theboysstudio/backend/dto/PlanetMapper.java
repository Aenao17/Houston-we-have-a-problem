package com.theboysstudio.backend.dto;

import com.theboysstudio.backend.domain.MyNumber;
import com.theboysstudio.backend.domain.Planet;
import com.theboysstudio.backend.dto.PlanetDto;

public class PlanetMapper {

    private PlanetMapper() {
    }

    public static PlanetDto toDto(Planet planet) {
        if (planet == null) {
            return null;
        }

        return new PlanetDto(
                planet.getName(),
                toDouble(planet.getDiameter()),
                toDouble(planet.getMass()),
                toDouble(planet.getEscapeV()),
                toDouble(planet.getTimeToGo()),
                toDouble(planet.getDistanceToGo()),
                toDouble(planet.getPeriod()),
                toDouble(planet.getOrbitalRadius())
        );
    }

    private static double toDouble(MyNumber number) {
        return number != null ? number.evaluate() : 0.0;
    }
}