/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var exec = require('cordova/exec');

/**
 * This class provides access to the debugging console.
 * @constructor
 */
var DebugConsole = function() {
};

/**
 * create a nice string for an object
 */
function stringify(message) {
    try {
        if (typeof message === "object" && JSON && JSON.stringify) {
            try {
                return JSON.stringify(message);
            }
            catch (e) {
                return "error JSON.stringify()ing argument: " + e;
            }
        } else {
            return message.toString();
        }
    } catch (e) {
        return e.toString();
    }
}

/**
 * remember the original console
 */
var origConsole = window.console || {};

/**
 * wrapper general console methods
 */
function wrapperConsoleMethod(name) {
    var origMethod = origConsole[name];
    if (!origMethod) return function() {};

    return function() {
        return origMethod.apply(origConsole, arguments);
    };
}

/**
 * wrapper general console property
 *
 * To make life easier for ourselves, map properties in the console
 * into a function which returns the property - breaks the "console API",
 * but it's non-standard anyway - at least there is a way to get to
 * the properties.
 */
function wrapperConsoleProperty(name) {
    return function() {
        return origConsole[name];
    };
}

/**
 * wrapper logging console methods
 */
function wrapperLoggingConsoleMethod(name) {
    var origMethod = origConsole[name];
    if (!origMethod) return function() {};

    return function(message) {
        var result = origMethod.apply(origConsole, arguments);

        exec(null, null,
            'Debug Console', 'log',
            [ stringify(message), { logLevel: name.toUpperCase() } ]
        );

        return result;
    };
}

// methods for DebugConsole
var methods = DebugConsole.prototype;

// unused method - deprecated 2012-10-05
methods.setLevel = function(level) {};

var propNames;
var propName;

// apply wrappers for logging properties
propNames = [ "memory", "profiles"];
for (var i=0; i<propNames.length; i++) {
    propName = propNames[i];
    methods[propName] = wrapperConsoleProperty(propName);
}

// apply wrappers for logging methods
propNames = [ "log", "info", "debug", "warn", "error"];
for (var i=0; i<propNames.length; i++) {
    propName = propNames[i];
    methods[propName] = wrapperLoggingConsoleMethod(propName);
}

// copy from original, what we haven't already built
for (propName in origConsole) {
    if (methods[propName]) continue;

    methods[propName] = wrapperConsoleMethod(propName);
}

module.exports = new DebugConsole();
