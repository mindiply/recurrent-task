# recurrent-task
Start named task that repeat at the same interval, with some logging of how 
they're performing

# Install

~~~
npm install @bongione/recurrent-task
~~~

# Usage

To use the library

~~~

let {startRecurrentTask, stopRecurrentTask} = require('@bongione/recurrent-task')

function myRecurrentTask() {
    // Do something useful
}   

// Run the task every 10 minutes
startRecurrentTask('NAME_OF_TASK', myRecurrentTask, 10 * 60 * 1000)

process.on('SIGINT', () => {
    recurrent_tasks.stopRecurrentTask('NAME_OF_TASK')
})


~~~


# License

Apache 2.0
