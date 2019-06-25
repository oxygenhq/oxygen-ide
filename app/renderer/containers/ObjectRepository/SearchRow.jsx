import React, { PureComponent } from 'react';
import { Input } from 'antd';
import '../../css/search-row.scss';

 const check = (treeItem, searchQuery) => {
  if(treeItem && treeItem.name && searchQuery){
    return treeItem.name.toLowerCase().includes(searchQuery.toLowerCase());
  }
}

 const getVisibleTrees = (trees, searchQuery) => {
  let results = [];

   trees.map(t => {
    const includeInName = check(t, searchQuery);

     let nameMatch = {};

     if(includeInName){
      const { children, ...data } = t;
      nameMatch = data;
    }

     if(t.children){
      const includeInChildren = t.children.filter(c => {
        return check(c, searchQuery)
      });

       let result = [];

       if(nameMatch.name){
        result = [ nameMatch , ...includeInChildren ];
      } else {
        result = includeInChildren;
      }

       if(result.length){
        result.forEach(element => {
          results.push(element.name);
        });
      } else {
        return false;
      }
    } else {
      if(includeInName){
        results.push(nameMatch.name);
      }
    }
  })

   return results;
}

 export default class SearchRow extends PureComponent<Props> {
  constructor(props: Props) {
    super(props: Props);
    this.state = {
      searchQuery: '',
      searchResults: []
    };

     this.inputRef = React.createRef();
  }


   onChange = (e) => {
    const { tree } = this.props;

     const newSearchQuery = e.target.value.trim()
    const searchResults = getVisibleTrees(tree, newSearchQuery)

     this.setState({ 
      searchQuery: newSearchQuery ,
      searchResults: searchResults
    }, () => {
      this.props.setSearchResults(searchResults);
      this.inputRef.current.focus();
    })
  }

   clear = () => {
    this.setState({ 
      searchQuery: '' ,
      searchResults: []
    }, () => {
      this.props.setSearchResults([]);
      this.inputRef.current.focus();
    })
  }

   render() {
    const { searchQuery, searchResults } = this.state;
    const { tree } = this.props;
    if(tree){
      let controls = null;

       if(searchQuery){
        controls = (
          <div className={ 'search-row-contols' }>
            <div 
              onClick={ this.clear }
              className={ 'clear' }
            >{ 'x' }</div>
            <div className={ 'text' }>{ searchResults.length }</div>
          </div>
        );

       }

       return (
        <div className={ 'search-row' }>
          <Input 
            ref={this.inputRef} 
            addonAfter={ controls }
            value={ searchQuery }
            onChange={ this.onChange }
            placeholder={ 'search in tree' } 
          />
        </div>
      );
    } else {
      return null;
    }
  }
}