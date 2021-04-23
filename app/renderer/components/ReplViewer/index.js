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
            refreshScroll: false,
        };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        const diff = difference(nextProps.repl.list, this.props.repl.list); 
        const lengthDiff = !(nextProps.repl.list.length === this.props.repl.list.length);
        let newState = {};

        if ((diff && diff.length) || lengthDiff) {
            newState = {
                refreshScroll: !this.state.refreshScroll,
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
            refreshScroll,
            replClosing,
            value
        } = this.state;

        const {
            list
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
                        height: (height - 70)+'px',
                        overflow: 'hidden'
                    }}
                >
                    <ScrollContainer
                        refreshScroll={refreshScroll}
                        classes="scroller"
                    >
                        {() => (
                            <div
                                style={{
                                    height: height - 70,
                                    minHeight: height - 70,
                                }}
                            >
                                {list.map((item, idx) => {
                                    return (<div style={{ marginLeft: '5px' }} key={idx}>{item}</div>);
                                })}
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
                        onClick={this.replClose}
                        loading={replClosing}
                    >
                        Close
                    </Button>
                    <Input
                        style={{
                            margin: '0px 5px'
                        }}
                        value={ value }
                        onChange={ (e) => this.setState({value: e.target.value}) }
                        onPressEnter={this.replSend}
                    />
                    <Button
                        type="primary"
                        onClick={this.replSend}
                    >
                        Enter
                    </Button>
                </div>
            </div>
        );
    }
}