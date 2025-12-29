export const MET_VALUES: Record<string, number> = {
    // Strength (moderate effort)
    'Bench Press': 3.5,
    'Push-up': 4.0,
    'Squat': 5.0,
    'Deadlift': 6.0,
    'Pull-up': 4.0,
    'Rowing': 7.0,
    'Lunge': 5.0,
    'Plank': 3.0,
    // Cardio – machines
    'Treadmill': 9.8,
    'Running': 9.8,
    'Walking': 3.5,
    'Stationary Bike': 7.5,
    'Cycling': 7.5,
    'Elliptical': 5.0,
    'Stair Climber': 5.5,
    // Cardio – bodyweight
    'Jump Rope': 10.0,
    'Burpee': 8.0,
    'Mountain Climber': 8.5,
    'High Knees': 8.0,
    // Outdoor cardio
    'Outdoor Run': 9.0,
    'Outdoor Cycling': 7.5,
    // Fallback for any other exercise
    'default': 4.0,
};

export interface ExerciseInput {
    name: string;
    sets: number;
    rest_seconds: number;
    weight_kg: number;
}

/**
 * Calculates estimated calories burned during a workout.
 * Formula: Calories = MET * Weight(kg) * 0.0175 * Time(min)
 * 
 * Assumptions:
 * - Each set has 45 seconds of active work time.
 * - Total time per set = 45s + rest_seconds.
 * - If exercise has load (weight_kg > 0), we use that (approximation for lifting). 
 *   Otherwise, we use user's body weight.
 */
export const calculateCalories = (
    exercises: ExerciseInput[],
    userWeightKg: number = 70
): number => {
    let totalCalories = 0;

    exercises.forEach((ex) => {
        const met = MET_VALUES[ex.name] ?? MET_VALUES['default'];

        // Use load if > 0 (approximation) or user body weight
        // Note: Ideally for lifting we'd use body weight + load, but MET charts are for body weight.
        // We use userWeightKg as the base mass for consistency with MET definitions.
        const massToUse = userWeightKg;

        const setDurationSec = 45 + (ex.rest_seconds ?? 0);
        const minutesPerSet = setDurationSec / 60;

        const caloriesPerSet = met * massToUse * 0.0175 * minutesPerSet;

        totalCalories += caloriesPerSet * ex.sets;
    });

    return Math.round(totalCalories);
};
