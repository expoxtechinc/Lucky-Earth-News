import { Switch, Route, Router as WouterRouter } from "wouter";
import Header from "@/components/Header";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";

function Router() {
  return (
    <Switch>
      <Route path="/admin" component={Admin} />
      <Route>
        <>
          <Header />
          <Switch>
            <Route path="/" component={Home} />
          </Switch>
        </>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}

export default App;
