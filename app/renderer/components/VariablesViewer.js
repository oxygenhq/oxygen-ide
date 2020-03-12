//@flow
import React from 'react';
import Tree from '../components/Tree';
import renderVariablesTreeNodes from './renderVariablesTreeNodes';
import ScrollContainer from './ScrollContainer.jsx';
import difference from 'lodash/difference';

type Props = {
    variables: Array | null,
    height: number
};

export default class VariablesViewer extends React.PureComponent<Props> {
    constructor(props) {
        super(props);
        
        this.state = {
            refreshScroll: false,
        };
    }
    
    UNSAFE_componentWillReceiveProps(nextProps) {

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
        );
    }
}