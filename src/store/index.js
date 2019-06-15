import Vue from 'vue';
import Vuex from 'vuex';

import buffercache from './buffercache';
import disk from './disk';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        buffercache,
        disk,
    },
    strict: true,
});

export default store;