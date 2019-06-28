const state = {
    list: []
}

const getters = {
    isEmpty: state => state.list.length < 1,
    first: (state) => state.list[0],
}

const mutations = {
    INIT: (state, buffers) => state.list = [...buffers],
    POP: (state, index = 0) => state.list.splice(index, 1),
    APPEND: (state, buffer) => state.list.push(buffer),
    PREPEND: (state, buffer) => state.list.unshift(buffer),
}

const actions = {
    POP: ({commit, getters}) => {
        if(getters.isEmpty) {
            return null;
        }

        const buffer = getters.first;
        commit('POP');
        return buffer;
    },
    REMOVE: ({commit, state}, buffer) => {
        const index = state.list.findIndex(buf => buf.id == buffer.id);
        if (index > -1) {
            commit('POP', index)
            return buffer
        }
        return false;
    }
}


export default {
    namespaced: true,
    state, 
    getters,
    mutations,
    actions,
}