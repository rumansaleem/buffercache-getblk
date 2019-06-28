import hashqueue from './hashqueue';
import freelist from './freelist';

const createBuffer = (id) =>  ({
    id: id,
    blockNumber: null,
    data: null,
    locked: false, 
    delayWrite: false,
    validData: true,
    old: false,
});

const initialiseBuffers = (size) => new Array(size).fill(0).map((_, i) => createBuffer(i + 1));

const state = {
    buffers: [],
};

const modules = {
    freelist,
    hashqueue
}

const getters = {
    isOld: () => buffer => buffer.old,
    isLocked: () => buffer => buffer.locked,
    isDelayedWrite: () => buffer => buffer.delayWrite,
    isDataValid: () => buffer => buffer.validData,
};

const mutations = {
    INIT(state, count) {
        state.buffers = initialiseBuffers(count);
    },
    LOCK_BUFFER (state, buffer) {
        buffer.locked = true;
    },
    UNLOCK_BUFFER(state, buffer) {
        buffer.locked = false;
    },
    REASSIGN_BUFFER(state, {buffer, blockNumber}) {
        buffer.blockNumber = blockNumber;
        buffer.validData = false;
    },
    READ_IN_BUFFER(state, {buffer, data}) {
        buffer.data = data;
        buffer.validData = true;
    },
    WRITE_ON_BUFFER(state, {buffer, data}) {
        buffer.data = data;
        buffer.delayWrite = true;
    },
    MARK_BUFFER_OLD(state, buffer) {
        buffer.old = true;
    },
    MARK_BUFFER_NOT_OLD(state, buffer) {
        buffer.old = false;
    },
};

const actions = {
    init({commit, state}, {bufferCount, hashQueueSize}) {
        commit('INIT', bufferCount);
        commit('buffercache/freelist/INIT', state.buffers, {root: true});
        commit('buffercache/hashqueue/INIT', hashQueueSize, {root: true});
    }
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
    modules,
}