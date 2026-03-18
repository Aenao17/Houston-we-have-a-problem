package com.theboysstudio.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PlanetDto {
    private String name;

    private double diameter;
    private double mass;
    private double escapeVelocity;
    private double timeToGo;
    private double distanceToGo;
    private double period;
    private double orbitalRadius;
}
