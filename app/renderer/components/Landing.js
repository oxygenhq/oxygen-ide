import React from 'react';
import electron from 'electron';

export default class Landing extends React.PureComponent {
    constructor(props) {
        super(props);
    }

  processLink = (event) => {
      if (event) {
          event.preventDefault();

          // use currentTarget (the <a> the handler is bound to), not target, since
          // target can be a child element (e.g. the video thumbnail <img>)
          if (event.currentTarget instanceof HTMLAnchorElement) {
              const url = event.currentTarget.getAttribute('href');
              electron.shell.openExternal(url);
          } else {
              console.log('bad event.currentTarget', event.currentTarget);
          }
      }
  };

  render() {
      return (
          <div className="landing-container">
              <div className="landing-inner">
                  <h1 className="landing-title">Welcome to Oxygen</h1>
                  <p className="landing-text">To see an online tour of Oxygen click <a href="https://docs.oxygenhq.org/about/getting-started-videos" onClick={this.processLink}>here</a></p>
                  <p className="landing-text">To read an online guide of Oxygen click <a href="http://docs.oxygenhq.org/getting-started-web/introduction" onClick={this.processLink}>here</a></p>
                  <p className="landing-text">To learn about Cloudbeat click <a href="http://cloudbeat.io/" onClick={this.processLink}>here</a></p>
                  <div className="videoWrapper">
                      { /* the video owner disallows embedding (YouTube iframe error 152), so
                         open it in the system browser instead, same as the links above */ }
                      <a href="https://www.youtube.com/watch?v=xIuLpEGdE-k" onClick={this.processLink}>
                          <img
                              className="videoThumbnail"
                              src="https://img.youtube.com/vi/xIuLpEGdE-k/hqdefault.jpg"
                              alt="Watch video on YouTube"
                          />
                          <span className="videoPlayOverlay" />
                      </a>
                  </div>
              </div>
          </div>
      );
  }
}