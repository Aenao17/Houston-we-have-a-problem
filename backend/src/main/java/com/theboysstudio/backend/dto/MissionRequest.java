package com.theboysstudio.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class MissionRequest {
    private String startPlanet;
    private String destinationPlanet;
}
