import React from 'react';
import electron from 'electron';

export default class Landing extends React.PureComponent {
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
                  <p className="landing-text">To see an online tour of Oxygen click <a href="https://docs.oxygenhq.org/about/getting-started-videos" onClick={this.processLink}>here</a></p>
                  <p className="landing-text">To read an online guide of Oxygen click <a href="http://docs.oxygenhq.org/getting-started-web/introduction" onClick={this.processLink}>here</a></p>
                  <p className="landing-text">To learn about Cloudbeat click <a href="http://cloudbeat.io/" onClick={this.processLink}>here</a></p>
                  <div className="videoWrapper">
                      <iframe width="560" height="315" src="https://www.youtube.com/embed/xIuLpEGdE-k" frameBorder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                  </div>
              </div>
          </div>
      );
  }
}