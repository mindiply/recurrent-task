/**
 * Created by pfbongio on 21/11/2016.
 */

'use strict'

let expect = require('chai').expect
let {startRecurrentTask, recurrentTaskStats, stopRecurrentTask} = require('../lib')()

function createTestNoOp () {
    let runs = 0
    return {
        runs: () => { return runs },
        task: () => { runs++ }
    }
}

function createTestErrorOp (everyNRunsError) {
    let _runs = 0
    return {
        runs: () => { return _runs },
        task: () => {
            _runs++
            if (_runs & everyNRunsError === 0) {
                throw new Error('Oh no! error')
            }
        }
    }
}

describe('Recurrent task library', function () {

    describe('Normal behavior', function () {
        it('Run test for 5 times at least', function (done) {
            let noOps = createTestNoOp()
            startRecurrentTask('NOOP1', noOps.task, 30)
            setTimeout(() => {
                done()
                stopRecurrentTask('NOOP1')
                let stats = recurrentTaskStats('NOOP1')
                expect(stats.enabled).to.equal(false)
                expect(stats.interval).to.equal(30)
                expect(stats.failures).to.equal(0)
                expect(stats.run_times).to.be.at.least(5)
                expect(stats.run_times).to.equal(noOps.runs())
            }, 300)
        })
    })

    describe('Invalid parameters', function () {
        it('Invalid task parameter', function () {
            let exceptionFired = false
            try {
                startRecurrentTask('ERR1', 'Not a function', 500)
            } catch (err) {
                exceptionFired = true
            }
            stopRecurrentTask('ERR1')
            expect(exceptionFired).to.equal(true)
        })

        it('Invalid interval parameter', function () {
            let exceptionFired = false
            try {
                startRecurrentTask('ERR2', () => {})
            } catch (err) {
                exceptionFired = true
            }
            stopRecurrentTask('ERR2')
            expect(exceptionFired).to.equal(true)
        })
    })

    describe('Function with occasional failure', function () {
        it('Report errors but also good runs', function (done) {
            let errorOp = createTestErrorOp(3)
            startRecurrentTask('OERR1', errorOp.task, 30)
            setTimeout(() => {
                done()
                stopRecurrentTask('OERR1')
                let stats = recurrentTaskStats('OERR1')
                expect(stats.enabled).to.equal(false)
                expect(stats.interval).to.equal(30)
                expect(stats.failures).to.be.at.least(1)
                expect(stats.run_times).to.be.at.least(4)
                expect(noOps.runs()).to.be.at.least(stats.run_times)
            }, 300)
        })
    })
})
