import React, { PureComponent, Fragment } from 'react';


export default class Landing extends PureComponent {
  constructor(props) {
    super(props);
  }

  render(){
    return (
      <div className="landing-container">
        <div className="landing-inner">
          <h1 className="landing-title">
            Please, select project folder
          </h1>
          <p className="landing-text">(in file menu)</p>
        </div>
      </div>
    )
  }
}