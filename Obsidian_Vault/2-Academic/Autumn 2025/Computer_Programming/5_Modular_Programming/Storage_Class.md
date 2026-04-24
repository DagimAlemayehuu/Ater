---
title: Storage Class
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages: []
mode: CS-CODE
read: false
generated: true
---

# 1. Technical Definition
A `StorageClass` is a Kubernetes resource that defines a set of dynamic `PersistentVolume` (PV) provisioning parameters, allowing administrators to manage storage resources and policies. The `StorageClass` object provides a way to provision `PersistentVolumes` on-demand, based on a set of predefined characteristics, such as `provisioner`, `parameters`, and `reclaimPolicy`.

# 2. Syntax Mechanics
* The `StorageClass` object is defined using the `storage.k8s.io/v1` API group, with a `kind` of `StorageClass`.
* A `StorageClass` definition consists of a `metadata` section, a `provisioner` field specifying the `volume_provisioner` to use, and a `parameters` field containing `provisioner`-specific settings.
* The `reclaimPolicy` field determines the `reclaimPolicy` for dynamically provisioned `PersistentVolumes`, with possible values being `Delete`, `Retain`, or `Recycle`.
* `StorageClass` objects can be annotated with `volume_binding_mode`, which controls when the `PersistentVolume` binding occurs.

# 3. Memory Lifecycle
* A `StorageClass` object is created and managed by the cluster administrator, and its lifecycle is tied to the Kubernetes cluster.
* The `StorageClass` object does not have a direct impact on the memory usage of the cluster, but it influences the provisioning and deprovisioning of `PersistentVolumes`, which can affect storage resource utilization.
* The `StorageClass` object is subject to the same resource quotas and access controls as other Kubernetes resources.
* When a `StorageClass` object is deleted, any dynamically provisioned `PersistentVolumes` created using that `StorageClass` are not automatically deleted, and must be manually cleaned up.

---

## 4. Worked Example

```cpp
#include <iostream>
#include <string>
#include <unordered_map>

// Define a StorageClass structure
struct StorageClass {
    std::string apiVersion;
    std::string kind;
    std::string metadata;
    std::string provisioner;
    std::unordered_map<std::string, std::string> parameters;
    std::string reclaimPolicy;
    std::string volumeBindingMode;
};

// Function to create a StorageClass object
StorageClass createStorageClass(const std::string& provisioner, const std::unordered_map<std::string, std::string>& parameters, const std::string& reclaimPolicy) {
    StorageClass storageClass;
    storageClass.apiVersion = "storage.k8s.io/v1";
    storageClass.kind = "StorageClass";
    storageClass.provisioner = provisioner;
    storageClass.parameters = parameters;
    storageClass.reclaimPolicy = reclaimPolicy;
    return storageClass;
}

// Function to print a StorageClass object
void printStorageClass(const StorageClass& storageClass) {
    std::cout << "apiVersion: " << storageClass.apiVersion << std::endl;
    std::cout << "kind: " << storageClass.kind << std::endl;
    std::cout << "provisioner: " << storageClass.provisioner << std::endl;
    std::cout << "parameters:" << std::endl;
    for (const auto& parameter : storageClass.parameters) {
        std::cout << "  " << parameter.first << ": " << parameter.second << std::endl;
    }
    std::cout << "reclaimPolicy: " << storageClass.reclaimPolicy << std::endl;
}

int main() {
    // Create a StorageClass object
    std::unordered_map<std::string, std::string> parameters = {{"type", "gp2"}};
    StorageClass storageClass = createStorageClass("kubernetes.io/aws-ebs", parameters, "Delete");

    // Print the StorageClass object
    printStorageClass(storageClass);

    return 0;
}
```

---

## 5. Knowledge Check

```interactive-quiz
[
  {
    "id": "q1",
    "type": "writing",
    "difficulty": "L1",
    "question": "What is the purpose of a StorageClass object in Kubernetes?",
    "answer": "A StorageClass object defines a set of dynamic PersistentVolume (PV) provisioning parameters, allowing administrators to manage storage resources and policies.",
    "explanation": "The StorageClass object provides a way to provision PersistentVolumes on-demand, based on a set of predefined characteristics, such as provisioner, parameters, and reclaimPolicy."
  },
  {
    "id": "q2",
    "type": "code",
    "difficulty": "L2",
    "question": "Write a C++ code snippet to create a StorageClass object with a provisioner, parameters, and reclaimPolicy.",
    "codeSnippet": "StorageClass createStorageClass(const std::string& provisioner, const std::unordered_map<std::string, std::string>& parameters, const std::string& reclaimPolicy) { ... }",
    "answer": "StorageClass createStorageClass(const std::string& provisioner, const std::unordered_map<std::string, std::string>& parameters, const std::string& reclaimPolicy) { ... }",
    "explanation": "The provided C++ code snippet demonstrates how to create a StorageClass object with a provisioner, parameters, and reclaimPolicy."
  },
  {
    "id": "q3",
    "type": "mcq",
    "difficulty": "L3",
    "question": "What happens to dynamically provisioned PersistentVolumes when a StorageClass object is deleted?",
    "options": {
      "A": "They are automatically deleted.",
      "B": "They are not automatically deleted and must be manually cleaned up.",
      "C": "They are retained and remain available for use."
    },
    "answer": "B",
    "explanation": "When a StorageClass object is deleted, any dynamically provisioned PersistentVolumes created using that StorageClass are not automatically deleted and must be manually cleaned up."
  }
]
```