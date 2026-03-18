package com.theboysstudio.backend.repository.parser;


import com.theboysstudio.backend.domain.MyNumber;

public class PlanetParser {
    private MyNumber massEarth;

    public PlanetParser() {}

    public String parseLine(String line){
        String[] params = line.split(",");
        String name;
        int diameter;
        double mass;
        int pow = 0;

        //extract tge name and diameter
        String[] params0 = params[0].split(":");
        name = params0[0];
        String[] params01 = params0[1].split(" ");
        diameter = Integer.parseInt(params01[3]);

        //extract mass
        String[] params1 = params[1].split("\\*");
        if (params1.length > 1) {
            //get mass
            String[] params10 = params1[0].split(" ");
            mass = Double.parseDouble(params10[3]);

            //get pow
            String[] params11 = params1[1].split(" ");
            String[] params111 = params11[1].split("\\^");
            pow = Integer.parseInt(params111[1]);
            massEarth = new MyNumber(mass, pow);
        } else {
            //get mass
            String[] params10 = params1[0].split(" ");
            mass = Double.parseDouble(params10[3]);
        }

        String newLine;
        newLine = name + "," + diameter + "," + mass + "," + pow;
        return newLine;
    }

    public MyNumber getMassEarth(){
        return this.massEarth;
    }
}
