import("./sample-app").then(async ({ SampleApp }) => {
    const React = await import("react");
    const { createRoot } = await import("react-dom/client");

    const root = createRoot(document.getElementById("root")!);
    root.render(React.createElement(SampleApp));
});
