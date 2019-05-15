import React, { PureComponent, Fragment } from 'react';

export default class Initializing extends PureComponent {
  constructor(props) {
    super(props);
  }

  render(){
    return (
      <div className="initializing-container">
        <div className="initializing-inner">
          <h1 className="initializing-title">
            Initializing
          </h1>
          <p className="initializing-text">(normaly less then minute)</p>
        </div>
      </div>
    )
  }
}