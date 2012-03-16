#!/usr/bin/env node

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

fs   = require('fs')
path = require('path')
exec = require('child_process').exec

//------------------------------------------------------------------------------
process.chdir(path.join(__dirname, '..'))

if (!path.existsSync('tmp')) {
    fs.mkdirSync('tmp')
}

var platforms = getPlatforms()

allLines = []
allFound = {}

allLines.push('//-------------------------------------------------------')
allLines.push('// graphviz .dot file for cordova')
allLines.push('//-------------------------------------------------------')
allLines.push('')
allLines.push('digraph cordova {')

for (var i=0; i<platforms.length; i++) {
    var platform = platforms[i]
    
    generateGraph(platform)
}

allLines.push('}')

dotFile = path.join('tmp', 'all-cordova.dot')
svgFile = path.join('tmp', 'all-cordova.svg')

console.log('writing file: ' + dotFile)
fs.writeFileSync(dotFile, allLines.join('\n'))

dot2svg(dotFile, svgFile)

//------------------------------------------------------------------------------
oFile = path.join('tmp', 'requires.html')
oLines = []

oLines.push('<h1>cordova module dependency pictures</h1>')
oLines.push('<ul>')

oLines.push('<li><a href="all-cordova.svg"> everthing </a>')

for (var i=0; i<platforms.length; i++) {
    var platform = platforms[i]
    
    oLines.push('<li><a href="' + platform + '-requires.svg">' + platform + '</a>')
}

oLines.push('</ul>')

console.log('writing file: ' + oFile)
fs.writeFileSync(oFile, oLines.join('\n'))

//------------------------------------------------------------------------------
function getPlatforms() {
    var entries = fs.readdirSync('pkg')
    
    var platforms = []
    
    for (var i=0; i<entries.length; i++) {
        var entry = entries[i]
        
        var match = entry.match(/^cordova\.(.*)\.js$/)
        if (match)
            platforms.push(match[1])
    }
    
    return platforms
}

//------------------------------------------------------------------------------
function generateGraph(platform) {
    var modules = {}
    var dotFile = path.join('tmp/', platform + '-requires.dot')
    var svgFile = path.join('tmp/', platform + '-requires.svg')
    var oLines  = []
    
    var jsFile = path.join('pkg', 'cordova.' + platform + '.js')
    
    contents = fs.readFileSync(jsFile, 'utf-8')
    contents = contents.replace(/\n/g, ' ')
    
    modulesSource = contents.split(/define\(/)
    
    oLines.push('//-------------------------------------------------------')
    oLines.push('// graphviz .dot file for ' + platform)
    oLines.push('// dot -Tsvg -o' + path.basename(svgFile) + ' ' + path.basename(dotFile))
    oLines.push('//-------------------------------------------------------')
    oLines.push('')
    oLines.push('digraph ' + platform + '{')
    
    for (var i=0; i< modulesSource.length; i++) {
        var moduleSource = modulesSource[i];
        
        var match = moduleSource.match(/'(.*?)'(.*)/)
        if (!match) continue
        
        var moduleName = match[1]
        moduleSource   = match[2]
        
        if (moduleName.match(/\s/)) continue
        if (moduleName   == '')     continue
        if (moduleSource == '')     continue

        modules[moduleName] = modules[moduleName] || []
        // console.log('   found module ' + moduleName)
        
        var requires = getRequires(moduleSource)
        
        // console.log("module: " + moduleName) 
        // for (var j=0; j < requires.length; j++) {
        //     console.log("    " + requires[j])
        // }
        
        for (var j=0; j < requires.length; j++) {
            var gvModule  =  moduleName.replace(/\//g, '\\n')
            var gvRequire = requires[j].replace(/\//g, '\\n')
            
            oLines.push(  '   "' + gvModule + '" -> "' + gvRequire + '";')
            
            allKey = gvModule + '->' + gvRequire
            if (allFound[allKey]) continue
            
            allFound[allKey] = true
            allLines.push('   "' + gvModule + '" -> "' + gvRequire + '";')
        }
    }

    oLines.push('}')
    
    console.log('writing file: ' + dotFile)
    fs.writeFileSync(dotFile, oLines.join('\n'))
    
    dot2svg(dotFile, svgFile)
}

//------------------------------------------------------------------------------
function dot2svg(iFile, oFile) {
    cmd = 'dot -Tsvg -o' + oFile + ' ' + iFile
          
    console.log('running cmd:  ' + cmd)
    exec(cmd, function(error, stdout, stderr) {
//        if (error) 
//            console.log('error: "' + error + '" running "' + cmd + '"')
            
//        if (stdout) console.log(stdout)
        if (stderr) console.log(trim(stderr))
    })
}

//------------------------------------------------------------------------------
function getRequires(moduleSource) {
    var pattern = /.*?require\((.*?)\)(.*)/

    var result = []
//    console.log(moduleSource)
    
    var match = moduleSource.match(pattern)
    
    while (match) {
        var require  = trim(match[1])
        moduleSource = match[2]
        
        if (require.match(/(^'.*'$)|(^".*"$)/)) {
            require = require.replace(/'|"/g, '')
            result.push(require)
        }
        
        match = moduleSource.match(pattern)
    }
    
    return result
}

//------------------------------------------------------------------------------
function trim(string) {
    return string.replace(/(^\s+)|(\s+$)/g,'')
}
    
