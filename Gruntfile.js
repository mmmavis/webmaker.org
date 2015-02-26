module.exports = function (grunt) {
  require('time-grunt')(grunt);
  require('jit-grunt')(grunt, {
    shell: 'grunt-shell-spawn',
    express: 'grunt-express-server',
    gettext_finder: 'grunt-gettext-finder'
  });

  // Node and client side JS have slightly different JSHint directives
  // We'll create 2 versions with .jshintrc as a baseline
  var browserJSHint = grunt.file.readJSON('.jshintrc');
  var nodeJSHint = grunt.file.readJSON('.jshintrc');

  // Don't throw errors for expected Node globals
  nodeJSHint.node = true;

  // Don't throw errors for expected browser globals
  browserJSHint.browser = true;

  var clientSideJS = [
    'public/js/**/*.js',
    '!public/js/lib/**'
  ];

  var nodeJS = [
    'Gruntfile.js',
    'app.js',
    'lib/**/*.js',
    'routes/**/*.js',
    'test/**/*.js'
  ];

  var dependencies = [
    'bower_components/jquery/jquery.js',
    'bower_components/web-literacy-client/dist/web-literacy-client.with-langs.js',
    'bower_components/makeapi-client/src/make-api.js',
    'bower_components/selectize/dist/js/standalone/selectize.js',
    'bower_components/webmaker-analytics/analytics.js',

    'bower_components/angular/angular.js',

    'bower_components/makeapi-angular/src/makeapi-angular.js',
    'bower_components/makeapi-angular/dist/makeapi-angular.templates.js',

    'bower_components/angular-bootstrap/ui-bootstrap.js',
    'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',

    'bower_components/ngScrollSpy/dist/ngScrollSpy.js',
    'bower_components/angular-resource/angular-resource.js',
    'bower_components/angular-route/angular-route.js',
    'bower_components/angular-sanitize/angular-sanitize.js',
    'bower_components/moment/min/moment+langs.min.js',
    'bower_components/angular-moment/angular-moment.min.js',
    'bower_components/webmaker-login-ux/dist/ngWebmakerLogin.js',
    'bower_components/webmaker-login-ux/dist/templates/ngWebmakerLogin.templates.js',

    'bower_components/imagesloaded/imagesloaded.pkgd.js',
    'bower_components/masonry/dist/masonry.pkgd.js',

    'bower_components/angular-markdown-filter/markdown.js',
    'bower_components/showdown/compressed/Showdown.js'
  ];

  var allJS = clientSideJS.concat(nodeJS);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jsbeautifier: {
      modify: {
        src: allJS,
        options: {
          config: '.jsbeautifyrc'
        }
      },
      verify: {
        src: allJS,
        options: {
          mode: 'VERIFY_ONLY',
          config: '.jsbeautifyrc'
        }
      }
    },
    jsonlint: {
      json: {
        src: ['bower.json', 'package.json', 'public/data/*.json']
      }
    },
    jshint: {
      browser: {
        src: clientSideJS,
        options: browserJSHint
      },
      node: {
        src: nodeJS,
        options: nodeJSHint
      }
    },
    gettext_finder: {
      files: ["views/*.html", "views/**/*.html"],
      options: {
        pathToJSON: ["locale/en_US/webmaker.org.json",
                     "locale/en_US/localweb.json"
                    ],
        ignoreKeys: grunt.file.readJSON("gtf-ignored-keys.json")
      },
    },
    angular_i18n_finder: {
      files: ["public/views/*.html", "public/views/**/*.html"],
      options: {
        format: "chromeI18n",
        pathToJSON: ["locale/en_US/appmaker.json",
                      "locale/en_US/badges.json",
                      "locale/en_US/explore.json",
                      "locale/en_US/feedback.json",
                      "locale/en_US/make-your-own.json",
                      "locale/en_US/mentor.json",
                      "locale/en_US/music-video.json",
                      "locale/en_US/private-eye.json",
                      "locale/en_US/remix-your-school.json",
                      "locale/en_US/resources.json",
                      "locale/en_US/signup.json",
                      "locale/en_US/tools.json",
                      "locale/en_US/user-box.json"
                    ],
        ignoreKeys: grunt.file.readJSON("angular-i18n-ignoreKeys.json")
      },
    },
    imagemin: {
      options: {
        optimizationLevel: 7,
        pngquant: false
      },
      primary: {
        files: [{
          expand: true,
          cwd: "public/img/",
          src: ["**/*.{png,jpg,gif}"],
          dest: "public/img/"
        }]
      }
    },
    uglify: {
      app: {
        options: {
          sourceMap: true,
          mangle: false
        },
        files: {
          'public/compiled/dependencies.min.js': dependencies,
          'public/compiled/app.min.js': ['public/js/angular/**/*.js', 'lib/badges-permissions-model.js'],
        },
      },
      prod: {
        options: {
          sourceMap: false,
          mangle: false
        },
        files: {
          'public/compiled/dependencies.min.js': dependencies,
          'public/compiled/app.min.js': ['public/js/angular/**/*.js', 'lib/badges-permissions-model.js'],
        },
      },
    },

    watch: {
      angular: {
        files: ['public/js/angular/**/*.js', 'lib/badges-permissions-model.js'],
        tasks: ['uglify:app'],
        options: {
          spawn: false
        }
      },
      node: {
        files: ['routes/**/*.js', 'lib/**/*.js', 'app.js', 'less/**/*', 'locale/**/*.json', 'views/**/*.html'],
        tasks: ['express:dev'],
        options: {
          spawn: false
        }
      }
    },

    express: {
      dev: {
        options: {
          script: 'app.js',
          node_env: 'DEV',
          port: ''
        }
      }
    },

    shell: {
      smokeTest: {
        options: {
          stdout: true,
          failOnError: true
        },
        command: 'phantomjs test/phantomjs/psmoke.js'
      }
    }
  });

  // For building angular js
  grunt.registerTask('build', ['uglify:prod']);

  grunt.registerTask('clean', ['jsbeautifier:modify']);

  grunt.registerTask('dev', ['uglify:app', 'express', 'watch']);

  // Clean & verify code (Run before commit)
  grunt.registerTask('default', ['clean', 'jshint', 'jsonlint', 'imagemin']);

  // Verify code (Read only)
  grunt.registerTask('validate', ['jsbeautifier:verify', 'jshint', 'gettext_finder', 'jsonlint', 'angular_i18n_finder']);

  // Run through all pages and test for JS errors
  // * Requires global install of PhantomJS *
  grunt.registerTask('smoke', 'shell:smokeTest');

};
