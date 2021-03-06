
const state = {
    isRunning: false,
}

const getters = {

}

const mutations = {

}

const actions = {
    getblk({commit, dispatch, rootGetters}, {process, blockNumber}) {
        return new Promise(async (resolve) => {
            if (rootGetters['buffercache/hashqueue/has'](blockNumber)) {
                let buffer = rootGetters['buffercache/hashqueue/get'](blockNumber);
                
                // # Scenario 1
                if (!rootGetters['buffercache/isLocked'](buffer)) {
                    commit('buffercache/LOCK_BUFFER', buffer, {root: true});
                    dispatch('buffercache/freelist/REMOVE', buffer, {root: true});
                    return resolve(buffer);
                }
    
                //Scenario 3
                commit('processes/WAIT_FOR_SPECIFIC_BUFFER', {process, buffer}, {root: true});
                return resolve(false);
            }

            if (rootGetters['buffercache/freelist/isEmpty']) {
                commit('processes/WAIT_FOR_ANY_BUFFER', process, {root: true});
                return resolve(false);
                // this.eventBus.sleep(EventBus.EVENT_WAIT_ANY_BUFFER);
                // this.eventBus.clear(EventBus.EVENT_WAIT_ANY_BUFFER);
                // continue;
            }
    
            let buffer = await dispatch('buffercache/freelist/POP', null, {root: true});
            commit('buffercache/LOCK_BUFFER', buffer, {root:true});

            if (buffer.delayWrite) {
                dispatch('bwrite', {buffer, synchronous: false})
                    .then(() => setTimeout(dispatch, 0, 'brelse', buffer));
                return resolve( await dispatch('getblk', {process, blockNumber}));
            }
    
            const oldBlockNumber = buffer.blockNumber;
            commit('buffercache/REASSIGN_BUFFER', {buffer, blockNumber}, { root: true });
            await dispatch('buffercache/hashqueue/REASSEMBLE', {buffer, oldBlockNumber}, {root:true});
            return resolve(buffer);
        });
    },

    brelse({ commit, rootGetters }, buffer) {
        commit('processes/WAKE_WAITING_FOR_ANY_BUFFER', null, {root: true});
        commit('processes/WAKE_WAITING_FOR_SPECIFIC_BUFFER', buffer, {root: true});

        const isDataValid = rootGetters['buffercache/isDataValid'];
        const isOld = rootGetters['buffercache/isOld'];

        if (isDataValid(buffer) && !isOld(buffer)) {
            commit('buffercache/freelist/APPEND', buffer, {root: true});
        }
        else {
            commit('buffercache/freelist/PREPEND', buffer, {root: true});
        }

        commit('buffercache/UNLOCK_BUFFER', buffer, {root: true});
        return buffer;
    },
    
    bread({commit, dispatch, rootGetters}, {process, blockNumber}) {
        return new Promise(async (resolve) => {
            let buffer = await dispatch('getblk', {process, blockNumber});
    
            if(!buffer) {
                return setTimeout(resolve, 1000, false);
            }
    
            if (rootGetters['buffercache/isDataValid'](buffer)) {
                return setTimeout(resolve, 1000, buffer);
            }
            
            // # initiate synchronous disk read
            const data = await dispatch('disk/READ', buffer.blockNumber, {root:true});
            commit('buffercache/READ_IN_BUFFER', { buffer, data }, {root: true});
            return setTimeout(resolve, 1000, buffer);
        }) ;
    },
    
    async bwrite({dispatch, commit, rootGetters}, {buffer, synchronous = false}) {
            const isDelayedWrite = rootGetters['buffercache/isDelayedWrite'];
            if (synchronous) {
                await dispatch('disk/WRITE', buffer, {root: true});
                return this.brelse(buffer);
            }
            dispatch('disk/WRITE', buffer, {root: true}).then(null);
            if (isDelayedWrite(buffer)) {
                commit('buffercache/MARK_BUFFER_OLD', buffer, {root: true})
            }
        }
    }


export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
}
        
