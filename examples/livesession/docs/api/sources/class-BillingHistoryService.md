---
title: BillingHistoryService
---
## !!references Class BillingHistoryService

### !description

Service for managing billing history.
Provides functionality to store and retrieve the history of transactions.


### !canonical class-BillingHistoryService

### !context

#### !packageName @xyd-sources-examples/package-b

#### !fileName billing.ts

#### !fileFullPath src/billing.ts

#### !line 135

#### !col 13

#### !signatureText

```ts
export class BillingHistoryService {
}
```

#### !sourcecode

```ts
export class BillingHistoryService {
    /** Holds all transactions that have been added to the billing history. */
    private history: BillingTransaction[] = [];

    /**
     * Adds a transaction to the billing history.
     * This method is typically called after a transaction is completed to maintain a record.
     * @param transaction - The billing transaction to be added to the history.
     */
    addTransactionToHistory(transaction: BillingTransaction): void {
        this.history.push(transaction);
    }

    /**
     * Retrieves the complete billing history, providing access to all transactions that have been recorded.
     * This is useful for historical analysis and auditing purposes.
     * @returns An array of all billing transactions in the history.
     */
    getBillingHistory(): BillingTransaction[] {
        return this.history;
    }
}
```

#### !package @xyd-sources-examples/package-b

### !examples

### !!definitions

#### !title Constructor

### !!definitions

#### !title Methods

#### !!properties addTransactionToHistory

!name addTransactionToHistory

!type void

Adds a transaction to the billing history.
This method is typically called after a transaction is completed to maintain a record.

#### !!properties getBillingHistory

!name getBillingHistory

!type&#x20;

Retrieves the complete billing history, providing access to all transactions that have been recorded.
This is useful for historical analysis and auditing purposes.
