const state = {
    hashTable: [],
};

const getters = {
    hash: state => key => key % state.hashTable.length,
    get: (state, getters) => blockNumber => {
        const index = getters.hash(blockNumber);
        const queue = state.hashTable[index];
        return queue && queue.find(buffer => buffer.blockNumber == blockNumber);
    },
    has: (_, getters) => blockNumber => !!getters.get(blockNumber),
};

const mutations = {
    INIT: (state, size) => {
        state.hashTable = new Array(size).fill(0).map(() => new Array(0));
    },
    INSERT_IN (state, {index, buffer}) {
        const queue = state.hashTable[index];
        return queue && queue.push(buffer);
    },
    REMOVE_FROM (state, {index, bufferIndex}) {
        state.hashTable[index].splice(bufferIndex, 1);
    },
};

const actions = {
    INSERT({commit, getters}, buffer) {
        const index = getters.hash(buffer.blockNumber);

        commit('INSERT_IN', {index, buffer});

        return buffer;
    },
    REMOVE ({commit, state, getters}, buffer) {
        const blockNumber = buffer.blockNumber;
        
        const index = getters.hash(blockNumber);
        const bufferIndex = state.hashTable.findIndex(
            buf => buf.blockNumber = blockNumber
        );
        
        commit('REMOVE_FROM', {index, bufferIndex});
        
        return buffer;
    },
    REASSEMBLE({commit, state, dispatch, getters}, {oldBlockNumber, buffer}) {
        if (!oldBlockNumber) {
            return dispatch('INSERT', buffer);
        }
        const index = getters.hash(oldBlockNumber);
        const bufferIndex = state.hashTable.findIndex(
            buf => buf.id == buffer.id
        );

        commit('REMOVE_FROM', {index, bufferIndex});
        
        return dispatch('INSERT', buffer);
    }
}

export default {
    namespaced: true,
    state, 
    getters, 
    mutations,
    actions,    
}
