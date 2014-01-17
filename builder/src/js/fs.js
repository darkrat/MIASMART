/*
 * Rapid Interface Builder (RIB) - A simple WYSIWYG HTML5 app creator
 * Copyright (c) 2011-2012, Intel Corporation.
 *
 * This program is licensed under the terms and conditions of the
 * Apache License, version 2.0.  The full text of the Apache License is at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 */
"use strict";

window.BlobBuilder = window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder;
window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
window.resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;
window.storageInfo = window.storageInfo || window.webkitStorageInfo;


/**
 * Global object to access File System utils.
 *
 */
$(function() {
    var fsUtils = {
    defaultTarget: 'export-target',
    fsType: window.PERSISTENT,
    fsSize: 20*1024*1024,
    fs:null,
    deferredOperations:[],

    /**
     * Init the sandbox file system .
     *
     * @param {enum} type The value could be "window.TEMPORARY" or "window.PERSISTENT".
     * @param {number} size The required size for the file system.
     */
    initFS: function (type, size, success, error) {
        var onError = error || fsUtils.onError;
        // Create a temporary sandbox filesystem
        if (storageInfo && requestFileSystem) {
            storageInfo.requestQuota(type, size, function(grantedBytes){
                requestFileSystem(type, grantedBytes, function(filesystem) {
                    fsUtils.fs = filesystem;
                    console.log("A sandbox filesystem: "+ fsUtils.fs.name + " is created;");
                    console.log(fsUtils.fs.name + " type: " + type + ", size: " + size );
                    // Create a default target window and append it
                    // to the document.body
                    if (!$('iframe#'+fsUtils.defaultTarget).length) {
                        $('<iframe></iframe>')
                    .attr('id', fsUtils.defaultTarget)
                    .css('display', 'none')
                    .appendTo('body');
                    }
                    if(success) {
                        success(filesystem);
                    }
                    while (fsUtils.deferredOperations.length > 0) {
                        var op = fsUtils.deferredOperations.shift();
                        op.op.apply(this, op.arg);
                    }
                }, onError);
            }, onError);
        }else{
            console.log("File System Not Available");
        }
    },

    /**
     * Error event callback.
     *
     * NOTE: "Using the HTML5 Filesystem API" by Eric Bidelman (O’Reilly).
     *       Copyright 2011 Eric Bidelman, 978-1-449-30945-9
     *
     * @param {FileError} err The error event.
     */
    onError: function (err) {
                 var msg = 'Error: ';
                 switch (err.code) {
                     case FileError.NOT_FOUND_ERR:
                         msg += 'File or directory not found';
                         break;
                     case FileError.SECURITY_ERR:
                         msg += 'Insecure or disallowed operation';
                         break;
                     case FileError.ABORT_ERR:
                         msg += 'Operation aborted';
                         break;
                     case FileError.NOT_READABLE_ERR:
                         msg += 'File or directory not readable';
                         break;
                     case FileError.ENCODING_ERR:
                         msg += 'Invalid encoding';
                         break;
                     case FileError.NO_MODIFICATION_ALLOWED_ERR:
                         msg += 'Cannot modify file or directory';
                         break;
                     case FileError.INVALID_STATE_ERR:
                         msg += 'Invalid state';
                         break;
                     case FileError.SYNTAX_ERR:
                         msg += 'Invalid line-ending specifier';
                         break;
                     case FileError.INVALID_MODIFICATION_ERR:
                         msg += 'Invalid modification';
                         break;
                     case FileError.QUOTA_EXCEEDED_ERR:
                         msg += 'Storage quota exceeded';
                         break;
                     case FileError.TYPE_MISMATCH_ERR:
                         msg += 'Invalid filetype';
                         break;
                     case FileError.PATH_EXISTS_ERR:
                         msg += 'File or directory already exists at specified path';
                         break;
                     default:
                         msg += 'Unknown Error';
                         break;
                 }
                 console.log(msg);
             },

    /**
     * Transfer string path to URL.
     *
     * @param {string} path The string path needs to be transferred.
     *
     * @return {url} url referring to the path.
     */
    pathToUrl: function (path){
                   if(typeof path !== "string"){
                       console.log("String type is needed for file which is to be read.");
                       return false;
                   }
                   var url = fsUtils.fs.root.toURL() + path;
                   return url;
               },

    /**
     * Transfer string path to Entry(FileEntry or DurectirtEntry).
     *
     * @param {string} path The string path needs to be transferred.
     * @param {function(Entry)=} opt_successCallback An optional
     * @param {function(FileError)=} opt_errorCallback An optional
     *
     * success callback passed the Entry referring to path.
     * error callback passed the generated error.
     */
    pathToEntry: function (path, success, error) {
                     var url = fsUtils.pathToUrl(path);
                     var onError = error || fsUtils.onError;
                     resolveLocalFileSystemURL(url, function (entry) {
                         success(entry);
                     }, onError);
                 },

    /**
     * Get all the Entries in a given path.
     *
     * @param {string} path The given string path.
     * @param {function(Array)=} opt_successCallback An optional
     * @param {function(FileError)=} opt_errorCallback An optional
     *
     * success callback passed a Array of Entries included in the path.
     * error callback passed the generated error.
     */
    ls: function (path, success, error) {
            var dstPath = path || "/",
            onError = error || fsUtils.onError;

            fsUtils.fs.root.getDirectory(dstPath, {}, function (dirEntry) {
                var dirReader = dirEntry.createReader();
                dirReader.readEntries(function (entries) {
                    success(entries);
                }, onError);
            }, onError);
        },

    /**
     * Create a file. If the file is already exist, an error will be generated.
     *
     * @param {string} filePath The given file path needs to be created.
     * @param {function(FileEntry)=} opt_successCallback An optional
     * @param {function(FileError)=} opt_errorCallback An optional
     *
     * success callback passed the FileEntry referring to the new file.
     * error callback passed the generated error.
     */
    touch: function (filePath, success, error){
               var onError = error || fsUtils.onError;
               fsUtils.fs.root.getFile(filePath, {create: true, exclusive: true}, function(fileEntry) {
                   console.log(fileEntry.fullPath + " is created.");
                   // pass the fileEntry to the success handler
                   if(success){
                       success(fileEntry);
                   }
               }, onError);
           },

    /**
     * Read a file.
     *
     * @param {string} path The given file path needs to be read.
     * @param {function(string)=} opt_successCallback
     * @param {function(FileError)=} opt_errorCallback An optional
     *
     * success callback passed the contents of the file.
     * error callback passed the generated error.
     */
    read: function (path, success, error){
              var onError = error || fsUtils.onError;

              fsUtils.pathToEntry(path, function(fileEntry) {
                  // Obtain the File object representing the FileEntry.
                  // Use FileReader to read its contents.
                  fileEntry.file(function(file) {
                      var reader = new FileReader();

                      reader.onloadend = function(e) {
                          success(e.target.result);
                      };
                      reader.onError = onError;

                      reader.readAsText(file); // Read the file as plaintext.

                  }, onError);
              }, onError);
          },

    /**
     * Write contents to a file.
     * If the file not exist, a new file will be created.
     * If the file already exist, it will overwrite it.
     *
     * @param {string} path The given file path needs to be writed into.
     * @param {string} contents Data needs to be written into the file.
     * @param {function(string)=} opt_successCallback An optional
     * @param {function(FileError)=} opt_errorCallback An optional
     * @param {bool} opt_append Flag for append mode An optinal
     * @param {bool} binary Flag for writing binary contents An optinal
     *
     * success callback passed the FileEntry referring to the file.
     * error callback passed the generated error.
     */
    write: function (path, contents, success, error, opt_append, binary){

               var onError = error || fsUtils.onError;
               function write(fileEntry) {
                   fileEntry.createWriter(function (fileWriter) {
                       var bb = new BlobBuilder(); // Create a new Blob on-the-fly.

                       fileWriter.onwriteend = function (progressEvent) {
                           success && success(fileEntry);
                       };
                       fileWriter.onerror = onError;

                       if (opt_append) {
                           fileWriter.seek(fileWriter.length);
                       }

                       var mimeString = "text/plain";
                       if (binary) {
                           // write the bytes of the string to an ArrayBuffer
                           var ab = new ArrayBuffer(contents.length);
                           var ia = new Uint8Array(ab);
                           for (var i = 0; i < contents.length; i++) {
                               ia[i] = contents.charCodeAt(i);
                           }
                           // write the ArrayBuffer to a blob, and you're done
                           bb.append(ab);
                           mimeString = "";
                       }
                       else
                           bb.append(contents);
                       fileWriter.write(bb.getBlob(mimeString));

                   }, onError);
               }

               fsUtils.pathToEntry(path, function (fileEntry) {
                   if (opt_append) {
                       write(fileEntry);
                   } else {
                       fsUtils.rm(path, function (){
                           fsUtils.touch(path, write, error);
                       }, onError);
                   }
               }, function (e) {
                   if (e.code === FileError.NOT_FOUND_ERR) {
                       fsUtils.touch(path, write, onError);
                   } else {
                       onError(e);
                   }
               });
           },

    /**
     * Copy a file or directory to another one.
     *
     * @param {string} from Srting path for the original full path.
     * @param {string} to The destination full path.
     * @param {function(DirectoryEntry)=} opt_successCallback An optional
     * @param {function(FileError)=} opt_errorCallback An optional
     *
     * success callback passed the updated directory.
     * error callback passed the generated error.
     */
    cp: function (from, to, success, error) {
            var onError = error || fsUtils.onError;
            var path = to.replace(/^\//, "").split("/"),
                fileName = path.splice(path.length - 1, 1).toString();

            fsUtils.pathToEntry(from, function (entry) {
                fsUtils.pathToEntry(path.length > 0 ? path.join("/") : "/", function (dest) {
                    entry.copyTo(dest, fileName, function (finalDestination) {
                        if(success){
                            success(finalDestination);
                        }
                    }, onError);
                });
            });
        },

    /**
     * Moves a file or directory to another one.
     * "from" and "to" should both be files or both be directories.
     *
     * @param {string} original file or directory.
     * @param {string} destination file or directory.
     * @param {function(DirectoryEntry)=} opt_successCallback An optional
     * @param {function(FileError)=} opt_errorCallback An optional
     *
     * success callback passed the updated directory.
     * error callback passed the generated error.
     */
    mv: function (from, to, success, error) {
            var onError = error || fsUtils.onError;
            var path = to.replace(/^\//, "").split("/"),
                newName = path.splice(path.length - 1, 1).toString();

            fsUtils.pathToEntry(from, function (entry) {
                fsUtils.pathToEntry(path.length > 0 ? path.join("/") : "/", function (dest) {
                    entry.moveTo(dest, newName, function (finalDestination) {
                        if(success){
                            success(finalDestination);
                        }
                    }, onError);
                });
            });
        },

    /**
     * Remove a file or directory.
     *
     * @param {string} path String path referring to the file or directory needs to be removed.
     * @param {function(null)=} opt_successCallback An optional
     * @param {function(FileError)=} opt_errorCallback An optional
     * @param {Bool} opt_recursive Recursive flag for directory
     *
     * success callback passed null.
     * error callback passed the generated error.
     */
    rm: function (path, success, error, opt_recursive) {
            var onError = error || fsUtils.onError;
            fsUtils.fs.root[opt_recursive ? "getDirectory" : "getFile"](path, {create: false}, function (entry) {
                entry[opt_recursive ? "removeRecursively" : "remove"](function () {
                    console.log(path + ' is removed.');
                    if(success){
                        success();
                    }
                }, onError);
            }, onError);
        },

    /**
     * Create a directory.
     *
     * @param {string} path String path referring to the directory needs to be created.
     * @param {function(DirectoryEntry)=} opt_successCallback An optional
     * @param {function(FileError)=} opt_errorCallback An optional
     *
     * success callback passed DirectoryEntry referring to the new Dir.
     * error callback passed the generated error.
     */
    mkdir: function (path, success, error) {
               var onError = error || fsUtils.onError;
               fsUtils.fs.root.getDirectory(path, {create: true}, function (dirEntry) {
                   console.log(path + ' is created.');
                   if(success){
                       success(dirEntry);
                   }
               }, onError);
           },

    /**
     * Copy a local storage file into the sandbox file system.
     *
     * @param {FileEntry} localFileEntry The file entry referring to the local storage file.
     * @param {string} dest The string path referring to the destination file.
     *                      An optional, if "dest" is null, the new file will have the same name with the orginal one.
     * @param {function(FileEntry)=} opt_successCallback An optional
     * @param {function(FileError)=} opt_errorCallback An optional
     *
     * success callback passed FileEntry referring to the new file in the sandbox file system.
     * error callback passed the generated error.
     */
    cpLocalFile: function (localFileEntry, dest, success, error){
                     var onError = error || fsUtils.onError;
                     var path;
                     if(!localFileEntry){
                         console.log("There is no local file to be copied.");
                         return false;
                     }
                     // if dest is null, or its type is not string, orginal file name will be used.
                     var destFileName = localFileEntry.name;
                     if(dest !== null && typeof dest == "string"){
                         path = dest.replace(/^\//, "").split("/");
                         destFileName = path.splice(path.length - 1, 1).toString();
                         path = path.length > 0 ? path.join("/") : "/";
                     }
                     path = path || "/";
                     // write the contents to the new fileEntry
                     function write(fileEntry) {
                         fileEntry.createWriter(function(fileWriter) {
                             //set the write end handler
                             fileWriter.onwriteend = function(e) {
                                 console.log('Copy local file to sandbox completed.');
                                 if(success){
                                     success(fileEntry);
                                 }
                             };

                             fileWriter.onError = function(e) {
                                 console.log('Write failed: ' + e.toString());
                                 onError(e);
                             };

                             fileWriter.write(localFileEntry); // Note: write() can take a File or Blob object.

                         }, onError);
                     }
                     // if the dest file is already exist, it will be removed, and then create a new file.
                     fsUtils.rm(path+destFileName, function (){
                         fsUtils.touch(path+destFileName, write, onError);
                     }, function (e) {
                         console.log("in error rm");
                         if (e.code === FileError.NOT_FOUND_ERR) {
                             fsUtils.touch(path+destFileName, write, onError);
                         } else {
                             onError(e);
                         }
                     }, false);
                 },

    /**
     * Export file to a blank site: open the URL of the file in a blank site for items in "Export"
     * @param {string} path of the exporting file.
     *
     */
    exportToBlank: function (path) {
                       var url = fsUtils.pathToUrl(path),
                       blocked = false, exportWindow,
                       options = "height=200, width=500, top=10, left=10, resizable=yes";
                       try {
                           exportWindow = window.open(url, "_blank", options);
                           if (!exportWindow) {
                               blocked = true;
                           }
                       } catch(e) {
                           blocked = true;
                       }
                       if (blocked) {
                           alert("Export window was blocked!");
                       }
                   },

    /**
     * Export file to specified target window: open the URL of the file in
     * target window, or new, blank one, if it does not exists
     * @param {string} target window to load the file into.
     * @param {string} path of the exporting file.
     *
     */
    exportToTarget: function (path, target) {
                        var url = fsUtils.pathToUrl(path),
                        blocked = false, exportWindow;

                        // Allow unspecified targets by using our defaultTarget
                        target = target || fsUtils.defaultTarget;

                        try {
                            exportWindow = window.open(url, target);
                            if (!exportWindow) {
                                blocked = true;
                            }
                        } catch(e) {
                            blocked = true;
                        }
                        if (blocked) {
                            alert("Export window was blocked!");
                        }
                    },
    },

        /**
         * Global object to add and set cookies.
         *
         */
        cookieUtils = {
            /**
             * Get value of the given name cookie record
             *
             * @param {string} name The string name of the cookie record.
             *
             * @return {string} value The value of the cookie record or null if failed.
             */
            get:function (name) {
                    var cookies, record, value = null, i;
                    if(typeof name !== "string") {
                        console.error("Invalid cookie name.");
                        return value;
                    }
                    if(document.cookie && document.cookie !== "") {
                        // split cookie records
                        cookies = document.cookie.split(';');

                        for(i = 0; i < cookies.length; i++) {
                            record = $.trim(cookies[i]);
                            // find the record matchs the name
                            if(record.substring(0, name.length + 1) === (name + '=')) {
                                // get the value
                                value = decodeURIComponent(record.substring(name.length + 1));
                                break;
                            }
                        }
                    } else {
                        console.warn("Don't support cookie or empty cookie.");
                    }
                    return value;
                },

            /**
             * Set a pair of name-value into document.cookie
             *
             * @param {string} name The string name of the cookie record.
             * @param {string} value The string value of the cookie record.
             *
             * @return {bool} set cooke success or not.
             */
            set: function (name, value, expires) {
                     var text;
                     if(typeof name !== "string" || typeof value !== "string") {
                         console.error("Invalid cookie name or value.");
                         return false;
                     }
                     text = encodeURIComponent(name) + "=" + encodeURIComponent(value);
                     if(expires instanceof Date) {
                         text += "; expires=" + expires.toGMTString();
                     }
                     document.cookie = text;
                     if(document.cookie && document.cookie !== "") {
                         return true;
                     } else {
                         console.warn("Failed to set cookie.");
                         return false;
                     }
                 }
        };

    /*******************  export fsUtils and cookieUtils to $.rib **********************/
    $.rib = $.rib || {};
    $.each(["ls", "touch","rm","mkdir", "read", "write"], function (i, opName) {
        var oldOp = fsUtils[opName];
        fsUtils[opName] = function () {
            if (fsUtils.fs === null)
            {
                fsUtils.deferredOperations.push({op:oldOp, arg:arguments});
                return;
            }
            else
                return oldOp.apply(this, arguments);
        };
    });
    $.rib.fsUtils = fsUtils;
    $.rib.cookieUtils = cookieUtils;
});
