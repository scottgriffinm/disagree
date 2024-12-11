import * as React from "react";
import { Switch, Route, Router } from "wouter";
import Home from "../pages/home.jsx";
import Create from "../pages/create.jsx";
import Waiting from "../pages/waiting.jsx";
import VoiceCall from "../pages/call-voice.jsx";
import TextCall from "../pages/call-text.jsx";

/**
* The router is imported in app.jsx
*
* Our site just has two routes in it–Home and About
* Each one is defined as a component in /pages
* We use Switch to only render one route at a time https://github.com/molefrog/wouter#switch-
*/

export default () => (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create" component={Create} />
      <Route path="/waiting" component={Waiting} />
      <Route path="/call-voice" component={VoiceCall} />
      <Route path="/call-text" component={TextCall} />
    </Switch>
);
