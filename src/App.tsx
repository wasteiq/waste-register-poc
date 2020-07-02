import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
//  useLocation
} from "react-router-dom";
import logo from './logo.svg';
import './App.css';
import { ReadQr } from './ReadQr';

/* function useQuery() {
  return new URLSearchParams(useLocation().search);
} */

function App() {
  // const query = useQuery()
  return (
    <div className="App">
      <header className="App-header">
        <Router>
          <div>
            <nav>
              <ul>
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <Link to="/read-qr">Scan QR</Link>
                </li>
              </ul>
            </nav>

            <Switch>
              <Route path="/read-qr/:useMockImage/">
                <ReadQr useMockImage={true} />
              </Route>
              <Route path="/read-qr/">
                <ReadQr useMockImage={false} />
              </Route>
              <Route path="/">
                <div>
                  <img src={logo} className="App-logo" alt="logo" />
                  <p>
                    Edit <code>src/App.tsx</code> and save to reload.
                  </p>
                </div>
              </Route>
            </Switch>
          </div>
        </Router>
      </header>
    </div>
  );
}

export default App;
