import React, {useState} from "react";

export function useUXClick(
    openEvent: (data: any) => void,
    closeEvent: (data: any) => void,
    getData: () => any
) {
    const [open, setOpen] = useState(false);

    return (event: React.MouseEvent) => {
        const newOpen = !open;
        setOpen(newOpen);

        const data = getData();
        if (newOpen) {
            openEvent(data);
        } else {
            closeEvent(data);
        }
    };
}
