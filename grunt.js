module.exports = function(grunt){
    grunt.initConfig({
       lint: {
           files: ['**.js']
       }
    });

    grunt.registerTask('default', 'lint');
    grunt.registerTask('travis', 'lint');
}