import { strict as assert } from 'assert';
import { calculateCalories, MET_VALUES } from '../src/lib/calorie-calculator';

console.log('🧪 Running Calorie Calculator Tests...');

// Helper to run a test case
const runTest = (name: string, fn: () => void) => {
    try {
        fn();
        console.log(`✅ ${name}`);
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(error);
        process.exit(1);
    }
};

// Test Suite
runTest('MET Values are defined for key exercises', () => {
    assert.ok(MET_VALUES['Bench Press']);
    assert.ok(MET_VALUES['Running']);
    assert.ok(MET_VALUES['Burpee']);
    assert.ok(MET_VALUES['default']);
});

runTest('Calculate Calories: Strength Exercise (Bench Press)', () => {
    // 3 sets of Bench Press, 70kg user (default), 45s active + 30s rest.
    // MET = 3.5
    // Duration per set = (45 + 30) / 60 = 1.25 min
    // Calories per set = 3.5 * 70 * 0.0175 * 1.25 = 5.359375
    // Total = 5.359 * 3 = 16.07... -> Round to 16

    const exercises = [{
        name: 'Bench Press',
        sets: 3,
        rest_seconds: 30,
        weight_kg: 60 // load doesn't affect calculation yet, uses userWeight (70 fallback)
    }];

    const calories = calculateCalories(exercises, 70);
    assert.equal(calories, 16, `Expected 16 kcal, got ${calories}`);
});

runTest('Calculate Calories: Cardio (Running) - High Burn', () => {
    // 1 set of Running, 10 min duration (simulated by setting rest appropriately)
    // Wait, the formula assumes fixed 45s active time per set! 
    // If "sets" meant "minutes", the logic would be different.
    // With current logic: "sets" is number of intervals. 
    // If I want 10 mins running, I need to match (sets * (45 + rest)) = 600s
    // Let's test standard "1 set of running" logic:
    // MET 9.8, User 80kg
    // 1 set, 0s rest -> 45s duration = 0.75 min
    // Calories = 9.8 * 80 * 0.0175 * 0.75 = 10.29 -> Round to 10

    const exercises = [{
        name: 'Running',
        sets: 1,
        rest_seconds: 0,
        weight_kg: 0
    }];

    const calories = calculateCalories(exercises, 80);
    assert.equal(calories, 10, `Expected 10 kcal, got ${calories}`);
});

runTest('Calculate Calories: Fallback Weight (70kg)', () => {
    // User weight not provided, defaults to 70kg in function parameter (if undefined passed)
    // But we pass explicit userWeight in the Page. Here we test the function default.

    const exercises = [{
        name: 'Push-up', // MET 4.0
        sets: 1,
        rest_seconds: 15, // Total 1 min
        weight_kg: 0
    }];
    // 4.0 * 70 * 0.0175 * 1 = 4.9 -> Round to 5

    const calories = calculateCalories(exercises);
    assert.equal(calories, 5, `Expected 5 kcal, got ${calories}`);
});

console.log('✨ All tests passed!');
