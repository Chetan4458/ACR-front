public class TestJavaErrors {

    public static void main(String[] args) {
        // Syntax Error: Missing semicolon
        System.out.println("Hello, World!")

        // Compilation Error: Unused variable
        int unusedVariable;

        // Logic Error: This will never execute
        if (false) {
            System.out.println("This will not print.");
        }

        // Runtime Error: Division by zero
        int result = divide(10, 0);
        System.out.println("Result: " + result);
    }

    public static int divide(int a, int b) {
        // Logic Error: Division by zero
        return a / b; 
    }
}
