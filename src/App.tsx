import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import logo from './logo.svg';
import './App.css';
import { ReadQr } from './ReadQr';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />

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
          <Route path="/read-qr">
            <ReadQr />
          </Route>
          <Route path="/">
          <p>
            Edit <code>src/App.tsx</code> and save to reload.
          </p>
          </Route>
        </Switch>
      </div>
    </Router>
      </header>
    </div>
  );
}

export default App;
