var _ = require('underscore');
var fs = require('fs');
var querystring = require('querystring');
var url = require('url');
var util = require('util');
var yargs = require('yargs');

var HttpError = require('../errors/http');
var ValidationError = require('../errors/validation');

var ArgsUtil = require('./util/args');
var RestUtil = require('oae-rest/lib/util');

var _yargs = new yargs()
        .usage('Usage: import-file <path (e.g., "/api/journals/import")> --file=<file> [--tenant=<tenant alias>]')

        .alias('F', 'file')
        .describe('F', 'The file to import')

        .alias('t', 'tenant')
        .describe('t', 'The tenant where the file needs to be imported in');

/**
 * Return a function that gets a stream to a file in the 'data' directory of the current test directory
 *
 * @param  {String}     filename    The name of the file in the test data directory to be loaded
 * @return {Function}               A function that, when executed without parameters, returns a stream to the file in the test data directory with the provided filename
 */
var getDataFileStream = function(file) {
    return function() {
        return fs.createReadStream(file);
    };
};

module.exports = {
    'description': 'Import a file',
    'help': _yargs.help(),
    'invoke': function(session, args, callback) {
        var restCtx = session.env('current').ctx;
        var argv = _yargs.parse(args);

        // Check if a valid API endpoint has been specified
        if (!ArgsUtil.string(argv._[0])) {
            throw new ValidationError('path', 'Must specify a request path (e.g., "/api/journals/import")', _yargs.help());
        }

        var parsed = null;
        try {
            parsed = url.parse(argv._[0]);
        } catch (ex) {
            throw new ValidationError('path', 'Provided path failed to be parsed as a URL', ex.stack);
        }

        // Create a request options object
        var opts = {};

        // Check if a tenant has been specified
        if (argv.t) {
            opts.tenantAlias = argv.t;
        }

        // Check if a file has been specified
        if (!argv.F) {
            throw new ValidationError('F', 'Must use the "F" parameter to specify the file to import', _yargs.help());
        } else {

            opts.file = getDataFileStream(argv.F);
            RestUtil.RestRequest(restCtx, parsed.pathname, 'POST', opts, function(err, body, response) {
                if (err) {
                    throw new HttpError(err.code, err.msg);
                }

                if (_.isString(body)) {
                    console.log(body);
                } else {
                    console.log(JSON.stringify(body, null, 2));
                }

                return callback();
            });
        }
    }
};
