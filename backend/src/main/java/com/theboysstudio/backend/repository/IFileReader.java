package com.theboysstudio.backend.repository;

import java.io.IOException;
import java.util.List;

public interface IFileReader {
    List<String> readLines(String filePath) throws IOException;
}
