module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: ['dist/'],
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: ['public/js/*.js', 'public/js/controllers/*.js','public/js/services/*.js','public/js/directive/*.js' ],
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
        copy: {
            all: {
                files: [{
                    expand: true,
                    cwd: 'public/',
                    src: ['index.html'],
                    dest: 'dist/',
                    filter: 'isFile'
                },
                    {expand: true,cwd: 'public/', src: ['partials/*'], dest: 'dist/', filter: 'isFile'},
                    {expand: true,cwd: 'public/', src: ['js/lib/*'], dest: 'dist/', filter: 'isFile'},
                    {expand: true,cwd: 'public/', src: ['modals/*'], dest: 'dist/', filter: 'isFile'},
                    {expand: true,cwd: 'public/', src: ['css/*'], dest: 'dist/', filter: 'isFile'},
                    {expand: true,cwd: 'public/', src: ['js/directives/templates/*'], dest: 'dist/', filter: 'isFile'}]
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
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-processhtml');

    grunt.registerTask('build', ['clean','copy', 'concat', 'uglify','processhtml']);
};