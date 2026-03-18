package com.theboysstudio.backend.repository;

import java.util.List;

public interface IRepository<T> {
    List<T> getAll();
    T getOneByName(String name);
    void readData(String path) throws Exception;
    String getRocketProps(String path) throws Exception;
    List<String> getSolarSystemProps(String path) throws Exception;
    void validateFile(String path) throws Exception;
}
