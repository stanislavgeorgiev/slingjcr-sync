/*jslint node: true */
/*global Class: true, Options: true*/

'use strict';

 /**
  * Dependencies
  */
require('mootools');
//require('nodetime').profile();

var fs = require('fs'),
	path = require('path'),
	minimatch = require('minimatch'),
	stalker = require('stalker'),
    request = require('request'),
    sys = require('sys'),
    watch = require('watch'),
    exec = require('child_process').exec;


/**
 * Monitor Class
 * @type {Class}
 */
var Monitor = new Class({

	Implements: [ process.EventEmitter, Options ],

	options: {

		directory: '',
		output: 'http://localhost:4502/',
		user: 'admin',
        pass: 'admin',
        match: '**/*.+(js|jsp|css|png|jpg|jpeg|gif)',
		ignore: '',
		optimization: 0,
		compress: false,
		interval: 2000

	},
    
	/**
	 * Class constructor
	 *
	 * @construtor
	 */
	initialize: function() {
		this.files = {};
		this.filesCache = {};
		this.watchList = [];

		this.process = {};
		this.parsePending = 0;
	},


	/**
	 * Initialize the instance and start to scan directories
	 *
	 * @return {object} Class instance
	 */
	init: function (options) {

		this.setOptions( options );

		this.options.directory = path.relative( process.cwd(), this.options.directory ) || '.';

		// Ignore a file or a directory
		this.options.ignore = this.options.ignore.split( '\\' ).join( '/' );

		if ( this.options.ignore && !path.basename( this.options.ignore ).contains(".") ) {
			// Ignore all files from directory
			this.options.ignore += '/*.*';
		}

	    this.scan( this.options.directory );
		this.emit( 'init', this.options );

		return this;
	},

	/**
	 * scan Scan the directory for files
	 *
	 * @return {object} Class instance
	 */
	scan: function (directory) {

	    /*var options = this.options;

	    this.watch = watch.createMonitor(directory,
            {
                filter:function( file ) { does not work
		            return !minimatch( file, options.ignore ) && minimatch( file, options.match );
	            }
            },
            function (monitor) { folders are showing as files and have to parsed 
	            monitor.files[directory + '.zshrc'] // Stat object for my zshrc.
	            monitor.on("created", function (file, stat) {
	                // Handle new files
                    console.log('FOUND, ' + file)
	            })
	            monitor.on("changed", function (file, curr, prev) {
	                // Handle file changes
	                console.log('CHANGED, ' + file)
	            })
	            monitor.on("removed", function (file, stat) {
	                // Handle removed files
	                console.log('REMOVED, ' + file)
	            })
	        })
        
	    return this;*/

		var queue = [];

		var check = function() {
			if ( queue.length === 0 ) {
				process.nextTick(this.done.bind(this));
			}
		};

		// Watch directory for removed/created files
		stalker.watch( this.options.directory, function( err, file ) {
			
			if (err) {
				return;
			}

			// File found
			var path = this.getRelativePath( file );

			// Add to queue list
			if ( this.isAccepted( file ) ) {
				queue.include( path );
			}

			this.found( path, function( fileFound ) {
				// File processed, remove from queue list
				queue.erase( fileFound );
				// Check if file queue is done
				check.call( this );
			});

		}.bind(this), function (err, file) {

			// File removed
			var path = this.getRelativePath( file );
			this.removed( path );

		}.bind(this) );

		return this;

	},

	/**
	 * Get the relative path from directory specified on options
	 *
	 * @param  {string} file  Full path of the file
	 * @return {string}       Relative path of the file
	 */
	getRelativePath: function( file ) {
		return path.relative( this.options.directory, file ).split( '\\' ).join( '/' );
	},


	/**
	 * Get the absolute path from directory specified on options
	 *
	 * @param  {string} file  Full path of the file
	 * @return {string}       Relative path of the file
	 */
	getAbsolutePath: function( file ) {
		return path.join( this.options.directory, file );
	},

	/**
	 * Filter to accept only files matched and not ignored
	 *
	 * @return {boolean} File is accepted
	 */
	isAccepted: function( file ) {
		return !minimatch( file, this.options.ignore ) && minimatch( file, this.options.match );
	},

	/**
	 * Filter array of accepted files
	 *
	 * @param  {array} files  Files array
	 * @return {array}        Mapped array of accepted files
	 */
	filter: function( files ) {
		return Array.from( files ).filter( function ( file ) {
			return this.isAccepted( file );
		}, this );
	},

	/**
	 * Found files (found by scan)
	 *
	 * @param  {string} file  File path that is found, to be added on file tree
	 * @return {object}       Class instance
	 */
	found: function( file, callback ) {
		callback = callback || function() {};

		if ( this.isAccepted( file ) ) {
			this.emit( 'fileFound', file );
			this.add( file, function( fileFound ) {
				this.fileProcessed( fileFound );
				callback.call( this, fileFound );
			});
		}

		return this;

	},

	/**
	 * Removed files (removed by scan)
	 *
	 * @param  {string} file  File path to be removed from file tree
	 * @return {object}       Class instance
	 */
	removed: function( file ) {

		if ( this.isAccepted( file ) ) {
			this.emit( 'fileRemoved', file );
			this.unwatch( file );
			this.dettach(file);

		    // Read input file
			var filePath = this.getAbsolutePath(file);
			var fileUrl = this.options.output + ("" + filePath).replace(/\\/g, "/");

			console.log('removing ' + fileUrl + ", user = " + this.options.user);

			request.del(
                fileUrl,
                {
                    'auth': {
                        'user': this.options.user,
                        'pass': this.options.pass
                    }
                }
            )
		}

		return this;

	},

	/**
	 * Verify if a file already exists
	 *
	 * @param  {string}    file  Path of the file
	 * @return {boolean}         Exists on the file tree
	 */
	exists: function( file ) {

		return this.files.hasOwnProperty( file );

	},

	/**
	 * Dettach from file tree
	 *stal
	 * @param {string}    file  Path of the file
	 */
	dettach: function( file ) {

		delete this.files[ file ];
		delete this.filesCache[ file ];

		return this;

	},
    
	/**
	 * Add files
	 *
	 * @param  {string}   file     File path
	 * @param  {Function} callback
	 *
	 * @return {object}              Class instance
	 */
	add: function( file, callback ) {

		callback = callback || function() {};

		callback.apply(this, [file, []]);

		return this;
	},

	/**
	 * Update a file after watch
	 *
	 * @param  {string}  file  File path
	 * @return {object}        Class instance
	 */
	update: function( file ) {
	    this.add(file, function (fileUpdated) {
            if (fs.existsSync(file)) {
			    this.emit( 'fileUpdated', file );
			    this.watch(file);

                // Read input file
		        var filePath = this.getAbsolutePath( file );
                var fileUrl = this.options.output + (""+filePath).replace(/\\/g,"/");
        
                if (fs.existsSync(file)) {
                    console.log('uploading to ' + fileUrl + ", user = " + this.options.user);

                    fs.createReadStream(filePath).pipe(
                        request.put(
                            fileUrl,
                            {
                                'auth': {
                                    'user': this.options.user,
                                    'pass': this.options.pass
                                }
                            }
                        ),
                        function (error, response, body) {
                            console.log('Sling responded with an error: ' + response.statusCode);
                            console.log(body);
                        }
                    );
                };
            } 
		});

		return this;
	},

	/**
	 * File processed
	 *
	 * @param  {string}  file  File path
	 * @return {object}        Class instance
	 */
	fileProcessed: function( file ) {
		this.emit( 'fileProcessed', file);
		this.watch( file );

		return this;
	},

	/**
	 * Done listing files
	 *
	 * @return {object} Class instance
	 */
	done: function() {
		this.emit( 'done' );

		return this;
	},
            
	/**
	 * Watch files
	 *
	 * @param  {string}  file  File path to watch
	 * @return {object}        Class instance
	 */
	watch: function (watchFile) {
	    // Verify file is already beign watched
	    if (!this.watchList.contains(watchFile)) {
	        fs.watchFile(this.getAbsolutePath(watchFile), { interval: this.options.interval }, function () {
	            this.update(watchFile);
	        }.bind(this));

	        this.watchList.include(watchFile);
	    }

		return this;
	},

	/**
	 * Unwatch a file
	 *
	 * @param  {string}  file  File path to unwatch
	 * @return {object}        Class instance
	 */
	unwatch: function( file ) {
		fs.unwatchFile( file );
		delete this.watchList[ file ];

		return this;
	}

});

exports = module.exports = new Monitor();