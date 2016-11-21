/**
 * Created by pfbongio on 21/11/2016.
 */

'use strict'
let _ = require('lodash')

module.exports = (options = {}) => {
    let recurrentTasks = {}
    let logOption = options.log ? options.log : 'RECURRENT-TASK-LIB'
    let log = require('@bongione/bunyan4lib')(logOption)

    /**
     * Starts running a named task at the specified interval
     *
     * @param taskName The name of the task
     * @param task Function to be run at the specified interval
     * @param interval Number of ms between task runs
     */
    function startRecurrentTask (taskName, task, interval) {
        if (typeof task !== 'function') throw new Error('task should be a function')
        if (typeof interval !== 'number') throw new Error('interval should be a integer')

        if (!(taskName in recurrentTasks)) {
            recurrentTasks[taskName] = {
                task_name: taskName,
                task,
                interval,
                enabled: false,
                running: false,
                timer_id: null,
                failures: 0,
                run_attempts: 0,
                run_times: 0
            }
        }
        let recurrentTask = recurrentTasks[taskName]
        if (recurrentTask.enabled) {
            if (recurrentTask.timer_id) {
                clearInterval(recurrentTask.timer_id)
                recurrentTask.timer_id = null
            }
            if (recurrentTask.running) {
                log.info('Abandoning running of task type' + taskName)
                recurrentTask.running = false
            }
        }
        recurrentTask.enabled = true
        recurrentTask.interval = interval
        recurrentTask.timer_id = setInterval(() => {
            runRecurrentTask(recurrentTask)
        }, interval)
    }

    /**
     * Stop running the recurrent task with the provided identifier.
     *
     * A warning is logged if no task with that identifier is found
     *
     * @param recurrentTask the name of the task to stop
     */

    function stopRecurrentTask (taskName) {
        if (!(taskName in recurrentTasks)) {
            log.warn({task_name: taskName}, 'Task name does not run')
            return
        }
        let recurrentTask = recurrentTasks[taskName]
        if (recurrentTask.timer_id) clearInterval(recurrentTask.timer_id)
        recurrentTask.timer_id = null
        recurrentTask.enabled = false
        if (recurrentTask.running) {
            recurrentTask.running = false
            log.info(recurrentTask, 'Cleared recurrent task while it was running')
        }
        recurrentTask.failures = 0
    }

    function runRecurrentTask (recurrentTask) {
        try {
            if (!recurrentTask.enabled) return
            if (recurrentTask.running) {
                recurrentTask.run_attempts++
                if ((recurrentTask.run_attempts) % 10 === 0) {
                    log.warn('Hanging recurrent task: ' + recurrentTask.task_name)
                }
                return
            }
            recurrentTask.running = true
            recurrentTask.run_attempts = 0
            recurrentTask.task()
            recurrentTask.running = false
            recurrentTask.run_times++
        } catch (err) {
            recurrentTask.running = false
            recurrentTask.failures++
            log.warn(err, 'While running task')
            if (recurrentTask.failures % 10 === 0) {
                log.error({
                    err,
                    name: recurrentTask.task_name
                }, 'Repeatedly failing on task')
            }
        }
    }

    /**
     * Returns the statistics of the task identified by the name passed as parameter
     *
     * The stats are
     * - enabled: Whether the task is currently enabled or not
     * - interval: Current interval in ms between runs of the task
     * - failures: Times the task generated an exception while running
     * - run_times: How many times the task has run to completion
     * - running: Whether the task is currently running or not
     *
     * If the task is not present, default values are returned and enabled is set to false
     *
     * @param taskName
     * @returns {{interval: number, failures: number, run_times: number, running: boolean}}
     */
    function recurrentTaskStats (taskName) {
        if (taskName in recurrentTasks) {
            return _.pick(recurrentTasks[taskName], ['enabled', 'interval', 'failures', 'run_times', 'running'])
        } else {
            return {
                enabled: false,
                interval: 0,
                failures: 0,
                run_times: 0,
                running: false
            }
        }
    }

    return {
        startRecurrentTask,
        stopRecurrentTask,
        recurrentTaskStats
    }
}
