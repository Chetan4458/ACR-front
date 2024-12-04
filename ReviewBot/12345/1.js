function countDownFrom(number) {
    while (number >= 0) {
        console.log("Counting down: " + number);
        number++;  // Logical error: incrementing instead of decrementing
    }
}

// Test the function with an initial value
countDownFrom(10);
