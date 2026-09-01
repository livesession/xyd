import { render } from "solid-js/web";

function App() {
    return <h1 id="host-marker">Host Solid App</h1>;
}

render(() => <App />, document.getElementById("root"));
