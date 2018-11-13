/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import docs from './doc';

const intellisenseJson = docs.init();

// console.log(intellisenseJson);

const createModuleAndMethods = (jsonData) => { // eslint-disable-line
  let methodArr = [];
  if (Object.keys(jsonData).length === 0) {
    return [];
  }

  Object.keys(jsonData).forEach((item) => {
    const theEntity = jsonData[item];

    // entity starts
    methodArr = [
      ...methodArr,
      '/**',
      `* ${theEntity.description.replace(/<\/?[^>]+(>|$)/g, '')}`,
      '*/',
      `declare var ${item} = (function(){`,
    ];

    // describe methods
    theEntity.methods.forEach((method) => {
      const mName = method.getMethod();
      const mDescription = method.getDescription();
      const mParams = method.getParams();
      const mSummary = method.getSummary();
      const mReturn = method.getReturn();
      let paramsInBrackets = '';
      let paramsDescription = [];
      if (mParams.length > 0) {
        mParams.forEach((param) => {
          paramsInBrackets = `${paramsInBrackets} ${param.name} `;
          paramsDescription = [
            ...paramsDescription,
            `@param  {${param.type}} [${param.name}] ${param.description}`
          ];
        });
      }

      methodArr = [
        ...methodArr,
        '/**',
        mDescription ? ` * ${mDescription}` : '',
        mSummary ? ` * Summary ${mSummary}` : '',
        mReturn ? ` * @return ${mReturn}` : '',
        ...paramsDescription,
        ' */',
        `function ${mName}(${paramsInBrackets}){}`,
      ];
    });

    methodArr = [...methodArr, 'return {'];

    // render return
    theEntity.methods.forEach((method) => {
      const mName = method.getMethod();
      methodArr = [
        ...methodArr,
        `${mName}: ${mName}`,
      ];
    });

    methodArr = [...methodArr, '}'];

    // Entity ends
    methodArr = [...methodArr, '}());'];
  });

  return methodArr;
};

const arrdata = createModuleAndMethods(intellisenseJson);

export default function () {
  monaco.languages.typescript.javascriptDefaults.addExtraLib(
    arrdata.join('\n'),
    // , 'filename/webfunc.d.ts'
  );
}

