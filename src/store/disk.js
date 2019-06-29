export const INITIALISE = 'initialise';

const createBlock = (blockNumber) => ({
    id: blockNumber,
    blockNumber,
    data: null,
});

const initialiseDiskBlocks = (size) => new Array(size).fill(0).map((_, i) => createBlock(i + 1));

const state = {
    blocks: [],
    isReading: false,
    isWriting: false,
};

const getters = {
    isIdle: state => !state.isReading && !state.isWriting,
};

const mutations = {
    [INITIALISE](state, count) {
        state.blocks = initialiseDiskBlocks(count);
    },
    WRITE (state, {block, data}) {
        block.data = data;
    },
    MARK_READING (state) {
        state.isReading = true
    },
    DONE_READING (state) {
        state.isReading = false
    },
    MARK_WRITING(state) {
        state.isWriting = true
    },
    DONE_WRITING(state) {
        state.isWriting = false
    },
};

const actions = {
    READ: ({state, commit}, blockNumber) => new Promise((resolve, reject) => {
        commit('MARK_READING');
        const block = state.blocks.find(block => block.blockNumber == blockNumber);
        
        if(!block) {
            return reject(block);
        }
        
        return setTimeout(() => {
            commit('DONE_READING');
            resolve(block.data);
        }, 1000, block.data);
    }),
    WRITE: ({state, commit}, {blockNumber, data}) => new Promise((resolve, reject) => {
        commit('MARK_WRITING');

        const block = state.blocks.find(block => block.blockNumber == blockNumber);
        
        if(!block) {
            return reject('Invalid block Number');
        }
        
        return setTimeout(() => {
            commit('WRITE', {block, data});
            commit('DONE_WRITING');
            resolve(data);
        }, 4000,);
    }),
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
}