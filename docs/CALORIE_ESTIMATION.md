# Calorie Estimation System

## Overview
The application estimates calories burned during a workout using the **Metabolic Equivalent of Task (MET)** formula. This provides a scientifically grounded estimate based on the specific exercise, the user's body weight, and duration.

## Formula
```
Calories Burned = MET * Weight(kg) * 0.0175 * Duration(minutes)
```

Where:
- **MET**: A value representing the energy cost of physical activity (see below).
- **Weight**: The user's body weight in kg (sourced from their profile).
- **0.0175**: A constant factor (approximate kcal per kg per MET-minute).
- **Duration**: Estimated active time. We assume **45 seconds** of active work per set, plus the user-defined `rest_seconds`.

## MET Values
MET values are defined in `frontend/src/lib/calorie-calculator.ts`. We support:
- **Strength**: Bench Press (3.5), Squat (5.0), Deadlift (6.0), etc.
- **Cardio Machines**: Running (9.8), Cycling (7.5), Elliptical (5.0), Rowing (7.0).
- **Bodyweight Cardio**: Burpee (8.0), Jump Rope (10.0), Mountain Climber (8.5).
- **Outdoor**: Outdoor Run (9.0), Outdoor Cycling (7.5).

*Default fallback MET is 4.0 if the exercise is not found.*

## User Weight Logic
1. The app fetches the user's weight from the `profiles` table.
2. If `exercises[i].weight_kg` is > 0 (lifting load), we currently use the **user's body weight** as the mass basis for the MET calculation, as MET charts are calibrated for body mass, not external load (though lifting heavier does increase intensity, the base calculation uses body weight).
3. If the user has no weight set in their profile, we fallback to **70kg**.

## Extending
To add new exercises, simply update the `MET_VALUES` object in `frontend/src/lib/calorie-calculator.ts` with the appropriate value from [Standard MET Tables](https://sites.google.com/site/compendiumofphysicalactivities/).

## Testing
We have a standalone test suite for this logic. Run:
```bash
cd frontend
npm test
```
(This runs `tsx tests/calorie-calculator.test.ts`)
