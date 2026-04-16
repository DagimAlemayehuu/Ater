---
title: CS1220_6_User_Defined_Data_Types_Possible_Questions
created_at: '2026-02-03T06:06:36Z'
last_modified: '2026-02-03T06:06:36Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: 9d66d9c7-d0fb-4f68-891b-0a460be7b082
type: Questions
course: Computer_Programming
year: Year_II
semester: Semester_I
credits: 4
original_source: AI_Generated_From_Prompt
aliases: []
unit: 6_User_Defined_Data_Types
---

# Part I: The Conceptual Mastery Ladder
*Progress through these levels for every atomic concept. Do not move to the next concept until you can answer Level 3.*

## [[Structures_Struct]]
### Level 1: Understanding (The Basics)
1.  **The Component Check:** What is the primary purpose of a `struct` in C++, and how does it differ from a basic variable type like `int` or `double`?

### Level 2: Competence (Application)
2.  **The Clean Build:** Write a C++ `struct` definition for a `Rectangle` that includes members for its `length` and `width` (both `double`). Then, declare a variable of this `Rectangle` type and initialize its members.

### Level 3: Mastery (The Crucible)
3.  **The Broken System:** You are given the following C++ `struct` and a usage scenario. Identify the potential logical flaw or security risk in how the `Password` `struct` is designed and used, and suggest a better approach.
```cpp
    #include <iostream>
    #include <string>

    struct Password {
        std::string value;
        bool is_hashed;
    };

    int main() {
        Password user_pw;
        user_pw.value = "mySecretPassword123";
        user_pw.is_hashed = false;

        // Later in code...
        if (!user_pw.is_hashed) {
            std::cout << "Warning: Password is not hashed!" << std::endl;
            // Potentially use user_pw.value directly for comparison
        }
        return 0;
    }
```
```text
    // Scenario 1: Initial password assignment
    // Output:
    // A string "mySecretPassword123" is assigned to user_pw.value.
    // The flag is_hashed is set to false.

    // Scenario 2: Later check
    // Output:
    // "Warning: Password is not hashed!" is printed to console.
    // The unhashed password "mySecretPassword123" is readily available and could be misused if accessed by other parts of the program or after a security breach.
```

## [[The_Typedef_Keyword]]
### Level 1: Understanding (The Basics)
4.  **The Neighbor Check:** In C++, what is the primary role of the `typedef` keyword, and which other keyword or mechanism is often confused with it for type aliasing?

### Level 2: Competence (Application)
5.  **The Sort:** Given the following C++ code snippet, explain which lines demonstrate correct usage of `typedef` for type aliasing and which do not.
```cpp
    #include <iostream>

    struct Point {
        int x, y;
    };

    #define INTEGER_TYPE int
    typedef int IntAlias;
    typedef struct Point CartesianPoint;
    using DoubleAlias = double;

    int main() {
        INTEGER_TYPE a = 10;
        IntAlias b = 20;
        CartesianPoint p = {5, 8};
        DoubleAlias d = 3.14;

        std::cout << a << ", " << b << ", " << p.x << ", " << p.y << ", " << d << std::endl;

        return 0;
    }
```
```text
    // Scenario 1: Compilation and execution
    // Output:
    // 10, 20, 5, 8, 3.14
    // All lines compile and execute without error.
    // The question focuses on *correct usage of typedef* specifically, not just compilation success.
```

### Level 3: Mastery (The Crucible)
6.  **The Impostor:** You encounter a situation where `typedef` is used to create an alias for a pointer type, like `typedef char* StringPtr;`. However, another developer argues that `using StringPtr = char*;` is strictly better. Explain why `using` is often preferred in modern C++ for aliasing, especially for complex types like function pointers, and how `typedef` can lead to subtle pitfalls when used with pointers.

## [[Enumerated_Types_Enum]]
### Level 1: Understanding (The Basics)
7.  **The Component Check:** What problem do `enum`s solve in C++, and why are they generally preferred over using a series of `#define` directives for symbolic constants?

### Level 2: Competence (Application)
8.  **The Clean Build:** Define an `enum` called `TrafficLightState` with the values `Red`, `Yellow`, and `Green`. Then, write a C++ function that takes a `TrafficLightState` as input and prints a corresponding message (e.g., "Stop", "Prepare to stop", "Go").

### Level 3: Mastery (The Crucible)
9.  **The Broken System:** Consider the following C++ code. Identify the potential issues related to type safety and scope, and then refactor the code using `enum class` to address these problems. Explain why `enum class` is a safer and more modern alternative.
```cpp
    #include <iostream>

    enum Color {
        Red, Green, Blue
    };

    enum State {
        Off, On, Red // 'Red' conflicts with Color::Red
    };

    void processColor(int c) {
        if (c == Red) { // Implicit conversion from enum to int
            std::cout << "Processing Red color." << std::endl;
        }
    }

    int main() {
        Color myColor = Red;
        State myState = On;

        if (myColor == Off) { // Compiles due to implicit conversion and scope pollution
            std::cout << "Color is Off - unexpected!" << std::endl;
        }

        processColor(myColor); // Implicit conversion to int

        return 0;
    }
```
```text
    // Scenario 1: Code compilation
    // Output:
    // This code will compile, but with a warning for redefinition of 'Red' in the 'State' enum.
    // The comparison `myColor == Off` will evaluate to true if the underlying integer values match, which is unexpected behavior across different enum types.
    // "Processing Red color." will be printed.

    // Scenario 2: Semantic issues
    // Output:
    // The primary issue is the lack of type safety and scope pollution.
    // 'Red' in 'Color' and 'Red' in 'State' exist in the global scope, causing a naming conflict.
    // Implicit conversion allows comparing an 'enum Color' with an 'enum State' or an 'int', which can lead to logical errors.
```

## [[Unions_in_C++]]
### Level 1: Understanding (The Basics)
10. **The Component Check:** Describe the primary characteristic of a `union` in C++ regarding memory allocation. How does this differ from a `struct`?

### Level 2: Competence (Application)
11. **The Clean Build:** Define a C++ `union` called `DataStore` that can hold either an `int`, a `float`, or a `char`. Write a small program that assigns a value to each member of the `union` in sequence, printing the `sizeof` the `union` and the value of each member after each assignment.
```cpp
    #include <iostream>

    union DataStore {
        int i;
        float f;
        char c;
    };

    int main() {
        DataStore ds;

        std::cout << "Size of DataStore: " << sizeof(ds) << " bytes" << std::endl;

        ds.i = 123;
        std::cout << "After assigning ds.i = 123:" << std::endl;
        std::cout << "ds.i: " << ds.i << std::endl;
        std::cout << "ds.f (might be garbage): " << ds.f << std::endl; // Accessing inactive member
        std::cout << "ds.c (might be garbage): " << ds.c << std::endl; // Accessing inactive member

        ds.f = 45.67f;
        std::cout << "\nAfter assigning ds.f = 45.67f:" << std::endl;
        std::cout << "ds.i (might be garbage): " << ds.i << std::endl; // Accessing inactive member
        std::cout << "ds.f: " << ds.f << std::endl;
        std::cout << "ds.c (might be garbage): " << ds.c << std::endl; // Accessing inactive member

        ds.c = 'Z';
        std::cout << "\nAfter assigning ds.c = 'Z':" << std::endl;
        std::cout << "ds.i (might be garbage): " << ds.i << std::endl; // Accessing inactive member
        std::cout << "ds.f (might be garbage): " << ds.f << std::endl; // Accessing inactive member
        std::cout << "ds.c: " << ds.c << std::endl;

        return 0;
    }
```
```text
    // Scenario 1: Program execution (output might vary slightly depending on system architecture and padding)
    // Output (example):
    // Size of DataStore: 4 bytes (assuming int and float are 4 bytes, char 1 byte)
    // After assigning ds.i = 123:
    // ds.i: 123
    // ds.f (might be garbage): 0.000000 (or other value based on bit interpretation)
    // ds.c (might be garbage):  (or other character based on bit interpretation)

    // After assigning ds.f = 45.67f:
    // ds.i (might be garbage): 1122602854 (or other value)
    // ds.f: 45.670002
    // ds.c (might be garbage): v (or other character)

    // After assigning ds.c = 'Z':
    // ds.i (might be garbage): 90 (ASCII for 'Z')
    // ds.f (might be garbage): 1.26E-43 (or other value)
    // ds.c: Z
```

### Level 3: Mastery (The Crucible)
12. **The Broken System:** You are working on a system that receives packets, where each packet can contain data of different types (integer, string, or a boolean flag). To optimize memory, you decide to use a `union` to store the packet's payload. Identify the critical flaw in the following `Packet` design that uses a `union` for its `payload`, and explain how you would redesign it using a `struct` and an `enum` to prevent undefined behavior and ensure type safety.
```cpp
    #include <iostream>
    #include <string>

    union PayloadData {
        int int_val;
        char char_array; // For string
        bool bool_flag;
    };

    struct Packet {
        int id;
        PayloadData payload;
        // No explicit way to know what type is currently active in payload
    };

    void processPacket(Packet p) {
        // How do we know what type to read from p.payload?
        // Let's assume for simplicity we try to read an int
        std::cout << "Packet ID: " << p.id << ", Payload Int: " << p.payload.int_val << std::endl;
        // This is dangerous if the active member isn't int_val
    }

    int main() {
        Packet int_packet = {1, {100}}; // Initialize int_val
        Packet string_packet = {2, {"Hello C++"}} ; // Initialize char_array
        Packet bool_packet = {3, {true}}; // Initialize bool_flag

        processPacket(int_packet);
        processPacket(string_packet); // Will print garbage or crash
        processPacket(bool_packet);   // Will print garbage or crash

        return 0;
    }
```
```text
    // Scenario 1: Program execution
    // Output (example, will vary due to undefined behavior):
    // Packet ID: 1, Payload Int: 100
    // Packet ID: 2, Payload Int: 1196443208 (garbage, interpreting "Hello C++" as int)
    // Packet ID: 3, Payload Int: 1 (interpreting true as int, might be okay here, but generally UB)

    // Scenario 2: Critical flaw explanation
    // The critical flaw is that there is no mechanism to track *which* member of the `PayloadData` union is currently active.
    // When `processPacket` tries to read `p.payload.int_val`, it's attempting to interpret the memory allocated for the union as an integer, regardless of whether an integer was last written to it.
    // This leads to undefined behavior if `int_val` is not the active member, as seen with `string_packet` and `bool_packet`.
```

# Part II: Unit Synthesis (The Final Boss)
*These questions require combining multiple concepts from the unit to solve a complex problem.*

### Integrated Scenario: Sensor Data Logger
**The Setup:** You are tasked with developing a C++ program for a compact embedded system that logs data from various sensors. The system needs to efficiently store different types of sensor readings—temperature (integer), humidity (float), and a status code (an enumerated type representing `OK`, `WARNING`, `CRITICAL`). Due to strict memory constraints, you must optimize storage. The system should also provide a clear, user-friendly way to display the logged data.
**The Constraints:**
*   You must use **user-defined data types (`struct`, `enum`, `union`)** to represent the sensor readings and their storage.
*   Memory usage for each sensor reading record should be minimized.
*   The system must correctly identify and display the *type* of sensor data being stored at any given moment.
**The Challenge:**
(a) Design the C++ data structures (`struct`, `enum`, `union` as appropriate) to efficiently store a single sensor reading while adhering to the memory constraint.
(b) Write a C++ code snippet that demonstrates:
    1.  Initializing a sensor reading record with a `Temperature` value.
    2.  Initializing another record with a `Humidity` value.
    3.  Initializing a third record with a `StatusCode`.
    4.  A function that takes a sensor reading record and correctly prints its type and value, avoiding undefined behavior.
(c) Explain the trade-offs you made in choosing between `struct`s and `union`s for the sensor data storage, particularly in the context of memory efficiency versus type safety.
```cpp
// Example structure for part (a) and (b)
#include <iostream>
#include <string>

// (a) Design the C++ data structures
// Enum for sensor data types
enum class SensorDataType {
    TEMPERATURE,
    HUMIDITY,
    STATUS_CODE
};

// Enum for status codes
enum class StatusCode {
    OK,
    WARNING,
    CRITICAL
};

// Union for efficient memory storage
union SensorValue {
    int temperature_val;
    float humidity_val;
    StatusCode status_code_val; // Stores the enum class directly
};

// Struct to combine the type and the value
struct SensorReading {
    int id;
    SensorDataType type;
    SensorValue value;
};

// (b) and (c) - function to print and discussion of tradeoffs
// Function to print sensor data correctly
void printSensorReading(const SensorReading& reading) {
    std::cout << "Sensor ID: " << reading.id << ", ";
    switch (reading.type) {
        case SensorDataType::TEMPERATURE:
            std::cout << "Type: Temperature, Value: " << reading.value.temperature_val << " C" << std::endl;
            break;
        case SensorDataType::HUMIDITY:
            std::cout << "Type: Humidity, Value: " << reading.value.humidity_val << " %" << std::endl;
            break;
        case SensorDataType::STATUS_CODE:
            std::cout << "Type: Status Code, Value: ";
            switch (reading.value.status_code_val) {
                case StatusCode::OK: std::cout << "OK"; break;
                case StatusCode::WARNING: std::cout << "WARNING"; break;
                case StatusCode::CRITICAL: std::cout << "CRITICAL"; break;
            }
            std::cout << std::endl;
            break;
    }
}

int main() {
    // 1. Initializing with a Temperature value
    SensorReading temp_reading;
    temp_reading.id = 101;
    temp_reading.type = SensorDataType::TEMPERATURE;
    temp_reading.value.temperature_val = 25;
    printSensorReading(temp_reading);

    // 2. Initializing with a Humidity value
    SensorReading hum_reading;
    hum_reading.id = 102;
    hum_reading.type = SensorDataType::HUMIDITY;
    hum_reading.value.humidity_val = 60.5f;
    printSensorReading(hum_reading);

    // 3. Initializing with a StatusCode
    SensorReading status_reading;
    status_reading.id = 103;
    status_reading.type = SensorDataType::STATUS_CODE;
    status_reading.value.status_code_val = StatusCode::CRITICAL;
    printSensorReading(status_reading);

    return 0;
}
```
```text
// Scenario 1: Program execution (part b)
// Output:
// Sensor ID: 101, Type: Temperature, Value: 25 C
// Sensor ID: 102, Type: Humidity, Value: 60.5 %
// Sensor ID: 103, Type: Status Code, Value: CRITICAL

// Scenario 2: Explanation of trade-offs (part c)
// Output:
// The primary trade-off is between memory efficiency (union) and compile-time type safety (struct, typically with distinct members).
// Using a `union` (`SensorValue`) allows all different sensor readings (int, float, enum) to occupy the *same* memory location, thus minimizing the size of each `SensorReading` record to the size of its largest member. This is crucial for systems with strict memory constraints.
// However, `union`s inherently lack type safety; the programmer is responsible for knowing which member is active to avoid undefined behavior. This is addressed by pairing the `union` with an `enum class` (`SensorDataType`) within a `struct` (`SensorReading`), which acts as a "tag" or "discriminator" to explicitly indicate the currently active type.
// This design effectively leverages the memory efficiency of `union`s while regaining type safety through explicit runtime checks (like the `switch` statement in `printSensorReading`), allowing the system to correctly interpret the shared memory.
```