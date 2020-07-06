import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams,
} from "react-router-dom";
import logo from './logo.svg';
import './App.css';
import { ReadQr } from './ReadQr';
import { ReadConfirm } from './ReadConfirm';

const ReadConfirmWithParams = () => {
  const params = useParams<{customerId: string, fractionId: string, wasteRoomLabel: string}>()
  return <ReadConfirm {...params} />
}

function App() {
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

            <div style={{marginTop: "15vh"}}>
              <Switch>
                <Route path="/read-qr/:useMockImage/">
                  <ReadQr useMockImage={true} />
                </Route>
                <Route path="/confirm/:customerId/:fractionId/:wasteRoomLabel/">
                  <ReadConfirmWithParams />
                </Route>
                <Route path="/read-qr/">
                  <ReadQr useMockImage={false} />
                </Route>
                <Route path="/">
                  <div>
                    <img src={logo} className="App-logo" alt="logo" />
                    <p>
                      Click <code>[ Scan QR ]</code> to read QR Codes.
                    </p>
                  </div>
                </Route>
              </Switch>
            </div>
          </div>
        </Router>
      </header>
      <footer />
    </div>
  );
}

export default App;
