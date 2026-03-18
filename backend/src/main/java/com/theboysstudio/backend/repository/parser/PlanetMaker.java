package com.theboysstudio.backend.repository.parser;

import com.theboysstudio.backend.domain.MyNumber;
import com.theboysstudio.backend.domain.Planet;

public class PlanetMaker {
    private final MyNumber massEarth;

    public PlanetMaker(MyNumber massEarth) {
        this.massEarth = massEarth;
    }

    public Planet make(String line){
        String[] params = line.split(",");
        return getPlanet(params);
    }

    private Planet getPlanet(String[] params) {
        MyNumber G = new MyNumber(6.67, -11);
        String name = params[0];

        int diameter = Integer.parseInt(params[1]);
        MyNumber d = new MyNumber((double) (diameter * 1000), 0);

        double mass = Double.parseDouble(params[2]);
        int pow = Integer.parseInt(params[3]);
        MyNumber masa;
        if (pow == 0) {
            double base = mass * massEarth.getBase();
            int po = massEarth.getZeroes();
            masa = new MyNumber(base, po);
        } else {
            masa = massEarth;
        }

        MyNumber radius = d.divide(2);
        MyNumber velocity = (((G.multiply(2)).multiply(masa)).divide(radius)).sqrt();
        return new Planet(name, d, masa, velocity);
    }
}
