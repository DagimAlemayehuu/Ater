---
title: Modular_Programming
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[None]]
source: [[Chapter 5.Pdf]]
source_pages:
- 1
- 2
- 3
mode: ENGINEER

---

# Definition & Mechanics
**Modular programming** is a software design technique that emphasizes separating a program's design into individual, independent components called **modules**. Each module can be written, tested, and debugged separately.

* **Key characteristics:**
  + **Modularity**: breaking down a program into smaller, manageable parts
  + **Independence**: each module can be developed and tested independently
  + **Reusability**: modules can be reused in other programs or parts of the same program
* **Benefits:**
  + Easier maintenance and modification
  + Reduced complexity
  + Improved reusability

# Worked Example
Domain: Banking

Suppose we want to develop a banking system that allows customers to deposit and withdraw money. We can design two modules: `DepositModule` and `WithdrawalModule`.

```mermaid
graph LR
    Customer -->|requests deposit|> DepositModule
    DepositModule -->|updates account|> AccountModule
    Customer -->|requests withdrawal|> WithdrawalModule
    WithdrawalModule -->|checks balance & updates account|> AccountModule
```

**DepositModule**
python
def deposit(account, amount):
  account.balance += amount
  print(f"Deposited ${amount} into account {account.id}. New balance: ${account.balance}")
```text

**WithdrawalModule**
```python
def withdraw(account, amount):
  if account.balance >= amount:
    account.balance -= amount
    print(f"Withdrew ${amount} from account {account.id}. New balance: ${account.balance}")
  else:
    print("Insufficient funds.")
```

# Edge Case
> **Q:** What happens if two modules, `DepositModule` and `WithdrawalModule`, both try to update the same account balance simultaneously?
> **A:** This is a classic problem known as a **race condition**. To avoid it, we can use **synchronization mechanisms**, such as locks or semaphores, to ensure that only one module can access and update the account balance at a time.

# Connections
- **Depends on:** [[None]] 
- **Enables:** [[Modular_Programming_Benefits]]