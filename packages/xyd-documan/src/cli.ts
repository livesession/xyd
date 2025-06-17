import readline from 'node:readline';
import cliSpinners from 'cli-spinners';

interface Spinner {
    frames: string[];
    interval: number;
}

type SpinnerName = keyof typeof cliSpinners;

export class CLI {
    private spinner: Spinner;
    private spinnerInterval: NodeJS.Timeout | null = null;
    private currentFrame = 0;
    private currentMessage = '';
    private isSpinning = false;

    constructor(spinnerType: SpinnerName = 'dots') {
        this.spinner = cliSpinners[spinnerType] as Spinner;
    }

    public startSpinner(message: string) {
        if (this.isSpinning) {
            this.stopSpinner();
        }

        this.currentMessage = message;
        this.isSpinning = true;
        this.currentFrame = 0;

        // Write initial message
        this.write(`${this.spinner.frames[0]} ${this.currentMessage}`);

        this.spinnerInterval = setInterval(() => {
            const frame = this.spinner.frames[this.currentFrame];
            this.write(`${frame} ${this.currentMessage}`);
            this.currentFrame = (this.currentFrame + 1) % this.spinner.frames.length;
        }, this.spinner.interval);
    }

    public stopSpinner() {
        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval);
            this.spinnerInterval = null;
        }
        this.isSpinning = false;
        this.clearLine();
    }

    private clearLine() {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
    }

    private write(message: string) {
        this.clearLine();
        process.stdout.write(message);
    }

    public log(message: string) {
        if (this.isSpinning) {
            this.stopSpinner();
        }
        console.log(message);
    }

    public error(message: string) {
        if (this.isSpinning) {
            this.stopSpinner();
        }
        console.error(message);
    }

    private updateMessage(message: string) {
        this.currentMessage = message;
    }

}

// Export a singleton instance
export const cli = new CLI(); 