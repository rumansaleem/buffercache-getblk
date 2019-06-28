export const STATUS_RUNNING = 'RUNNING';
export const STATUS_PAUSED = 'PAUSED';
export const STATUS_IDLE = 'IDLE';
export const STATUS_SLEEPING_FOR_ANY_BUFFER = 'SLEEP_FOR_ANY_BUFFER';
export const STATUS_SLEEPING_FOR_SPECIFIC_BUFFER = (id) => `SLEEP_FOR_BUFFER_${id}`;

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
    status: STATUS_PAUSED,
    newRequestId: 1,
});

const state = {
    all: [],
    newProcessId: 1,
};

const getters = {
    processById: (state) => (pid) => state.all[pid],
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

    SET_PAUSED(state, process) {
        process.status = STATUS_PAUSED;
    },

    SET_RUNNING(state, process) {
        process.status = STATUS_RUNNING;
    }
};

const actions = {
    enqueueRequest({commit, rootState}, {process, blockNumber, type, data = null}) {
        const count = rootState.disk.blocks.length;
        if( blockNumber > 0 && blockNumber <= count ) {
            blockNumber = parseInt(blockNumber);
            return commit('enqueueRequest', {process, blockNumber, type, data});
        }

        alert('Block number must be within disk blocks range!')
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
            const buffer =  dispatch('kernel/brelse', readBuffer, { root: true });
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

    async runProcess({commit, dispatch}, process) {
        
        if(!process.runningRequest) {
            if (process.queuedRequests.length < 1) {
                commit('SET_IDLE', process);
                return false;
            }
            commit('startQueuedRequest', process);
        }
        
        commit('SET_RUNNING', process);
        let type = process.runningRequest.type
        type = type.charAt(0).toUpperCase() + type.substr(1);

        await dispatch(`execute${type}Request`, process);
        commit('SET_PAUSED', process);
        return true;
    }
};


export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
}