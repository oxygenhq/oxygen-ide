import React, { PureComponent, Fragment } from 'react';
import Tree from '../components/Tree';
import renderVariablesTreeNodes from './renderVariablesTreeNodes';
import ScrollContainer from './ScrollContainer';
import difference from 'lodash.difference';

export default class VariablesViewer extends PureComponent {
    constructor(props) {
      super(props);
      
        this.state = {
            refreshScroll: false,
        }
    }
    
    componentWillReceiveProps(nextProps) {

        let nextPropsVariables = [];
        let thisPropVariables = [];

        if(nextProps && nextProps.variables){
            nextPropsVariables = nextProps.variables;
        }

        if(this.prop && this.prop.variables){
            thisPropVariables = this.prop.variables;
        }


        const diff = difference(nextPropsVariables, thisPropVariables);   
        let newState = {};

        if (diff && diff.length) {
            newState = {
                refreshScroll: !this.state.refreshScroll
            };
        }

        this.setState(
            newState
        );
    }

    render(){
        const { height, variables } = this.props;
        const { refreshScroll } = this.state;

        return(
            <div style={{height: (height - 32)+'px'}}>
                <ScrollContainer
                    refreshScroll={refreshScroll}
                    classes="scroller"
                >
                    {() => (
                        <div
                            style={{
                                height: height - 32,
                                minHeight: height - 32,
                            }}
                        >
                            <Tree>
                                { renderVariablesTreeNodes.apply(this, [variables]) }
                            </Tree>
                        </div>
                    )}
                </ScrollContainer>
            </div>
        )
    }
}