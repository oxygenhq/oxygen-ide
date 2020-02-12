import React from 'react';

export default class Initializing extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    render(){
        return (
            <div className="initializing-container">
                <div className="initializing-inner">
                    <h1 className="initializing-title">
            Initializing...
                    </h1>
                </div>
            </div>
        );
    }
}