# 🚀 Houston, We Have a Problem

## Overview

Houston, We Have a Problem is a space-themed application that simulates interplanetary travel between planets.

The app computes:
* optimal transfer windows
* travel time and distances
* safe trajectories (avoiding collisions with other planets)

It uses a Spring Boot backend for all calculations and an Ionic React frontend for visualization.

## ▶️ How to Run

1. Clone this repository

2. Backend (Spring Boot)
```Bash
cd backend
./mvnw spring-boot:run 
```

3. Frontend (Ionic React)
```Bash
cd frontend
npm install
ionic serve
```

## ⚠️ Important

The application currently works only locally. You must provide absolute file paths for all input files:

* in the backend (console input)

* in the frontend (settings section)

Default frontend runs on: http://localhost:8100