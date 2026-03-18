package com.theboysstudio.backend.domain;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class Planet {
    private final String name;
    private final MyNumber diameter;
    private final MyNumber mass;
    private MyNumber escapeV;
    private MyNumber timeToGo;
    private MyNumber distanceToGo;
    private MyNumber period;
    private MyNumber orbitalRadius;

    public Planet(String name, MyNumber diameter, MyNumber mass, MyNumber escapeV) {
        this.name = name;
        this.diameter = diameter;
        this.mass = mass;
        this.escapeV = escapeV;
    }

    @Override
    public String toString() {
        return "Planet{" +
                "name='" + name + '\'' +
                ", diameter=" + diameter +
                ", mass=" + mass +
                ", escapeV=" + escapeV + " m/s" +
                '}';
    }
}
