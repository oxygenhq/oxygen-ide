/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
/*
 * Exposes module-* documentation as a map of JSON (Doctrine) objects.
 */

/* eslint-disable */
(function() {
  var fs = require('fs');
  var path = require('path');
  var doctrine = require('doctrine');
  var modPath = path.resolve(__dirname, '../node_modules/oxygen-cli/build/ox_modules');
  module.exports = {};

  var docs = {};
  
  /*
   * Loads up JSDoc comments from a module-*.js file and stores them in a JSON (Doctrine) form.
   */
  module.exports.load = function(file, loadDescription) {
      try {
          var data = fs.readFileSync(file, 'utf8');
          
          var regex = /(\/\*\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)/g;

          var commentRaw;
          var comments = [];
          var commentParsed;
          var description;
          
          if (loadDescription) {
              commentRaw = regex.exec(data);
              commentParsed = doctrine.parse(commentRaw[0], { unwrap: true });
              description = commentParsed.description;
          } else {
              description = '';
          }
          
          while ((commentRaw = regex.exec(data)) !== null) {
              commentParsed = doctrine.parse(commentRaw[0], { unwrap: true });
              
              commentParsed.getMethod = function() {
                  for (var tag of this.tags)
                  {
                      if (tag.title === 'function') {
                          return tag.name;
                      }
                  }
              };
              commentParsed.getSummary = function() {
                  for (var tag of this.tags)
                  {
                      if (tag.title === 'summary') {
                          return tag.description.replace(/(\r\n|\n)/gm,'');
                      }
                  }
              };
              commentParsed.getDescription = function() {
                  for (var tag of this.tags)
                  {
                      if (tag.title === 'description') {
                          // make sure we don't remove line breaks if preceded by a double space
                          // in order not to lose markdown formatting
                          // (regex with negative look-behind doesn't work for some reason)
                          tag.description = tag.description.replace(/(  \r\n|  \n)/gm, '  LINEBR')
                          // remove line breaks
                          tag.description = tag.description.replace(/(\r\n|\n)/gm, '')
                          // restore line breaks
                          tag.description = tag.description.replace(/  LINEBR/gm, '  \n')
                          return tag.description;
                      }
                  }
              };
              commentParsed.getReturn = function() {
                  for (var tag of this.tags)
                  {
                      if (tag.title === 'return') {
                          var type = doctrine.type.stringify(tag.type, {compact:true});
                          type = type.replace(/<|>/ig, function(m){
                              return '&' + (m == '>' ? 'g' : 'l') + 't;';
                          });

                          return { 
                              description: tag.description.replace(/(\r\n|\n)/gm,''), 
                              type: type
                          };
                      }
                  }
              };
              commentParsed.getParams = function() {
                  var params = [];
                  for (var tag of this.tags)
                  {
                      if (tag.title === 'param') {
                          var optional;
                          if (tag.type.type === 'OptionalType' || tag.type.type === 'RestType') {
                              optional = true;
                          } else {
                              optional = false;
                          }

                          var type = doctrine.type.stringify(tag.type, {compact:true});
                          type = type.replace(/<|>/ig, function(m){
                              return '&' + (m == '>' ? 'g' : 'l') + 't;';
                          });
                          
                          params.push({ 
                              description: tag.description.replace(/(\r\n|\n)/gm,''), 
                              name: tag.name, 
                              type: type,
                              optional: optional
                          });
                      }
                  }
                  return params;
              };
              if (typeof commentParsed.getMethod() !== 'undefined')
                  comments.push(commentParsed);
          }
          
          return {description: description.replace(/(\r\n|\n)/gm,''), methods: comments};
      } catch (exc) {       
          console.error('Unable to load/parse ' + file);
      }
  };

  /*
   * Loads all the required modules.
   */
  module.exports.init = function() {
      var modules = fs.readdirSync(modPath);
      for (var m of modules) {
          if (!m.startsWith('module-')) {
              continue;
          }
          var name = m.substring('module-'.length, m.length - '.js'.length);
          if (fs.lstatSync(path.join(modPath, m)).isFile() && m.endsWith('.js')) {
              var modDir = path.join(modPath, 'module-' + name);
              if (fs.existsSync(modDir)) {
                  var modDoc = this.load(path.join(modPath, m), true);
                  // load commands
                  var cmdsDir = path.join(modDir, 'commands');
                  var cmds = fs.readdirSync(cmdsDir);
                  for (var cmd of cmds) {
                      var cmdfile = path.join(cmdsDir, cmd);
                      if (fs.lstatSync(cmdfile).isFile() && cmd.endsWith('.js')) {
                          modDoc.methods = modDoc.methods.concat(this.load(cmdfile, false).methods);
                      }
                  }
                  docs[name] = modDoc;
              } else {
                  docs[name] = this.load(path.join(modPath, m), true);
              }
          } 
      }
      return docs;
  };
  
}).call(this);
