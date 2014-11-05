module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: ['dist/'],
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: ['public/js/*.js', 'public/js/controllers*.js','public/js/services/*.js' ],
                dest: 'dist/js/<%= pkg.name %>.js'
            }
        },
        uglify:{
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'dist/js/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
                }
            }
        },
        jshint: {
            files: ['*.js'],
            options: {
                "globals":{
                    "angular": true
                }
            }
        },
        copy: {
            all: {
                files: [{
                    expand: true,
                    cwd: 'public/',
                    src: ['index.html', 'sampleTeams.json'],
                    dest: 'dist/',
                    filter: 'isFile'
                },
                    {expand: true,cwd: 'public/', src: ['partials/*'], dest: 'dist/', filter: 'isFile'},
                    {expand: true,cwd: 'public/', src: ['js/lib/*'], dest: 'dist/', filter: 'isFile'},
                    {expand: true,cwd: 'public/', src: ['modals/*'], dest: 'dist/', filter: 'isFile'},
                    {expand: true,cwd: 'public/', src: ['css/*'], dest: 'dist/', filter: 'isFile'},
                    {expand: true,cwd: 'public/', src: ['bower.json'], dest: 'dist/'}]
            }
        },
        "bower-install-simple": {
            options: {
                cwd: 'dist',
                color: true
            },
            "prod": {
                production: true
            }
        },
        processhtml: {
            dist: {
                files: {
                    'dist/index.html': ['public/index.html']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks("grunt-bower-install-simple");
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-processhtml');

    grunt.registerTask('default', 'bower-install-simple');
    grunt.registerTask('travis', ['clean','copy','jshint', 'concat', 'uglify','processhtml','bower-install-simple']);
};