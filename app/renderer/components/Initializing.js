import React, { PureComponent, Fragment } from 'react';

export default class Initializing extends PureComponent {
  constructor(props) {
    super(props);
  }

  render(){
    return (
      <div className="landing-container">
        <div className="landing-inner">
          <h1 className="landing-title">
            Initializing
          </h1>
          <p className="landing-text">(normaly less then minute)</p>
        </div>
      </div>
    )
  }
}