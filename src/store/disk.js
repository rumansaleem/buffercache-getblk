export const INITIALISE = 'initialise';

const createBlock = (blockNumber) => ({
    id: blockNumber,
    blockNumber,
    data: null,
});

const initialiseDiskBlocks = (size) => new Array(size).fill(0).map((_, i) => createBlock(i + 1));

const state = {
    blocks: [],
};

const getters = {

};

const mutations = {
    [INITIALISE](state, count) {
        state.blocks = initialiseDiskBlocks(count);
    },
};

const actions = {
    READ: ({state}, blockNumber) => new Promise((resolve, reject) => {
        const block = state.blocks.find(block => block.blockNumber == blockNumber);
        if(!block) {
            reject(block);
        }
        setTimeout(resolve, 1000, block.data);
    })
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
}