import React, { PureComponent, Fragment } from 'react';
import electron from 'electron';

export default class Landing extends PureComponent {
  constructor(props) {
    super(props);
  }

  processLink = (event) => {
    if(event){
      event.preventDefault();

      if (event.target instanceof HTMLAnchorElement) {
        const url = event.target.getAttribute('href');
        electron.shell.openExternal(url);
      } else {
        console.log('bad event.target', event.target);
      }
    }
  }

  render(){
    return (
      <div className="landing-container">
        <div className="landing-inner">
          <h1 className="landing-title">Welcome to Oxygen</h1>
          <p className="landing-text">To see an online tour of Oxygen click <a href="http://docs.oxygenhq.org/about-video-tutorials.html" onClick={this.processLink}>here</a></p>
          <p className="landing-text">To read an online guide of Oxygen click <a href="http://docs.oxygenhq.org/guide-web-intro.html" onClick={this.processLink}>here</a></p>
          <p className="landing-text">To learn about Cloudbeat click <a href="http://cloudbeat.io/" onClick={this.processLink}>here</a></p>
        </div>
      </div>
    )
  }
}