/**
 *
 * Includes enums for payment methods and transaction statuses, interfaces for billing transactions and receipts,
 * and services to process transactions, manage billing history, and generate receipts.
 *
 * This module ensures comprehensive handling of billing data and operations, facilitating integrations with various payment providers and internal systems. It serves as a foundation for the financial transaction processing system, providing traceability and accountability through structured data and services.
 *
 * @module
 */

/**
 * Enum representing different types of payment methods.
 * These are used to specify the payment mechanism chosen by a customer.
 */
export enum PaymentMethod {
    /** Payment through credit card. */
    CreditCard = "Credit Card",

    /** Payment through PayPal. Ideal for users who prefer not to directly use their credit card details. */
    PayPal = "PayPal",

    /** Payment via direct bank transfer. Used typically for larger transactions or where credit cards and PayPal are not viable. */
    BankTransfer = "Bank Transfer",
}

/**
 * Enum representing different transaction statuses.
 * These statuses indicate the current state of a billing transaction in the process pipeline.
 */
export enum TransactionStatus {
    /** Transaction has been initiated but not yet processed. */
    Pending = "Pending",

    /** Transaction has been successfully processed. */
    Completed = "Completed",

    /** Transaction failed due to an error or rejection. */
    Failed = "Failed",
}

/**
 * Interface representing a billing transaction.
 * This structure encapsulates all key details of a financial transaction within the system.
 */
export interface BillingTransaction {
    /**
     * Unique identifier for the transaction. This ID is used to track and reference the transaction
     * throughout the billing process.
     */
    transactionId: string;

    /**
     * Identifier for the order associated with this transaction. Helps link the transaction to specific goods or services purchased.
     */
    orderId: string;

    /**
     * The total amount of money involved in the transaction. This is usually in the smallest unit of the currency,
     * such as cents in USD.
     */
    amount: number;

    /**
     * The method of payment used for the transaction, as defined by the PaymentMethod enum.
     * This indicates how the customer chose to pay (e.g., Credit Card, PayPal, Bank Transfer).
     */
    paymentMethod: PaymentMethod;

    /**
     * The current status of the transaction, categorized by the TransactionStatus enum. Indicates whether the
     * transaction is pending, completed, or has failed.
     */
    status: TransactionStatus;
}

/**
 * Interface representing a billing receipt.
 * Provides a record of the transaction for both the customer and the business.
 */
export interface BillingReceipt {
    /**
     * Unique identifier for the receipt. This ID is crucial for referencing and tracking the receipt
     * in financial records and customer queries.
     */
    receiptId: string;

    /**
     * The transaction details associated with this receipt. Links the receipt to the actual transaction
     * that took place.
     */
    transaction: BillingTransaction;

    /**
     * The timestamp (in UNIX epoch time) when the receipt was generated. Provides a precise record of when
     * the transaction was finalized and acknowledged.
     */
    timestamp: number;
}

/**
 * Service for managing billing transactions.
 * Provides functionality to process and retrieve billing transactions.
 * @class
 */
export class BillingService {
    /** Holds all processed transactions within the service. */
    private transactions: BillingTransaction[] = [];

    /**
     * Processes a billing transaction by adding it to the list of transactions.
     * This simulates the transaction execution and storage in a production environment.
     * @param transaction - The billing transaction to be processed.
     * @returns The processed billing transaction, now stored in the service.
     */
    processTransaction(transaction: BillingTransaction): BillingTransaction {
        this.transactions.push(transaction);
        return transaction;
    }

    /**
     * Retrieves all the billing transactions that have been processed.
     * Useful for audits and general transaction management.
     * @returns An array of all billing transactions.
     */
    getAllTransactions(): BillingTransaction[] {
        return this.transactions;
    }
}

/**
 * Service for managing billing history.
 * Provides functionality to store and retrieve the history of transactions.
 * @class
 */
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

/**
 * Service for generating billing receipts.
 * Provides functionality to generate and retrieve receipts for transactions.
 * @class
 */
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