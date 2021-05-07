//@flow
import React from 'react';
import ScrollContainer from '../ScrollContainer.jsx';
import { Input, Button } from 'antd';
import difference from 'lodash/difference';

type Props = {
    repl: Object | null,
    height: number,
    replClose: Function,
    replSend: Function
};

export default class ReplViewer extends React.PureComponent<Props> {
    constructor(props) {
        super(props);
        
        this.state = {
            value: '',
            replClosing: false,
            refreshScrollBottom: false,
        };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        const diff = difference(nextProps.repl.list, this.props.repl.list); 
        const lengthDiff = !(nextProps.repl.list.length === this.props.repl.list.length);
        let newState = {};

        if ((diff && diff.length) || lengthDiff) {
            newState = {
                refreshScrollBottom: !this.state.refreshScrollBottom,
            };
        }
        
        this.setState(
            newState
        );
    }

    replClose = () => {
        const {
            replClose
        } = this.props;

        this.setState({
            replClosing: true
        }, () => {
            replClose();
        });
    }
    
    replSend = () => {
        const {
            replSend
        } = this.props;
        const {
            value
        } = this.state;

        this.setState({
            value: ''
        }, () => {
            replSend(value);
        });
    }

    render() {
        const {
            repl,
            height
        } = this.props;
        const {
            refreshScrollBottom,
            replClosing,
            value
        } = this.state;

        const {
            list,
            waitResult
        } = repl;

        return (
            <div
                style={{
                    height: (height - 32)+'px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
            >
                <div
                    style={{
                        flex: '1',
                        height: (height - 80)+'px',
                        overflow: 'hidden'
                    }}
                >
                    <ScrollContainer
                        refreshScrollBottom={refreshScrollBottom}
                        classes="scroller"
                    >
                        {() => (
                            <div
                                style={{
                                    height: height - 80,
                                    minHeight: height - 80,
                                }}
                            >
                                {list.map(({cmd, msg}, idx) => {
                                    return (
                                        <div 
                                            style={{
                                                marginLeft: '5px',
                                                color: cmd ? '#0f7da8' : 'rgba(0, 0, 0, 0.65)'
                                            }}
                                            key={idx}
                                        >
                                            {cmd ? '>' : ''} {msg}
                                        </div>
                                    );
                                })}
                                <div style={{ marginLeft: '5px', height: '21px' }}></div>
                            </div>
                        )}
                    </ScrollContainer>
                </div>
                <div
                    style={{
                        display: 'flex',
                        margin: '5px'
                    }}
                >
                    <Button
                        onClick={ this.replClose }
                        loading={ replClosing }
                    >
                        Close
                    </Button>
                    <Input
                        style={{
                            margin: '0px 5px'
                        }}
                        value={ value }
                        onChange={ (e) => this.setState({value: e.target.value}) }
                        onPressEnter={ this.replSend }
                        disabled={ waitResult }
                    />
                    <Button
                        type="primary"
                        onClick={ this.replSend }
                        loading={ waitResult }
                    >
                        {
                            waitResult &&
                            <span>Executing...</span>
                        }
                        {
                            !waitResult &&
                            <span>Enter</span>
                        }
                    </Button>
                </div>
            </div>
        );
    }
}