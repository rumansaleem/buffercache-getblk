import {
    STATUS_IDLE,
    STATUS_RUNNING,
    STATUS_SLEEPING,
    STATUS_WAITING_FOR_ANY_BUFFER,
    STATUS_WAITING_FOR_SPECIFIC_BUFFER,
} from '../constants';

let createIORequest = (id, blockNumber, io_type, data = null) => ({
    id,
    blockNumber,
    data,
    type: io_type,
    buffer: null,
    written: false,
    completed: false,
});

let createProcess = (pid, name = '', requests = []) => ({
    pid: pid,
    name: name || `Process ${pid}`,
    runningRequest: null,
    queuedRequests: requests || [],
    completedRequests: [],
    status: STATUS_IDLE,
    newRequestId: 1,
});

const state = {
    all: [],
    newProcessId: 1,
};

const getters = {
    processById: (state) => (pid) => state.all[pid],
    isRunning: () => process => process.status == STATUS_RUNNING,
    isWaitingForBuffer: () => process => {
        return process.status == STATUS_WAITING_FOR_ANY_BUFFER ||
            process.status.startsWith(STATUS_WAITING_FOR_SPECIFIC_BUFFER(null));
    },
    isWaitingForSpecificBuffer: () => process => {
        return process.status.startsWith(STATUS_WAITING_FOR_SPECIFIC_BUFFER(null));
    },
    getSpecificBufferId: (_, getters) => process => {
        if (!getters.isWaitingForSpecificBuffer(process)) {
            return false;
        }
        const index = process.status.search(/[0-9]+$/);
        return parseInt(process.status.substring(index));
    },
    isIdle: () => process => {
        return process.status == STATUS_IDLE;
    },
    isSleeping: () => process => {
        return process.status == STATUS_SLEEPING;
    },
    canRun: (_, getters) => process => {
        return getters.isSleeping(process);
    },
    statusText: (_, getters) => process => {
        if(getters.isRunning(process)) {
            return 'Running...';
        }
        if (getters.isSleeping(process)) {
            return 'Sleeping! ZzZzZ...';
        }
        if (getters.isIdle(process)) {
            return 'Idle! No requests to perform';
        }
        if (getters.isWaitingForSpecificBuffer(process)) {
            return `Waiting for Buffer with ID -  "${getters.getSpecificBufferId(process)}"`
        }
        if (getters.isWaitingForBuffer(process)) {
            return 'Waiting for any free Buffer';
        }
        return 'Unknown State';
    },
    activeRequestsByProcess: () => (process) => ([
        process.runningRequest, 
        ...process.queuedRequests,
    ].filter(req => req)),

};

const mutations = {
    initialise(state, count) {
        Array.from(Array(count).keys()).forEach(() => {
            state.all.push(createProcess(state.newProcessId++));
        });
    },

    enqueueRequest(state, {process, blockNumber, type, data}) {
        process.queuedRequests.push(
            createIORequest(process.newRequestId++, blockNumber, type, data)
        );
    },

    startQueuedRequest(state, process) {
        process.runningRequest = process.queuedRequests.shift();
        process.runningRequest.started = true;
    },

    completeRunningRequest(state, process) {
        process.runningRequest.completed = true
        process.completedRequests.push(process.runningRequest);
        process.runningRequest = null;
    },

    createNewProcess(state, name = '') {
        state.all.push(createProcess(state.newProcessId++, name));
    },

    ASSIGN_BUFFER_TO_REQUEST(state, {process, buffer}) {
        process.runningRequest.buffer = buffer;
    },

    REQUEST_WRITTEN(state, process) {
        process.runningRequest.written = true;
    },

    SET_IDLE(state, process) {
        process.status = STATUS_IDLE;
    },

    SET_SLEEPING(state, process) {
        process.status = STATUS_SLEEPING;
    },
    SET_RUNNING(state, process) {
        process.status = STATUS_RUNNING;
    },
    WAIT_FOR_ANY_BUFFER(state, process) {
        process.status = STATUS_WAITING_FOR_ANY_BUFFER
    },
    WAKE_WAITING_FOR_ANY_BUFFER(state) {
        state.all.filter(
            process => process.status != STATUS_WAITING_FOR_ANY_BUFFER
        ).forEach(process => process.status = STATUS_SLEEPING);
    },
    WAIT_FOR_SPECIFIC_BUFFER(state, {process, buffer}) {
        process.status = STATUS_WAITING_FOR_SPECIFIC_BUFFER(buffer.id)
    },
    WAKE_WAITING_FOR_SPECIFIC_BUFFER(state, buffer) {
        state.all.filter(
            process => process.status != STATUS_WAITING_FOR_SPECIFIC_BUFFER(buffer.id)
        ).forEach(process => process.status = STATUS_SLEEPING);
    }
};

const actions = {
    enqueueRequest({commit, rootState}, {process, blockNumber, type, data = null}) {
        const count = rootState.disk.blocks.length;
        if( blockNumber < 1 || blockNumber > count ) {
            return alert('Block number must be within disk blocks range!')
        }
        
        blockNumber = parseInt(blockNumber);
        commit('enqueueRequest', {process, blockNumber, type, data});

        if(process.status == STATUS_IDLE) {
            commit('SET_SLEEPING', process);
        }
    },

    async executeReadRequest({commit, dispatch}, process) {
        let readBuffer = process.runningRequest.buffer;
        
        if (readBuffer) {
            dispatch('kernel/brelse', readBuffer, {root: true});
            commit('completeRunningRequest', process);
            return true;
        }
        
        let blockNumber = process.runningRequest.blockNumber;
        let buffer = await dispatch('kernel/bread', { process, blockNumber }, { root: true });

        if (buffer) {
            commit('ASSIGN_BUFFER_TO_REQUEST', {process, buffer});
        }

        return true;
    },

    async executeWriteRequest({ commit, dispatch }, process) {
        let readBuffer = process.runningRequest.buffer;
        let bufferWritten = process.runningRequest.written;

        if(bufferWritten) {
            const buffer = dispatch('kernel/brelse', readBuffer, { root: true });
            commit('completeRunningRequest', process);
            return buffer;
        }

        if (readBuffer) {
            const data = process.runningRequest.data;
            commit('buffercache/WRITE_ON_BUFFER', { buffer: readBuffer, data}, { root: true });
            commit('REQUEST_WRITTEN', process);
            return false;
        }
        

        let blockNumber = process.runningRequest.blockNumber;
        let buffer = await dispatch('kernel/bread', { process, blockNumber }, { root: true });

        if (buffer) {
            commit('ASSIGN_BUFFER_TO_REQUEST', { process, buffer });
        }

        return false;
    },

    runProcess({commit, dispatch, getters}, process) {
        return new Promise(async (resolve) => {
            if(!process.runningRequest) {
                commit('startQueuedRequest', process);
            }
        
            commit('SET_RUNNING', process);
            let type = process.runningRequest.type.replace('IO_TYPE_', '')
            type = type.charAt(0).toUpperCase() + type.substr(1).toLowerCase();
    
            const result = await dispatch(`execute${type}Request`, process);

            if (!getters.isWaitingForBuffer(process)) {
                commit('SET_SLEEPING', process);
            }

            if (!process.runningRequest && process.queuedRequests.length < 1) {
                commit('SET_IDLE', process);
            }

            return setTimeout(resolve, 300, result);
        });
    }
};


export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
}