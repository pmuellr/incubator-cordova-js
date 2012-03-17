//------------------------------------------------------------------------------
var channel = require('../channel')
var exec    = require('../exec')

//------------------------------------------------------------------------------
var Writer           = null
var CallOriginal     = true
var StartTime        = null
var ConsoleOriginal  = window.console
var ConsoleCurrent   = null

var ConsoleService = module.exports

ConsoleService.console = function() {
    return ConsoleCurrent
}

ConsoleService.Writer = function(func) {
    if (!func) {
        return Writer
    }
    
    if (typeof func != 'function')
        throw new Error('setWriter() expecting a function as a parameter')

    Writer = func
}

ConsoleService.callOriginal = function(aBoolean) {
    if (aBoolean == undefined) {
        return CallOriginal
    }
    
    CallOriginal = aBoolean
}

//--------------------------------------------------------------------------
function addMethod(name, func) {
    Console.prototype[name] = func
}

//--------------------------------------------------------------------------
function currentMillis() {
    return StartTime - new Date().valueOf()
}

//--------------------------------------------------------------------------
function slice(args, index) {
    result = []
    
    for (var i=index; i<args.length; i++) {
        result.push(args[i])
    }
    
    return result
}

//------------------------------------------------------------------------------
// from this 'spec' http://getfirebug.com/wiki/index.php/Console_API
//------------------------------------------------------------------------------
function Console() {
    this._buffer = []
    this._timers = {}
}

    //--------------------------------------------------------------------------
    addMethod(" _write", function(string) {
        if (this._buffer) {
            this._buffer.push(string)
            return
        }
        
        if (Writer) {
            try {
                Writer(string)
            }
            catch (e) {}
            return
        }
        
        var f = function() {}
        exec(f, f, "Console", "write", [string])
    })
    
    //--------------------------------------------------------------------------
    addMethod("_dump_buffered", function () {
        for (var i=0; i<this._buffer.length; i++) {
            this._write(this._buffer[i])
        }
        
        this._buffer = null
    })
    
    //--------------------------------------------------------------------------
    addMethod("_callOriginal", function(methodName, args) {
        if (!ConsoleOriginal) return
        if (!CallOriginal) return
        
        var method = ConsoleOriginal[methodName]
        
        if (typeof method != 'function') return
        
        try {
            method.apply(ConsoleOriginal, args)
        }
        catch (e) {}
    })

    //--------------------------------------------------------------------------
    addMethod("_notImplemented", function(methodName) {
        this._write("console." + methodName + "() not implemented")    
    })

    //--------------------------------------------------------------------------
    addMethod("_format", function(object, objects) {
        var line = "" + object
        
        while (objects.length > 0) {
            object = objects.shift()
            
            var match = line.split(/(.*?)%(.)(.*)/)
            if (!match) return line
            
            var before = match[1]
            var c      = match[2]
            var after  = match[3]
            
            // css style to ignore; 
            if (c == 'c') {
                line = before + after
            }
            
            // one of the supported format chars
            else if ('sdifo'.indexOf(c) >= 0) {
                line = before + object + after
            }
            
            // not one of the supported format chars
            else {
                line = before + '/' + c + after // hack
                objects.unshift(object)
            }
        }
    
        return line
    })
    
    //--------------------------------------------------------------------------
    // WebInspector-only method
    //--------------------------------------------------------------------------
    addMethod("markTimeline", function(string) {           
        this._callOriginal("markTimeline", arguments)
        
        this._write(currentMillis() + "ms: " + string)    
    })
    
    //--------------------------------------------------------------------------
    addMethod("log", function() {                    //  log(object[, object, ...])
        this._callOriginal("log", arguments)
        
        this._write(this._format(arguments[0], slice(arguments,1)))
    })
    
    //--------------------------------------------------------------------------
    addMethod("debug", function() {                  //  debug(object[, object, ...])
        this._callOriginal("debug", arguments)
        
        this._write("DEBUG: " + this._format(arguments[0], slice(arguments,1)))
    })
    
    //--------------------------------------------------------------------------
    addMethod("info", function() {                   //  info(object[, object, ...])
        this._callOriginal("info", arguments)
        this._write("INFO:  " + this._format(arguments[0], slice(arguments,1)))
    })
    
    //--------------------------------------------------------------------------
    addMethod("warn", function() {                   //  warn(object[, object, ...])
        this._callOriginal("warn", arguments)
        this._write("WARN:  " + this._format(arguments[0], slice(arguments,1)))
    })
    
    //--------------------------------------------------------------------------
    addMethod("error", function() {                  //  error(object[, object, ...])
        this._callOriginal("error", arguments)
        this._write("ERROR: " + this._format(arguments[0], slice(arguments,1)))
    })
    
    //--------------------------------------------------------------------------
    addMethod("assert", function(expression) {       //  assert(expression[, object, ...])
        this._callOriginal("assert", arguments)
        
        if (!expression) {
            this.log("Assertion Failure")
            throw new Error("Assertion Failure")
        }
    })
    
    //--------------------------------------------------------------------------
    addMethod("clear", function() {                  //  clear()
        this._callOriginal("clear", arguments)
    })
    
    //--------------------------------------------------------------------------
    addMethod("dir", function(object) {              //  dir(object)
        this._callOriginal("dir", arguments)
        
        this._write("" + object)
        
        for (var key in object) {
            var val = object[key]
            this._write("   " + val + ": " + key)
        }
    })
    
    //--------------------------------------------------------------------------
    addMethod("dirxml", function(node) {             //  dirxml(node)
        this._callOriginal("dirxml", arguments)
        
        this._notImplemented("trace")
    })
    
    //--------------------------------------------------------------------------
    addMethod("trace", function() {                  //  trace()
        this._callOriginal("trace", arguments)
        
        this._notImplemented("trace")
    })
    
    //--------------------------------------------------------------------------
    addMethod("group", function() {                  //  group(object[, object, ...])
        this._callOriginal("group", arguments)
        this.log.apply(slice(arguments,0))
    })
    
    //--------------------------------------------------------------------------
    addMethod("groupCollapsed", function() {         //  groupCollapsed(object[, object, ...])
        this._callOriginal("groupCollapsed", arguments)
        this.log.apply(slice(arguments,0))
    })
    
    //--------------------------------------------------------------------------
    addMethod("groupEnd", function() {               //  groupEnd()
        this._callOriginal("groupEnd", arguments)
        // nothing to do
    })
    
    //--------------------------------------------------------------------------
    addMethod("time", function(name) {               //  time(name)
        this._callOriginal("time", arguments)
        
        this.timers[name] = currentMillis()
    })
    
    //--------------------------------------------------------------------------
    addMethod("timeEnd", function(name) {            //  timeEnd(name)
        this._callOriginal("timeEnd", arguments)
        
        var startTime = this.timers[name]
        if (!startTime) {
            this._write("unknown timer specified for console.timeEnd(): " + name )
            return
        }
        
        var elapsed = currentMillis() - startTime
        
        this._write(elapsed + "ms for timer " + name)
    })
    
    //--------------------------------------------------------------------------
    addMethod("profile", function(title) {           //  profile([title])
        this._callOriginal("profile", arguments)
        this._notImplemented("profile")
    })
    
    //--------------------------------------------------------------------------
    addMethod("profileEnd", function() {             //  profileEnd()
        this._callOriginal("profileEnd", arguments)
        this._notImplemented("profileEnd")
    })
    
    //--------------------------------------------------------------------------
    addMethod("count", function(title) {             //  count([title])
        this._callOriginal("count", arguments)
        this._notImplemented("count")
    })
    
    //--------------------------------------------------------------------------
    addMethod("exception", function(errorObject) {  //  exception(error-object[, object, ...])
        this._callOriginal("exception", arguments)
        
        this._write("exception: " + errorObject)
    })
    
    //--------------------------------------------------------------------------
    addMethod("table", function(data, columns) {     //  table(data[, columns])
        this._callOriginal("table", arguments)
        this._notImplemented("table")
    })
    
//------------------------------------------------------------------------------
ConsoleCurrent = new Console()
window.console = ConsoleCurrent
StartTime      = currentMillis()

channel.onDeviceReady.subscribeOnce(function() {
    ConsoleCurrent._dump_buffered()
})
