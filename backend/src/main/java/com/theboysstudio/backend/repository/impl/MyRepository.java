package com.theboysstudio.backend.repository.impl;

import com.theboysstudio.backend.domain.Planet;
import com.theboysstudio.backend.repository.IFileReader;
import com.theboysstudio.backend.repository.IRepository;
import com.theboysstudio.backend.repository.parser.PlanetMaker;
import com.theboysstudio.backend.repository.parser.PlanetParser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.io.BufferedReader;
import java.io.FileReader;
import java.util.ArrayList;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class MyRepository implements IRepository<Planet>{
    private List<Planet> planets;
    private final IFileReader myFileReader;
    private final PlanetParser parser;
    private PlanetMaker maker;

    public MyRepository() {
        this.planets = new ArrayList<>();
        this.myFileReader = new MyFileReader();
        this.parser = new PlanetParser();
        this.maker=null;
    }

    @Override
    public void readData(String filePath) throws Exception {

        validateFile(filePath);

        planets = new ArrayList<>();

        List<String> lines = myFileReader.readLines(filePath);
        List<String> parsedLines = new ArrayList<>();
        for(String line: lines){
            parsedLines.add(parser.parseLine(line));
        }
        maker = new PlanetMaker(parser.getMassEarth());
        for(String line: parsedLines){
            planets.add(maker.make(line));
        }
    }

    @Override
    public String getRocketProps(String path) throws Exception {
        try(BufferedReader reader = new BufferedReader(new FileReader(path))){
            String line;
            String output;
            line = reader.readLine();
            String[] lines1 = line.split(" ");
            line = reader.readLine();
            String[] lines2 = line.split(" ");
            output = lines1[4]+","+lines2[3];
            return output;
        }catch (Exception e){
            throw new Exception("Invalid rocket file!");
        }
    }

    @Override
    public List<String> getSolarSystemProps(String path) throws Exception {
        List<String> out = new ArrayList<>();
        try(BufferedReader reader = new BufferedReader(new FileReader(path))){
            String line;
            while((line = reader.readLine()) != null){
                String output;
                String[] props = line.split(" ");
                String name = props[0].split(":")[0];
                output = name+","+props[3]+","+props[8];
                out.add(output);
            }
            return out;
        }catch (Exception e){
            throw new Exception("Invalid solar system file!");
        }
    }



    @Override
    public void validateFile(String path) throws Exception {
        try{
            BufferedReader bf = new BufferedReader(new FileReader(path));
            bf.close();
        }catch (Exception e){
            throw new Exception("Invalid file path!");
        }

    }

    @Override
    public List<Planet> getAll() {
        return this.planets;
    }

    @Override
    public Planet getOneByName(String name) {
        for(Planet planet: planets){
            if(planet.getName().equals(name)){
                return planet;
            }
        }
        return null;
    }

}
