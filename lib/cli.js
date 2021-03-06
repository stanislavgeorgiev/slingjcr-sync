/*jslint node: true */
/*global Class: true, Options: true*/

'use strict';

// ---------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------
require('mootools');

var colors = require('colors'),
	moment = require('moment'),
	optimist = require('optimist');


var Cli = new Class({

	Implements: Options,

	options: {
		'directory': {
			alias: 'd',
			desc: 'Define the root directory to watch, if this is not defined the program will use the current working directory.'
		},
		'output': {
			alias: 'o',
			desc: 'Define the directory to output the files, if this is not defined the program will use the same directory from file.'
		},
		'user': {
		    alias: 'u',
		    desc: 'Define the directory to output the files, if this is not defined the program will use the same directory from file.'
		},
		'pass': {
		    alias: 'p',
		    desc: 'Define the directory to output the files, if this is not defined the program will use the same directory from file.'
		},
		'match': {
			alias: 'm',
			desc: 'Matching files that will be processed. Defaults to **/*.+(js|css|jsp|png|jpg|jpeg|gif)'
		},
		'force': {
			alias: 'f',
			desc: 'Force to upload all files on startup before start watching files.'
		},
		'ignore': {
			alias: 'i',
			desc: 'Define the ignore file list. Can be a file or directory. Ex: **/src/_*.less'
		},
		'interval': {
			alias: 't',
			desc: 'Sets the interval in miliseconds of the files that will be watching. Defaults to 250'
		},
		'silent': {
			alias: 's',
			desc: 'Sets to silent mode. Starts without log output.'
		},
		'options': {
			alias: 'opt',
			desc: 'Show options on startup.'
		},
		'help': {
			alias: 'h',
			desc: 'Show this message'
		}
	},

	initialize: function( app, options ) {
		this.app = app;
		this.setOptions( options );
		this.config = this.configure();

		this.init();

		return this;
	},

	configure: function() {

		// ---------------------------------------------------------------
		// Start optimist command line tool
		// ---------------------------------------------------------------
		Object.forEach( this.options, function( value, name ) {
			optimist.option( name, value );
		});

		var options = optimist.wrap( 80 )
			.usage( 'Usage: {OPTIONS}' )
			.check( function( argv ) {
				if ( argv.help ) {
					throw '';
				}
			}).argv;

		// Remove unused options and alias
		delete options.$0;
		delete options._;
		Object.forEach(options, function(value, key) {
			if (key.length == 1) delete options[key];
		});

		return options;
	},


	init: function() {

		// Silent mode
		if (!this.config.silent) {
			this.events();
		}

		return this;
	},


	events: function() {
		var app = this.app,
			cli = this;
		// ---------------------------------------------------------------
		// Watch events
		// ---------------------------------------------------------------
		app.once( 'init', function( options ) {

			// Start to find files
			cli.log( new Array(62).join( '=' ).grey );
			cli.log( '>'.grey, 'Finding',  this.options.match.cyan, 'files' );
			cli.log( new Array(62).join( '=' ).grey );

			// Output current options
			if ( cli.config.options ) {
				cli.log( '>'.grey, 'Current Options:'.green );
				Object.forEach( options, function( value, option ) {
					cli.log( '>'.grey, option.yellow, '=>'.red, typeof value == 'string' ? '"' + value + '"' : value.toString().cyan );
				}, this );
				cli.log( new Array(62).join( '=' ).grey );
			}

			cli.log( '[Hint: Press Ctrl+C to quit.]'.grey );
			cli.logLine();
			cli.log( 'Listing Done!'.cyan );
			cli.logLine();

		})
		// ---------------------------------------------------------------
		// Watch started
		// ---------------------------------------------------------------
		.once( 'done', function() {

			cli.logLine();
			cli.log( 'Watch started.'.cyan );
			cli.logLine();

		})
		// ---------------------------------------------------------------
		// Watch file is updated
		// ---------------------------------------------------------------
		.on( 'fileUpdated', function( file ) {

			cli.log( 'File updated'.yellow, ' >> ', file );

		})
		// ---------------------------------------------------------------
		// When a file is found processed
		// ---------------------------------------------------------------
		.on( 'fileProcessed', function( file ) {

			cli.log( 'Found'.green, file );

		})
		// ---------------------------------------------------------------
		// When a file is removed
		// ---------------------------------------------------------------
		.on( 'fileRemoved', function( file ) {

			cli.log( 'Removing'.yellow, file );

		})
		// ---------------------------------------------------------------
		// Show application errors
		// ---------------------------------------------------------------
		.on( 'error', function(e) {

			cli.log( 'ERROR:'.red, e.message );

			if (e.fatal) {
				process.exit( 1 );
			}

		})
		// ---------------------------------------------------------------
		// Show application warning
		// ---------------------------------------------------------------
		.on( 'warn', function(w) {

			cli.log( 'WARN:'.yellow, w.message );

		});

		// ---------------------------------------------------------------
		// Trigger message on process finish
		// ---------------------------------------------------------------
		process.on( 'exit', function() {
			console.warn( 'Quitting...' );
		});

		return this;
	},


	log: function() {
		var args = Array.slice(arguments, 0);
		var date = '[' + moment().format( 'MMM-DD HH:mm:ss' ) + ']';
		args.unshift(date.grey);
		console.log.apply(this, args);
	},

	logLine: function(linebreak) {
		console.log();
	},

	logDivider: function(linebreak) {
		this.log(new Array(62).join( '-' ).grey + (linebreak ? '\n' : '' ));
	}

});

module.exports = function( app, options, callback ) {
	
	return new Cli( app, options );

};