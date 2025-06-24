---
title: BillingReceiptService
---
## !!references Class BillingReceiptService

### !description

Service for generating billing receipts.
Provides functionality to generate and retrieve receipts for transactions.


### !canonical class-BillingReceiptService

### !context

#### !packageName @xyd-sources-examples/package-b

#### !fileName billing.ts

#### !fileFullPath src/billing.ts

#### !line 163

#### !col 13

#### !signatureText

```ts
export class BillingReceiptService {
}
```

#### !sourcecode

```ts
export class BillingReceiptService {
    /**
     * Stores all receipts generated for transactions.
     */
    public receipts: BillingReceipt[] = [];

    /**
     * Generates a billing receipt for a transaction and stores it.
     * Each receipt includes a unique ID and timestamp, essential for record-keeping and customer service.
     * @param transaction - The billing transaction for which to generate a receipt.
     * @returns The generated billing receipt.
     */
    generateReceipt(transaction: BillingTransaction): BillingReceipt {
        const receipt: BillingReceipt = {
            receiptId: `receipt_${Date.now()}`,
            transaction,
            timestamp: Date.now(),
        };
        this.receipts.push(receipt);
        return receipt;
    }

    /**
     * Retrieves all the billing receipts that have been generated.
     * Useful for providing customers with copies of their receipts or for internal financial tracking.
     * @returns An array of all billing receipts.
     */
    getAllReceipts(): BillingReceipt[] {
        return this.receipts;
    }
}
```

#### !package @xyd-sources-examples/package-b

### !examples

### !!definitions

#### !title Constructor

### !!definitions

#### !title Methods

#### !!properties generateReceipt

!name generateReceipt

!type \<BillingReceipt>

Generates a billing receipt for a transaction and stores it.
Each receipt includes a unique ID and timestamp, essential for record-keeping and customer service.

#### !!properties getAllReceipts

!name getAllReceipts

!type&#x20;

Retrieves all the billing receipts that have been generated.
Useful for providing customers with copies of their receipts or for internal financial tracking.
